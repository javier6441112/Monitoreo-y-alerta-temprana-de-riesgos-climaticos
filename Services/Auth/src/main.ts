import 'reflect-metadata';
import { Body, CanActivate, Catch, Controller, Delete, ExecutionContext, Get, HttpCode, HttpException, Injectable, Module, Param, Patch, Post, Put, Query, Req, Res, SetMetadata, UnauthorizedException, UseGuards, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, NestFactory, Reflector } from '@nestjs/core';
import { Pool } from 'pg';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { hash, verify } from './password';

const required = (name: string): string => { const v = process.env[name]; if (!v) throw new Error('Missing '+name); return v; };
const secret = required('JWT_KEY'), serviceKey = required('SERVICE_KEY');
if (Buffer.byteLength(secret) < 32 || Buffer.byteLength(serviceKey) < 32) throw new Error('Keys require at least 32 bytes');
const issuer = required('JWT_ISSUER'), audience = required('JWT_AUDIENCE');
const pool = new Pool({ connectionString: required('DATABASE_URL'), connectionTimeoutMillis: 5000, statement_timeout: 10000 });
const roles = ['ADMIN', 'OPERADOR', 'CONSULTA'];
const permissions = ['reports:generate', 'reports:read', 'reports:download'];
const publicUrl = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');
const oauthProviders = ['google', 'github'] as const;
type OAuthProvider = typeof oauthProviders[number];
const Public = () => SetMetadata('public', true);
const Admin = () => SetMetadata('roles', ['ADMIN']);
type AuthRequest = Request & { user: JwtPayload };
function fail(status: number, message: string): never { throw new HttpException(message, status); }
function text(body: any, field: string, max = 200): string {
  const value = body?.[field]; if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, 'Invalid '+field);
  return value.trim();
}
function safeUser(row: any) {
  return { id: row.id, username: row.username, nombre: row.nombre, rol: row.rol, activo: row.activo, fechaCreacion: row.fecha_creacion, ultimoAcceso: row.ultimo_acceso };
}
function oauthEnabled(provider: OAuthProvider) {
  return !!publicUrl && !!process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`] && !!process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_SECRET`];
}
function oauthConfig(provider: OAuthProvider) {
  if (!oauthEnabled(provider)) fail(503, `OAuth provider ${provider} is not configured`);
  const prefix = `OAUTH_${provider.toUpperCase()}`;
  return { clientId: required(`${prefix}_CLIENT_ID`), clientSecret: required(`${prefix}_CLIENT_SECRET`), redirectUri: `${publicUrl}/api/auth/oauth/${provider}/callback` };
}
function cookie(request: Request, name: string) {
  const encoded = request.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(name+'='))?.slice(name.length+1);
  return encoded ? decodeURIComponent(encoded) : undefined;
}
function oauthStateCookie(provider: OAuthProvider, state: string) {
  return `oauth_${provider}_state=${encodeURIComponent(state)}; Path=/api/auth/oauth/${provider}; Max-Age=600; HttpOnly; Secure; SameSite=Lax`;
}
function clearOAuthStateCookie(provider: OAuthProvider) {
  return `oauth_${provider}_state=; Path=/api/auth/oauth/${provider}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
function providerFrom(value: string): OAuthProvider {
  if (!oauthProviders.includes(value as OAuthProvider)) fail(404, 'Unknown OAuth provider');
  return value as OAuthProvider;
}
async function issueFor(user: any) {
  const granted = (await pool.query('SELECT permission FROM role_permissions WHERE role=$1', [user.rol])).rows.map(row=>row.permission);
  const token = jwt.sign({ name:user.username, role:user.rol, permissions:granted, version:user.token_version }, secret,
    { algorithm:'HS256', issuer, audience, subject:String(user.id), jwtid:randomUUID(), expiresIn:'1h' });
  return { token, expiresAt:new Date(Date.now()+60*60*1000).toISOString() };
}
async function fetchJson(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Provider request failed: ${response.status}`);
  return await response.json() as Record<string, unknown>;
}
async function externalProfile(provider: OAuthProvider, code: string) {
  const config = oauthConfig(provider);
  if (provider === 'google') {
    const tokens = await fetchJson('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({code,client_id:config.clientId,client_secret:config.clientSecret,redirect_uri:config.redirectUri,grant_type:'authorization_code'}) });
    const accessToken = typeof tokens.access_token === 'string' ? tokens.access_token : '';
    if (!accessToken) throw new Error('Google did not return an access token');
    const profile = await fetchJson('https://openidconnect.googleapis.com/v1/userinfo', { headers:{Authorization:`Bearer ${accessToken}`} });
    if (typeof profile.sub !== 'string') throw new Error('Google profile missing subject');
    return { subject:profile.sub, name:typeof profile.name === 'string' ? profile.name : 'Usuario Google' };
  }
  const tokens = await fetchJson('https://github.com/login/oauth/access_token', { method:'POST', headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({code,client_id:config.clientId,client_secret:config.clientSecret,redirect_uri:config.redirectUri}) });
  const accessToken = typeof tokens.access_token === 'string' ? tokens.access_token : '';
  if (!accessToken) throw new Error('GitHub did not return an access token');
  const profile = await fetchJson('https://api.github.com/user', { headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/vnd.github+json','User-Agent':'weather-risk-auth'} });
  if (typeof profile.id !== 'number') throw new Error('GitHub profile missing subject');
  return { subject:String(profile.id), name:typeof profile.name === 'string' && profile.name.trim() ? profile.name : typeof profile.login === 'string' ? profile.login : 'Usuario GitHub' };
}
async function externalUser(provider: OAuthProvider, profile: {subject:string,name:string}) {
  const found = await pool.query('SELECT u.* FROM external_identities i JOIN users u ON u.id=i.user_id WHERE i.provider=$1 AND i.subject=$2', [provider,profile.subject]);
  if (found.rows[0]) return found.rows[0];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT u.* FROM external_identities i JOIN users u ON u.id=i.user_id WHERE i.provider=$1 AND i.subject=$2 FOR UPDATE', [provider,profile.subject]);
    if (existing.rows[0]) { await client.query('COMMIT'); return existing.rows[0]; }
    const username = `oauth_${provider}_${profile.subject}`.slice(0,100);
    const created = await client.query("INSERT INTO users(username,password_hash,nombre,rol) VALUES($1,$2,$3,'CONSULTA') RETURNING *", [username,hash(randomBytes(32).toString('hex')),profile.name.slice(0,200)]);
    await client.query('INSERT INTO external_identities(user_id,provider,subject) VALUES($1,$2,$3)', [created.rows[0].id,provider,profile.subject]);
    await client.query('COMMIT');
    return created.rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function audit(user: string, action: string, entity = 'auth', id?: number) {
  try {
    const response = await fetch(required('AUDIT_URL')+'/internal/audit/events', {
      method: 'POST', headers: { 'Content-Type':'application/json', 'X-Service-Key':serviceKey },
      body: JSON.stringify({ eventId:randomUUID(), usuarioId:user, accion:action, entidad:entity, entidadId:id, descripcion:action, fechaHora:new Date().toISOString() }), signal:AbortSignal.timeout(5000)
    });
    if (!response.ok) console.error('Audit delivery failed', action, response.status);
  } catch { console.error('Audit unavailable', action); }
}
async function identity(token: string): Promise<JwtPayload> {
  try {
    const claims = jwt.verify(token, secret, { algorithms:['HS256'], issuer, audience }) as JwtPayload;
    if (!claims.sub || !claims.jti || !claims.exp) throw new Error();
    const result = await pool.query('SELECT u.*, EXISTS(SELECT 1 FROM revoked_tokens WHERE token_id=$2 AND expires_at>now()) revoked FROM users u WHERE id=$1', [claims.sub, claims.jti]);
    const user = result.rows[0];
    if (!user?.activo || user.revoked || user.token_version !== claims.version || user.rol !== claims.role) throw new Error();
    return claims;
  } catch (e) { throw new UnauthorizedException('Invalid or inactive session'); }
}

@Injectable()
class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (request.path.startsWith('/internal/')) {
      const supplied = Buffer.from(String(request.headers['x-service-key'] ?? ''));
      const expected = Buffer.from(serviceKey);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new UnauthorizedException();
      return true;
    }
    if (this.reflector.get<boolean>('public', context.getHandler())) return true;
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException();
    request.user = await identity(authorization.slice(7));
    const allowed = this.reflector.get<string[]>('roles', context.getHandler());
    if (allowed && !allowed.includes(request.user.role)) fail(403, 'Insufficient role');
    return true;
  }
}
@Catch()
class Errors implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status = error instanceof HttpException ? error.getStatus() : error.code === '23505' ? 409 : 503;
    const title = error instanceof HttpException ? error.message : status === 409 ? 'Already exists' : 'Service unavailable';
    response.status(status).type('application/problem+json').json({ status, title, instance:request.path });
  }
}
@Controller()
class Api {
  @Get('/health') @Public() health() { return { status:'ok', service:'auth' }; }
  @Get('/ready') @Public() async ready() { await pool.query('SELECT 1'); return { status:'ok' }; }
  @Post('/api/auth/login') @Public() @HttpCode(200)
  async login(@Body() body: any) {
    const username = text(body, 'username', 100), password = text(body, 'password', 500);
    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    const user = result.rows[0];
    if (!user?.activo || !verify(password, user.password_hash)) throw new UnauthorizedException('Credenciales inválidas');
    const { token, expiresAt } = await issueFor(user);
    await pool.query('UPDATE users SET ultimo_acceso=now() WHERE id=$1', [user.id]);
    await audit(String(user.id), 'LOGIN');
    return { token, tokenType:'Bearer', expiresAt, user:safeUser(user) };
  }
  // Esta ruta debe declararse antes de /:provider; de lo contrario Express
  // interpreta "providers" como el nombre de un proveedor.
  @Get('/api/auth/oauth/providers') @Public()
  oauthProviders() { return { google:oauthEnabled('google'), github:oauthEnabled('github') }; }
  @Get('/api/auth/oauth/:provider') @Public()
  oauthStart(@Param('provider') providerName: string, @Res() response: Response) {
    const provider = providerFrom(providerName), config = oauthConfig(provider);
    const state = randomBytes(32).toString('base64url');
    const endpoint = provider === 'google' ? 'https://accounts.google.com/o/oauth2/v2/auth' : 'https://github.com/login/oauth/authorize';
    const query = new URLSearchParams({client_id:config.clientId,redirect_uri:config.redirectUri,response_type:'code',state,
      scope:provider === 'google' ? 'openid profile email' : 'read:user'});
    response.setHeader('Set-Cookie', oauthStateCookie(provider,state));
    return response.redirect(302, endpoint+'?'+query.toString());
  }
  @Get('/api/auth/oauth/:provider/callback') @Public()
  async oauthCallback(@Param('provider') providerName: string, @Query() query: any, @Req() request: Request, @Res() response: Response) {
    const provider = providerFrom(providerName), state = typeof query.state === 'string' ? query.state : '';
    const expected = cookie(request,`oauth_${provider}_state`) ?? '';
    response.setHeader('Set-Cookie', clearOAuthStateCookie(provider));
    if (!state || state.length !== expected.length || !timingSafeEqual(Buffer.from(state),Buffer.from(expected))) return response.redirect(302, `${publicUrl}/login#oauth_error=invalid_state`);
    if (typeof query.error === 'string' || typeof query.code !== 'string') return response.redirect(302, `${publicUrl}/login#oauth_error=cancelled`);
    try {
      const user = await externalUser(provider,await externalProfile(provider,query.code));
      if (!user.activo) return response.redirect(302, `${publicUrl}/login#oauth_error=inactive`);
      const {token,expiresAt} = await issueFor(user);
      await pool.query('UPDATE users SET ultimo_acceso=now() WHERE id=$1',[user.id]);
      await audit(String(user.id),'LOGIN_OAUTH','auth',user.id);
      return response.redirect(302, `${publicUrl}/login#oauth_token=${encodeURIComponent(token)}&oauth_expires_at=${encodeURIComponent(expiresAt)}`);
    } catch {
      return response.redirect(302, `${publicUrl}/login#oauth_error=failed`);
    }
  }
  @Get('/api/auth/me') async me(@Req() request: AuthRequest) {
    return safeUser((await pool.query('SELECT * FROM users WHERE id=$1', [request.user.sub])).rows[0]);
  }
  @Post('/api/auth/logout') @HttpCode(204)
  async logout(@Req() request: AuthRequest) {
    await pool.query('DELETE FROM revoked_tokens WHERE expires_at<=now()');
    await pool.query('INSERT INTO revoked_tokens(token_id,expires_at) VALUES($1,$2) ON CONFLICT DO NOTHING', [request.user.jti, new Date(request.user.exp!*1000)]);
    await audit(request.user.sub!, 'LOGOUT');
  }
  @Post('/internal/auth/introspect') @HttpCode(200)
  async introspect(@Body() body: any) { const claims = await identity(text(body,'token',16384)); return { active:true, sub:claims.sub, role:claims.role, permissions:claims.permissions }; }
  @Get('/api/usuarios/roles') @Admin() getRoles() { return roles; }
  @Get('/api/auth/permissions') @Admin() getPermissions() { return permissions; }
  @Put('/api/roles/:role/permissions') @Admin()
  async setPermissions(@Param('role') role: string, @Body() body: any) {
    if (!roles.includes(role) || !Array.isArray(body.permissions) || body.permissions.some((p: any)=>!permissions.includes(p))) fail(400,'Invalid permissions');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM role_permissions WHERE role=$1',[role]);
      for (const permission of new Set(body.permissions)) await client.query('INSERT INTO role_permissions VALUES($1,$2)',[role,permission]);
      await client.query('UPDATE users SET token_version=token_version+1 WHERE rol=$1',[role]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    return { role, permissions:body.permissions };
  }
  @Get('/api/usuarios') @Admin()
  async users(@Query() q: any) {
    return (await pool.query("SELECT * FROM users WHERE ($1::text IS NULL OR username ILIKE $1 OR nombre ILIKE $1) AND ($2::text IS NULL OR rol=$2) AND ($3::boolean IS NULL OR activo=$3) ORDER BY id",
      [q.buscar ? '%'+q.buscar+'%' : null, q.rol ?? null, q.activo ?? null])).rows.map(safeUser);
  }
  @Get('/api/usuarios/:id') @Admin()
  async user(@Param('id') id: string) {
    const row = (await pool.query('SELECT * FROM users WHERE id=$1',[id])).rows[0]; if (!row) fail(404,'User not found'); return safeUser(row);
  }
  @Post('/api/usuarios') @Admin()
  async create(@Body() body: any, @Req() request: AuthRequest) {
    const role = text(body,'rol',50).toUpperCase(); if (!roles.includes(role)) fail(400,'Invalid role');
    const password = text(body,'password',500); if (password.length<8) fail(400,'Password requires 8 characters');
    const result = await pool.query('INSERT INTO users(username,password_hash,nombre,rol,activo) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [text(body,'username',100),hash(password),text(body,'nombre'),role,body.activo ?? true]);
    await audit(request.user.sub!,'CREAR_USUARIO','users',result.rows[0].id); return safeUser(result.rows[0]);
  }
  @Put('/api/usuarios/:id') @Admin()
  async update(@Param('id') id: string, @Body() body: any, @Req() request: AuthRequest) {
    const role = text(body,'rol',50).toUpperCase(); if (!roles.includes(role)) fail(400,'Invalid role');
    if (body.password && (typeof body.password!=='string'||body.password.length<8)) fail(400,'Password requires 8 characters');
    const result = await pool.query('UPDATE users SET username=$2,nombre=$3,rol=$4,activo=$5,password_hash=COALESCE($6,password_hash),token_version=token_version+1 WHERE id=$1 RETURNING *',
      [id,text(body,'username',100),text(body,'nombre'),role,body.activo ?? true,body.password ? hash(body.password) : null]);
    if (!result.rows[0]) fail(404,'User not found');
    await audit(request.user.sub!,'EDITAR_USUARIO','users',Number(id)); return safeUser(result.rows[0]);
  }
  @Patch('/api/usuarios/:id/estado') @Admin()
  async state(@Param('id') id: string, @Body() body: any, @Req() request: AuthRequest) {
    if (typeof body.activo!=='boolean') fail(400,'activo required');
    const result = await pool.query('UPDATE users SET activo=$2,token_version=token_version+1 WHERE id=$1 RETURNING *',[id,body.activo]);
    if (!result.rows[0]) fail(404,'User not found');
    await audit(request.user.sub!,'ESTADO_USUARIO','users',Number(id)); return safeUser(result.rows[0]);
  }
}
@Module({ controllers:[Api], providers:[{ provide:APP_GUARD,useClass:AuthGuard },{ provide:APP_FILTER,useClass:Errors }] })
class AppModule {}
async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users(id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,username varchar(100) UNIQUE NOT NULL,password_hash text NOT NULL,nombre varchar(200) NOT NULL,rol varchar(50) NOT NULL CHECK(rol IN ('ADMIN','OPERADOR','CONSULTA')),activo boolean NOT NULL DEFAULT true,fecha_creacion timestamptz NOT NULL DEFAULT now(),ultimo_acceso timestamptz,token_version integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS revoked_tokens(token_id text PRIMARY KEY,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS role_permissions(role varchar(50),permission text,PRIMARY KEY(role,permission));
CREATE TABLE IF NOT EXISTS external_identities(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id integer NOT NULL REFERENCES users(id),provider text NOT NULL,subject text NOT NULL,UNIQUE(provider,subject));
CREATE TABLE IF NOT EXISTS schema_versions(version integer PRIMARY KEY);`);
  const migration = await pool.connect();
  try {
    await migration.query('BEGIN');
    await migration.query('LOCK TABLE schema_versions IN EXCLUSIVE MODE');
    if (!(await migration.query('SELECT 1 FROM schema_versions WHERE version=1')).rowCount) {
      for (const permission of permissions) await migration.query("INSERT INTO role_permissions VALUES('ADMIN',$1) ON CONFLICT DO NOTHING",[permission]);
      await migration.query('INSERT INTO schema_versions VALUES(1)');
    }
    await migration.query('COMMIT');
  } catch(error) { await migration.query('ROLLBACK'); throw error; } finally { migration.release(); }
  if (process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length<12) throw new Error('ADMIN_PASSWORD requires 12 characters');
    await pool.query("INSERT INTO users(username,password_hash,nombre,rol) VALUES($1,$2,'Administrador','ADMIN') ON CONFLICT(username) DO NOTHING",[process.env.ADMIN_USERNAME ?? 'admin',hash(process.env.ADMIN_PASSWORD)]);
  }
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 8080),'0.0.0.0');
  const close = async()=>{ await app.close(); await pool.end(); };
  process.on('SIGTERM',close); process.on('SIGINT',close);
}
main().catch(error=>{ console.error('Auth startup failed',error.message); process.exit(1); });

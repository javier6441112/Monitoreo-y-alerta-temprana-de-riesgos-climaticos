import 'reflect-metadata';
import { Body, CanActivate, Catch, Controller, Delete, ExecutionContext, Get, HttpCode, HttpException, Injectable, Module, Param, Patch, Post, Put, Query, Req, Res, SetMetadata, UnauthorizedException, UseGuards, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, NestFactory, Reflector } from '@nestjs/core';
import { Pool } from 'pg';
import { randomUUID, timingSafeEqual } from 'node:crypto';
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
    const granted = (await pool.query('SELECT permission FROM role_permissions WHERE role=$1', [user.rol])).rows.map(r=>r.permission);
    const token = jwt.sign({ name:user.username, role:user.rol, permissions:granted, version:user.token_version }, secret,
      { algorithm:'HS256', issuer, audience, subject:String(user.id), jwtid:randomUUID(), expiresIn:8*60*60 });
    await pool.query('UPDATE users SET ultimo_acceso=now() WHERE id=$1', [user.id]);
    await audit(String(user.id), 'LOGIN');
    return { token, tokenType:'Bearer', expiresAt:new Date(Date.now()+8*3600000).toISOString(), user:safeUser(user) };
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

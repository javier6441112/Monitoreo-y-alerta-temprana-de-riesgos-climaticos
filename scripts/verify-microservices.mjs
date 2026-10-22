import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=Object.fromEntries((await readFile(path.join(root,'.env'),'utf8')).split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>{const p=l.indexOf('=');return[l.slice(0,p),l.slice(p+1)];}));
const base=process.env.API_URL??'http://127.0.0.1:'+(config.API_PORT??5000);
const suffix=Date.now().toString(36);
const evidence={date:new Date().toISOString(),checks:[],reports:[]};
const pass=(name)=>{evidence.checks.push(name);console.log('PASS '+name);};
async function request(route,{method='GET',token,body,status=200,headers={}}={}){
 const response=await fetch(base+route,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},
 body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});
 assert.equal(response.status,status,method+' '+route+': '+(response.status===status?'':await response.text()));
 if(status===204)return null;
 return response.headers.get('content-type')?.includes('json')?response.json():response;
}
async function login(username,password){
 return (await request('/api/auth/login',{method:'POST',body:{username,password}})).token;
}
function sign(claims){
 const head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify(claims)).toString('base64url');
 return head+'.'+payload+'.'+createHmac('sha256',config.JWT_KEY).update(head+'.'+payload).digest('base64url');
}
try{
 await request('/health'); await request('/api/sensores',{status:401});
 await request('/internal/auth/introspect',{method:'POST',body:{token:'x'},status:401});
 pass('Gateway: salud y acceso anónimo/interno rechazado');
 const token=await login(process.env.INTEGRATION_USERNAME??config.ADMIN_USERNAME??'admin',process.env.INTEGRATION_PASSWORD??config.ADMIN_PASSWORD);
 const me=await request('/api/auth/me',{token}); assert.equal(me.rol,'ADMIN'); assert.ok(me.id>0);
 const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url'));
 for(const altered of [{...claims,exp:1},{...claims,aud:'wrong'},{...claims,iss:'wrong'}])
  await request('/api/sensores',{token:sign(altered),status:401});
 await request('/api/sensores',{token:token.slice(0,-4)+'bad!',status:401});
 pass('Auth/Gateway: login, identidad, expiración, issuer, audience y firma');
 const operatorName='operator-'+suffix, password='Integration-password-123';
 await request('/api/usuarios',{token,method:'POST',status:201,body:{username:operatorName,password,nombre:'Operador de prueba',rol:'OPERADOR',activo:true}});
 const operator=await login(operatorName,password);
 await request('/api/usuarios',{token:operator,status:403});
 await request('/api/reports',{token:operator,status:403});
 await request('/api/bitacora',{token:operator,status:403});
 pass('Roles y permisos en Auth, Report y Audit');
 const community=await request('/api/comunidades',{token,method:'POST',status:201,body:{nombre:'Integración '+suffix,municipio:'Guatemala',departamento:'Guatemala',pais:'Guatemala',latitud:14.6,longitud:-90.5,activo:true}});
 const alias=await request('/api/communities/'+community.id,{token});assert.equal(alias.id,community.id);
 pass('Community: persistencia PostgreSQL y alias del Gateway');
 for(const [name,type,phenomenon,min,max,level]of [
  ['Río','NIVEL_RIO','INUNDACION',3,null,'ROJO'],
  ['Sequía','HUMEDAD','SEQUIA',null,20,'AMARILLO'],
  ['Viento','VIENTO','TORMENTA',40,null,'NARANJA'],
  ['Helada','TEMPERATURA','HELADA',null,0,'ROJO'],
  ['Humo','HUMO','INCENDIO_FORESTAL',5,null,'ROJO'],
  ['Río normal','NIVEL_RIO','INUNDACION',0,2.9,'VERDE']
 ]){
  await request('/api/configuracionalertas',{token,method:'POST',status:201,body:{nombre:name+' '+suffix,tipoSensor:type,fenomeno:phenomenon,valorMinimo:min,valorMaximo:max,nivel:level,mensaje:name,activo:true}});
 }
 const sensorBody={codigo:'E2E-'+suffix,nombre:'Río de prueba',tipo:'NIVEL_RIO',unidad:'m',comunidadId:community.id,latitud:14.6,longitud:-90.5,activo:true,fechaInstalacion:new Date().toISOString(),descripcion:'Prueba de integración'};
 const sensor=await request('/api/sensores',{token,method:'POST',status:201,body:sensorBody});
 const negotiation=await request('/hubs/monitoreo/negotiate?negotiateVersion=1',{token,method:'POST'});
 const socket=new WebSocket(base.replace(/^http/,'ws')+'/hubs/monitoreo?id='+encodeURIComponent(negotiation.connectionToken)+'&access_token='+encodeURIComponent(token));
 const eventReceived=new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{socket.close();reject(new Error('SignalR no publicó lecturaActualizada'));},10000);
  socket.addEventListener('open',()=>socket.send('{"protocol":"json","version":1}'+String.fromCharCode(30)));
  socket.addEventListener('error',()=>{clearTimeout(timeout);reject(new Error('SignalR connection failed'));});
  socket.addEventListener('message',event=>{
   const messages=String(event.data).split(String.fromCharCode(30)).filter(Boolean).map(message=>JSON.parse(message));
   if(messages.some(message=>message.target==='lecturaActualizada')){clearTimeout(timeout);socket.close();resolve();}
  });
 });
 // Complete the JSON hub handshake before publishing the reading.
 await new Promise(resolve=>setTimeout(resolve,300));
 const reading=await request('/api/lecturas',{token:operator,method:'POST',body:{sensorId:sensor.id,valor:5}});
 await eventReceived;
 pass('SignalR: negociación, WebSocket autenticado y evento de lectura');
 assert.equal(reading.sensorId,sensor.id);
 const changed=await request('/api/sensores/'+sensor.id,{token,method:'PUT',body:{...sensorBody,nombre:'Río actualizado'}});
 assert.equal(changed.valorActual,5);assert.ok(changed.ultimaLectura);
 const history=await request('/api/lecturas?sensorId='+sensor.id,{token});assert.ok(history.some(r=>r.id===reading.id));
 pass('Sensor: SQL Server, lecturas, filtros y conservación de última lectura');
 let alerts=[];
 for(let attempt=0;attempt<40;attempt++){
  alerts=await request('/api/alertas?sensorId='+sensor.id,{token});
  if(alerts.length)break;
  await new Promise(r=>setTimeout(r,500));
 }
 assert.ok(alerts.length,'La cola debe entregar la evaluación a Alert');
 assert.equal(alerts[0].nivel,'ROJO');assert.equal(alerts[0].valorMinimo,3);
 const alert=alerts[0];evidence.alertId=alert.id;
 const events=await request('/api/historial?sensorId='+sensor.id,{token});assert.ok(events.some(e=>e.alertaId===alert.id));
 await request('/api/alertas/'+alert.id+'/estado',{token:operator,method:'PATCH',body:{estado:'ATENDIDA'}});
 const closed=await request('/api/alertas/'+alert.id+'/cerrar',{token:operator,method:'POST'});assert.equal(closed.activa,false);
 pass('Alert: evaluación HTTP asíncrona, umbrales, eventos y estados en PostgreSQL');
 const dashboard=await request('/api/dashboard?comunidadId='+community.id,{token});
 assert.equal(dashboard.sensoresTotales,1);assert.equal(dashboard.comunidades,1);
 const communityCounts=await request('/api/comunidades',{token});assert.equal(communityCounts.find(c=>c.id===community.id).sensoresTotales,1);
 pass('Composición de dashboard y conteos mediante APIs');
 await mkdir(path.join(root,'artifacts'),{recursive:true});
 for(const type of ['COMMUNITIES','SENSORS','READINGS','ALERTS','EVENTS','SENSOR_STATUS','CLIMATE_STATISTICS','EXECUTIVE']){
  const key=suffix+'-'+type;
  const report=await request('/api/reports',{token,method:'POST',status:201,headers:{'Idempotency-Key':key},body:{type,filters:{comunidadId:community.id}}});
  assert.equal(report.status,'COMPLETED');assert.ok(report.rowCount>0);
  const repeated=await request('/api/reports',{token,method:'POST',status:201,headers:{'Idempotency-Key':key},body:{type,filters:{comunidadId:community.id}}});
  assert.equal(repeated.id,report.id);
  await request('/api/reports/'+report.id+'/download',{token:operator,status:403});
  const response=await request('/api/reports/'+report.id+'/download',{token});
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,4).toString(),'%PDF');
  await writeFile(path.join(root,'artifacts',type.toLowerCase()+'.pdf'),bytes);
  let metadata=await request('/api/reports/'+report.id,{token});
  for(let wait=0;!metadata.downloadedAt&&wait<10;wait++){await new Promise(r=>setTimeout(r,100));metadata=await request('/api/reports/'+report.id,{token});}
  assert.ok(metadata.downloadedAt);
  evidence.reports.push({type,id:report.id,bytes:bytes.length});
 }
 const reports=await request('/api/reports',{token});assert.ok(reports.total>=8);
 await request('/api/reports',{token,method:'POST',body:{type:'READINGS',filters:{desde:'2026-10-22T00:00:00Z',hasta:'2026-10-01T00:00:00Z'}},status:400});
 pass('Report: ocho PDF reales, metadatos, descarga, idempotencia y filtros');
 const audit=await request('/api/bitacora',{token});assert.ok(audit.some(e=>e.accion==='GENERAR_REPORTE'));
 pass('Audit: registros de operaciones en MongoDB');
 await request('/api/auth/logout',{token:operator,method:'POST',status:204});
 await request('/api/sensores',{token:operator,status:401});
 pass('Logout y revocación centralizada entre servicios');
 evidence.communityId=community.id;evidence.sensorId=sensor.id;
 await writeFile(path.join(root,'artifacts','integration-results.json'),JSON.stringify(evidence,null,2));
 console.log('Pruebas completas. PDF y resultados guardados en artifacts/.');
}catch(error){console.error(error.message);process.exitCode=1;}

import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHmac,randomUUID} from 'node:crypto';
const config=Object.fromEntries((await readFile(new URL('../.env',import.meta.url),'utf8')).split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)];}));
const source=JSON.parse(await readFile(new URL('../artifacts/legacy-export.json',import.meta.url),'utf8'));
const admin=source.Usuarios.find(user=>user.activo&&user.rol==='ADMIN');
// Offline QA only: the developer owns this stack's signing key. Passwords are never reset or printed.
const head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload=Buffer.from(JSON.stringify({sub:String(admin.id),jti:randomUUID(),name:admin.username,role:'ADMIN',
 permissions:['reports:read','reports:generate','reports:download'],version:0,iss:'WeatherRisk.Auth',aud:'WeatherRisk',
 iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+300})).toString('base64url');
const token=head+'.'+payload+'.'+createHmac('sha256',config.JWT_KEY).update(head+'.'+payload).digest('base64url');
const base='http://127.0.0.1:'+(config.API_PORT??5000);
async function request(route,method='GET',body){
 const response=await fetch(base+route,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 assert.ok(response.ok,route+': '+response.status);
 return response;
}
const checks=[['/api/usuarios','Usuarios'],['/api/comunidades','Comunidades'],['/api/sensores','Sensores'],['/api/configuracionalertas','ConfiguracionAlertas']];
for(const[route,table]of checks){
 const rows=await(await request(route)).json();assert.equal(rows.length,source[table].length,table);
 assert.deepEqual(rows.map(row=>row.id).sort((a,b)=>a-b),source[table].map(row=>row.id).sort((a,b)=>a-b));
 console.log('PASS Datos migrados e IDs: '+table+' ('+rows.length+')');
}
const dashboard=await(await request('/api/dashboard')).json();assert.equal(dashboard.sensoresTotales,source.Sensores.length);
const results={date:new Date().toISOString(),counts:Object.fromEntries(Object.entries(source).map(([table,rows])=>[table,rows.length])),reports:[]};
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
for(const type of ['COMMUNITIES','SENSORS','READINGS','ALERTS','EVENTS','SENSOR_STATUS','CLIMATE_STATISTICS','EXECUTIVE']){
 const report=await(await request('/api/reports','POST',{type,filters:{}})).json();assert.equal(report.status,'COMPLETED');
 const file=Buffer.from(await(await request('/api/reports/'+report.id+'/download')).arrayBuffer());assert.equal(file.subarray(0,4).toString(),'%PDF');
 await writeFile(new URL('../artifacts/migrated-'+type.toLowerCase()+'.pdf',import.meta.url),file);
 results.reports.push({id:report.id,type,bytes:file.length});
}
await writeFile(new URL('../artifacts/migration-results.json',import.meta.url),JSON.stringify(results,null,2));
console.log('PASS Dashboard y ocho PDF generados con los datos trasladados');

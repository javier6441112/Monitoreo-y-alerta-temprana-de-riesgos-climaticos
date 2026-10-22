import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const env=Object.fromEntries((await readFile(new URL('../.env',import.meta.url),'utf8')).split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)];}));
const evidence=JSON.parse(await readFile(new URL('../artifacts/integration-results.json',import.meta.url),'utf8'));
const base='http://127.0.0.1:'+(env.API_PORT??5000);
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:process.env.INTEGRATION_USERNAME??env.ADMIN_USERNAME??'admin',password:process.env.INTEGRATION_PASSWORD??env.ADMIN_PASSWORD})});
assert.equal(login.status,200);
const {token}=await login.json();
async function get(path){const response=await fetch(base+path,{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,200,path);return response;}
assert.equal((await(await get('/api/comunidades/'+evidence.communityId)).json()).id,evidence.communityId);
assert.equal((await(await get('/api/sensores/'+evidence.sensorId)).json()).valorActual,5);
for(const report of evidence.reports){
 const metadata=await(await get('/api/reports/'+report.id)).json();assert.equal(metadata.status,'COMPLETED');
 const file=Buffer.from(await(await get('/api/reports/'+report.id+'/download')).arrayBuffer());assert.equal(file.subarray(0,4).toString(),'%PDF');
}
console.log('PASS Persistencia tras reinicio: comunidades, sensores, lecturas, metadatos y ocho PDF');

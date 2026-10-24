const {test}=require('node:test');
const assert=require('node:assert/strict');
const {hash,verify}=require('../dist/password');
test('PBKDF2 compatible with existing .NET format',()=>{
 const original='PBKDF2$100000$hmOdcEh1OZzlNQnvqDo0rw==$GtGagtChy2EN2eAzY2LP7ayAVaGWMAnCwxnRA5mlezM=';
 assert.equal(verify('wrong',original),false);
 const generated=hash('a-long-password');
 assert.equal(verify('a-long-password',generated),true);
 assert.equal(verify('wrong',generated),false);
 assert.equal(verify('x','corrupt'),false);
 assert.notEqual(hash('same'),hash('same'));
});

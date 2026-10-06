import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateCatalogCode } from '../src/codeApi';
test('code changes normalize, send original code and verify confirmed identity', async t => {
 const original = globalThis.fetch; t.after(()=>{globalThis.fetch=original;}); const id='a'.repeat(24), signal=new AbortController().signal;
 for(const kind of ['categories','warehouses'] as const) {
  globalThis.fetch=async (url,options)=>{assert.equal(url,'https://test/'+kind+'/'+id+'/code');assert.equal(options?.method,'PATCH');assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer token');assert.deepEqual(JSON.parse(String(options?.body)),{expectedCode:'OLD',code:'NEW'});return new Response(JSON.stringify({data:{id,name:'Original',code:'NEW',status:'INACTIVE'}}));};
  assert.equal(await updateCatalogCode('https://test','token',kind,{id,code:'OLD'},' new ',signal),'NEW');
 }
 globalThis.fetch=async ()=>new Response(JSON.stringify({data:{id:'foreign',name:'Original',code:'NEW',status:'ACTIVE'}}));
 await assert.rejects(updateCatalogCode('https://test','token','categories',{id,code:'OLD'},'NEW',signal),/Actualiza/);
 globalThis.fetch=async ()=>new Response('',{status:409});
 await assert.rejects(updateCatalogCode('https://test','token','warehouses',{id,code:'OLD'},'NEW',signal),(e:any)=>e.status===409);
 await assert.rejects(updateCatalogCode('https://test','token','categories',{id,code:'OLD'},'x'.repeat(25),signal),/entre 2 y 24/);
 await assert.rejects(updateCatalogCode('https://test','token','warehouses',{id,code:'OLD'},' old ',signal),/diferente/);
});

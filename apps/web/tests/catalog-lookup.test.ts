import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalogLookup} from '../src/catalogApi';
test('web names lookup bounds IDs, preserves inactive history and rejects unrelated records',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const id='a'.repeat(24),signal=new AbortController().signal;
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://test/products/page?ids='+id+'&limit=20');assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[{id,name:'Historical',sku:'TEST',price:1,status:'INACTIVE'}],nextCursor:null}}));};
 assert.equal((await catalogLookup('https://test','products','token',signal,[id,id]))[0].name,'Historical');
 await assert.rejects(catalogLookup('https://test','products','token',signal,Array.from({length:21},(_,i)=>i.toString(16).padStart(24,'0'))));
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[{id:'b'.repeat(24),name:'Foreign',sku:'TEST',price:1,status:'ACTIVE'}],nextCursor:null}}));await assert.rejects(catalogLookup('https://test','products','token',signal,[id]));
});

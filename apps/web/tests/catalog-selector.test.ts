import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogServerPage, catalogLookup } from '../src/catalogApi';
test('server pages authorize and encode searches and cursor without tenant override', async t => {
 const original = globalThis.fetch; t.after(()=>{globalThis.fetch=original;}); const cursor='f'.repeat(24), row={id:'e'.repeat(24),name:'Product',sku:'SKU',price:10,status:'ACTIVE'};
 globalThis.fetch=async (url,opts)=>{const u=new URL(String(url));assert.equal(u.pathname,'/products/page');assert.equal(u.searchParams.get('search'),'A&B');assert.equal(u.searchParams.get('cursor'),cursor);assert.equal(u.searchParams.get('limit'),'20');assert.equal((opts?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 assert.deepEqual(await catalogServerPage('https://test','products','token',new AbortController().signal,'A&B',cursor),{items:[{...row,categoryId:undefined}],nextCursor:null});
});
test('pages reject oversized, duplicate, unordered or invalid cursors and preserve empty pages', async t => {
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const row={id:'e'.repeat(24),name:'Name',taxId:'TAX',email:'test@example.com',status:'ACTIVE'};const read=()=>catalogServerPage('https://test','customers','token',new AbortController().signal);
 for(const data of [{items:[row,row],nextCursor:null},{items:[row],nextCursor:'e'.repeat(24)},{items:[{...row,id:'d'.repeat(24)},row],nextCursor:null},{items:Array.from({length:21},()=>row),nextCursor:null}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(read());}
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[],nextCursor:null}}));assert.deepEqual(await read(),{items:[],nextCursor:null});
 globalThis.fetch=async()=>new Response('',{status:401});await assert.rejects(read(),(e:any)=>e.status===401);
});

test('active selectors reject inactive results; bounded lookups deduplicate and reject unrelated names', async t => {
 const original=globalThis.fetch; t.after(()=>{globalThis.fetch=original;});const id='a'.repeat(24), row={id,name:'Name',taxId:'TAX',email:'test@example.com',status:'ACTIVE'};
 globalThis.fetch=async url=>{const u=new URL(String(url));assert.equal(u.searchParams.get('status'),'ACTIVE');return new Response(JSON.stringify({data:{items:[{...row,status:'INACTIVE'}],nextCursor:null}}));};
 await assert.rejects(catalogServerPage('https://test','customers','token',new AbortController().signal,'','','ACTIVE'));
 globalThis.fetch=async url=>{const u=new URL(String(url));assert.equal(u.searchParams.get('ids'),id);return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 assert.equal((await catalogLookup('https://test','customers','token',new AbortController().signal,[id,id])).length,1);
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[{...row,id:'b'.repeat(24)}],nextCursor:null}}));
 await assert.rejects(catalogLookup('https://test','customers','token',new AbortController().signal,[id]));
 assert.deepEqual(await catalogLookup('https://test','customers','token',new AbortController().signal,[]),[]);
 await assert.rejects(catalogLookup('https://test','customers','token',new AbortController().signal,Array.from({length:21},(_,i)=>i.toString(16).padStart(24,'0'))));
});

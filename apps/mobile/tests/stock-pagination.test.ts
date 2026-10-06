import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stockPageRequest } from '../src/inventoryApi';
test('stock pages encode global search and compound cursor with authorization',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const row={warehouseId:'b'.repeat(24),productId:'c'.repeat(24),quantity:3,productName:'Product'};const cursor='a'.repeat(24)+':'+ 'a'.repeat(24);
 globalThis.fetch=async(url,opts)=>{const u=new URL(String(url));assert.equal(u.pathname,'/stock/page');assert.equal(u.searchParams.get('search'),'A&B');assert.equal(u.searchParams.get('cursor'),cursor);assert.equal(u.searchParams.get('limit'),'20');assert.equal((opts?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 const page=await stockPageRequest('https://test','token',new AbortController().signal,'A&B',cursor);assert.equal(page.items[0].quantity,3);assert.equal(page.items[0].productName,'Product');assert.equal(page.nextCursor,null);
});
test('stock pages reject duplicate pairs, ordering, malformed values and stale cursors',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const row={warehouseId:'b'.repeat(24),productId:'c'.repeat(24),quantity:3};const read=()=>stockPageRequest('https://test','token',new AbortController().signal);
 for(const data of [{items:[row,row],nextCursor:null},{items:[row,{...row,warehouseId:'a'.repeat(24)}],nextCursor:null},{items:[{...row,quantity:'3'}],nextCursor:null},{items:[{...row,warehouseId:'bad'}],nextCursor:null},{items:[row],nextCursor:row.warehouseId+':'+row.productId},{items:Array.from({length:21},()=>row),nextCursor:null}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(read());}
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[],nextCursor:null}}));assert.deepEqual(await read(),{items:[],nextCursor:null});
 globalThis.fetch=async()=>new Response('',{status:401});await assert.rejects(read(),(e:any)=>e.status===401);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { warehousePageRequest, warehouseLookup, movementRequest } from '../src/inventoryApi';
test('warehouse pages authorize and scope search without tenant overrides', async t => {
 const original=globalThis.fetch; t.after(()=>{globalThis.fetch=original;}); const row={id:'e'.repeat(24),name:'Warehouse',code:'WH',status:'ACTIVE'};
 globalThis.fetch=async (url,opts)=>{const u=new URL(String(url));assert.equal(u.pathname,'/warehouses/page');assert.equal(u.searchParams.get('search'),'A&B');assert.equal(u.searchParams.get('cursor'),'f'.repeat(24));assert.equal(u.searchParams.get('status'),'ACTIVE');assert.equal(u.searchParams.get('limit'),'20');assert.equal((opts?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 assert.deepEqual(await warehousePageRequest('https://test','token',new AbortController().signal,'A&B','f'.repeat(24),'ACTIVE'),{items:[row],nextCursor:null});
});
test('warehouse pages reject inactive selection, malformed identities, ordering and cursors', async t => {
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;}); const row={id:'e'.repeat(24),name:'Warehouse',code:'WH',status:'ACTIVE'};
 const read=()=>warehousePageRequest('https://test','token',new AbortController().signal,'','','ACTIVE');
 for(const data of [{items:[{...row,status:'INACTIVE'}],nextCursor:null},{items:[{...row,id:'bad'}],nextCursor:null},{items:[row,row],nextCursor:null},{items:[{...row,id:'d'.repeat(24)},row],nextCursor:null},{items:[row],nextCursor:row.id},{items:Array.from({length:21},()=>row),nextCursor:null}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(read());}
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[],nextCursor:null}}));assert.deepEqual(await read(),{items:[],nextCursor:null});
 globalThis.fetch=async()=>new Response('',{status:401});await assert.rejects(read(),(e:any)=>e.status===401);
});

test('warehouse names lookup bounds requested IDs and preserves inactive historical names',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const id='a'.repeat(24),row={id,name:'Old warehouse',code:'OLD',status:'INACTIVE'};
 globalThis.fetch=async(url,opts)=>{const u=new URL(String(url));assert.equal(u.searchParams.get('ids'),id);assert.equal(u.searchParams.get('status'),null);assert.equal((opts?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 assert.deepEqual(await warehouseLookup('https://test','token',new AbortController().signal,[id,id]),[row]);
 for(const items of [[row,row],[{...row,id:'b'.repeat(24)}]]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{items,nextCursor:null}}));await assert.rejects(warehouseLookup('https://test','token',new AbortController().signal,[id]));}
 globalThis.fetch=async()=>{throw new Error('Empty lookup must not issue a request');};assert.deepEqual(await warehouseLookup('https://test','token',new AbortController().signal,[]),[]);
 await assert.rejects(warehouseLookup('https://test','token',new AbortController().signal,Array.from({length:21},(_,i)=>i.toString(16).padStart(24,'0'))));
});
test('history rejects oversized pages before requesting names',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:Array.from({length:26},()=>({})),nextCursor:null}}));
 await assert.rejects(movementRequest('https://test','token',new AbortController().signal));
});

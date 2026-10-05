import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settlementRequest,receiptRequest} from '../src/settlementApi';
const row={id:'a'.repeat(24),partnerId:'b'.repeat(24),productId:'c'.repeat(24),quantity:3,unitPrice:2,total:6,status:'PENDIENTE'};
const input={warehouseId:'d'.repeat(24),accountId:'e'.repeat(24),date:'2026-10-04'},scope={companyId:'co',branchId:'br'};
const result={id:'f'.repeat(24),stockMovementId:'1'.repeat(24),cashMovementId:'2'.repeat(24),...scope,kind:'sales',sourceId:row.id,...input,total:6,quantity:3,status:'PAGADA'};
test('joint operation sends only source and selectors and confirms scoped receipt',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://test/commercial-settlements');assert.equal((options?.headers as any).Authorization,'Bearer token');assert.deepEqual(JSON.parse(String(options?.body)),{kind:'sales',sourceId:row.id,...input});return new Response(JSON.stringify({data:result}));};
 assert.equal(await settlementRequest('https://test','token','sales',row,input,scope,new AbortController().signal),result.id);
});
test('joint operation rejects unrelated receipts and preserves server conflicts',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 for(const data of [{...result,branchId:'foreign'},{...result,total:7},{...result,quantity:4},{...result,cashMovementId:'bad'},{...result,warehouseId:'3'.repeat(24)}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(settlementRequest('https://test','token','sales',row,input,scope,new AbortController().signal),/mismo documento/);}
 globalThis.fetch=async()=>new Response('{}',{status:409});await assert.rejects(settlementRequest('https://test','token','sales',row,input,scope,new AbortController().signal),(e:any)=>e.status===409);
 globalThis.fetch=async()=>{throw new Error('Invalid date should not request');};await assert.rejects(settlementRequest('https://test','token','sales',row,{...input,date:'2026-02-30'},scope,new AbortController().signal),/Revisa/);
});

test('receipt lookup is read-only and validates scope, links, amounts and real date',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://test/commercial-settlements?kind=sales&sourceId='+row.id);assert.equal(options?.method,undefined);assert.equal(options?.body,undefined);assert.equal((options?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:result}));};
 const request=()=>receiptRequest('https://test','token','sales',row,scope,new AbortController().signal);assert.equal((await request()).stockMovementId,result.stockMovementId);
 for(const patch of [{companyId:'foreign'},{branchId:'foreign'},{sourceId:'3'.repeat(24)},{kind:'purchase-orders'},{total:7},{quantity:4},{accountId:'bad'},{date:'2026-02-30'},{date:'bad'},{status:'PENDIENTE'}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...result,...patch}}));await assert.rejects(request(),/Comprobante inesperado/);}
 globalThis.fetch=async()=>new Response('{}',{status:404});await assert.rejects(request(),(e:any)=>e.status===404);
 globalThis.fetch=async()=>new Response('{}',{status:401});await assert.rejects(request(),(e:any)=>e.status===401);
});

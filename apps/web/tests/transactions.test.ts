import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transactionPageRequest } from '../src/transactionApi';
test('commercial pages encode state and cursor and validate tenant-independent records',async t=>{const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});for(const kind of ['sales','purchase-orders'] as const){const row={id:'e'.repeat(24),customerId:'customer',supplierId:'supplier',productId:'product',quantity:2,unitPrice:10,unitCost:10,total:20,status:'PENDIENTE'};globalThis.fetch=async(url,options)=>{const u=new URL(String(url));assert.equal(u.pathname,'/'+kind+'/page');assert.equal(u.searchParams.get('cursor'),'f'.repeat(24));assert.equal(u.searchParams.get('status'),'PENDIENTE');assert.equal(u.searchParams.get('limit'),'20');assert.equal((options?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};const page=await transactionPageRequest('https://test','token',kind,new AbortController().signal,'f'.repeat(24),'PENDIENTE');assert.equal(page.items.length,1);assert.equal(page.items[0].total,20);assert.equal(page.nextCursor,null);}});
test('commercial pages reject mismatched states, ordering, invalid cursor and inconsistent totals',async t=>{const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const row={id:'e'.repeat(24),customerId:'customer',productId:'product',quantity:2,unitPrice:10,total:20,status:'PENDIENTE'};const read=()=>transactionPageRequest('https://test','token','sales',new AbortController().signal,'','PENDIENTE');for(const data of [{items:[{...row,status:'PAGADA'}],nextCursor:null},{items:[row,row],nextCursor:null},{items:[row],nextCursor:'bad'},{items:[{...row,total:21}],nextCursor:null}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(read());}globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[],nextCursor:null}}));assert.deepEqual(await read(),{items:[],nextCursor:null});await assert.rejects(transactionPageRequest('https://test','token','sales',new AbortController().signal,'','RECIBIDA'));});



import { transactionStatusOptions, updateTransactionStatusRequest, type Transaction } from '../src/transactionApi';
test('status changes enforce transitions and confirm unchanged amounts and identity', async t => {
 const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
 assert.deepEqual(transactionStatusOptions('sales', 'PENDIENTE'), ['PAGADA', 'CANCELADA']);
 assert.deepEqual(transactionStatusOptions('purchase-orders', 'APROBADA'), ['RECIBIDA', 'CANCELADA']);
 assert.deepEqual(transactionStatusOptions('sales', 'PAGADA'), []); assert.deepEqual(transactionStatusOptions('purchase-orders', 'RECIBIDA'), []);
 const current: Transaction = { id: 'a'.repeat(24), partnerId: 'b'.repeat(24), productId: 'c'.repeat(24), quantity: 2, unitPrice: 10, total: 20, status: 'PENDIENTE' };
 const signal = new AbortController().signal;
 globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://test/sales/' + current.id + '/status'); assert.equal(options?.method, 'PATCH');
  assert.equal((options?.headers as Record<string,string>).Authorization, 'Bearer token');
  assert.deepEqual(JSON.parse(String(options?.body)), { expectedStatus: 'PENDIENTE', status: 'PAGADA' });
  return new Response(JSON.stringify({ data: { ...current, customerId: current.partnerId, status: 'PAGADA' } }));
 };
 assert.equal((await updateTransactionStatusRequest('https://test', 'token', 'sales', current, 'PAGADA', signal)).status, 'PAGADA');
 globalThis.fetch = async () => new Response(JSON.stringify({ data: { ...current, customerId: current.partnerId, unitPrice: 15, total: 30, status: 'PAGADA' } }));
 await assert.rejects(updateTransactionStatusRequest('https://test', 'token', 'sales', current, 'PAGADA', signal), /Actualiza el listado/);
 globalThis.fetch = async () => new Response('', { status: 409 });
 await assert.rejects(updateTransactionStatusRequest('https://test', 'token', 'sales', current, 'PAGADA', signal), (error: any) => error.status === 409 && /estado cambió/.test(error.message));
 await assert.rejects(updateTransactionStatusRequest('https://test', 'token', 'sales', { ...current, status: 'PAGADA' }, 'CANCELADA', signal), /no está permitido/);
});

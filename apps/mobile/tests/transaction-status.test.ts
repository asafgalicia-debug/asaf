import { test } from 'node:test';
import assert from 'node:assert/strict';
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

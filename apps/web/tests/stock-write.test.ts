import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStock, validateWarehouse, createStockRequest } from '../src/inventoryApi';
const draft = { warehouseId: 'a'.repeat(24), productId: 'b'.repeat(24), destinationWarehouseId: 'c'.repeat(24), quantity: '2', reference: ' REF-1 ' };
test('stock rejects invalid precision, empty references and identical transfer warehouses', () => {
  for (const quantity of ['0', '-1', '1.0000001', 'Infinity']) assert.throws(() => validateStock('receipts', { ...draft, quantity }));
  assert.throws(() => validateStock('transfers', { ...draft, destinationWarehouseId: draft.warehouseId }));
  assert.throws(() => validateStock('issues', { ...draft, reference: ' ' }));
  assert.deepEqual(validateWarehouse({ name: ' Warehouse ', code: ' wh-1 ' }), { name: 'Warehouse', code: 'WH-1' });
});
test('transfer sends normalized values and confirms signed quantity and destination', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://test/stock/transfers');
    const payload = JSON.parse(String(options?.body));
    assert.equal(payload.reference, 'REF-1'); assert.equal(payload.quantity, 2);
    assert.equal(payload.companyId, undefined);
    assert.equal((options?.headers as any).Authorization, 'Bearer token');
    return new Response(JSON.stringify({ data: { ...payload, id: 'd'.repeat(24), kind: 'TRANSFER', quantity: -2 } }));
  };
  await createStockRequest('https://test', 'token', 'transfers', draft, new AbortController().signal);
});
test('conflicting and unconfirmed writes require checking history before repeating', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => new Response('{}', { status: 409 });
  await assert.rejects(createStockRequest('https://test', 'token', 'issues', draft, new AbortController().signal), (e: any) => e.status === 409);
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { id: 'd'.repeat(24) } }));
  await assert.rejects(createStockRequest('https://test', 'token', 'issues', draft, new AbortController().signal), /historial antes de repetir/);
});

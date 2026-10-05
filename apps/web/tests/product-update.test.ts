import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateProductRequest } from '../src/catalogEditApi';
test('product edit preserves SKU and confirms all editable values', async t => {
 const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
 const id = 'a'.repeat(24); const categoryId = 'b'.repeat(24); const signal = new AbortController().signal;
 const draft = { name: ' New ', sku: 'ORIGINAL', categoryId, price: '12.50' };
 globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://test/products/' + id); assert.equal(options?.method, 'PATCH');
  assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer token');
  const payload = JSON.parse(String(options?.body)); assert.deepEqual(payload, { name: 'New', categoryId, price: 12.5 });
  return new Response(JSON.stringify({ data: { id, ...payload, sku: 'ORIGINAL', status: 'ACTIVE' } }));
 };
 await updateProductRequest('https://test', 'token', id, draft, signal);
 globalThis.fetch = async () => new Response(JSON.stringify({ data: { id, name: 'New', categoryId, price: 12.5, sku: 'CHANGED', status: 'ACTIVE' } }));
 await assert.rejects(updateProductRequest('https://test', 'token', id, draft, signal), /Actualiza el catálogo/);
 globalThis.fetch = async () => new Response('', { status: 403 });
 await assert.rejects(updateProductRequest('https://test', 'token', id, draft, signal), (error: any) => error.status === 403);
 await assert.rejects(updateProductRequest('https://test', 'token', id, { ...draft, price: '0.001' }, signal), /precio/);
 await assert.rejects(updateProductRequest('https://test', 'token', id, { ...draft, categoryId: 'bad' }, signal), /Revisa/);
});

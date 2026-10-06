import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateCatalogStatus, categoryDirectoryRequest } from '../src/api';
test('status writes confirm identity and preserved references for activation and deactivation', async t => {
 const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
 const id = 'a'.repeat(24), signal = new AbortController().signal;
 for (const kind of ['categories','warehouses'] as const) for (const status of ['ACTIVE','INACTIVE'] as const) {
  const entry = { id, name: 'Original', code: 'CODE', status }; const next = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  globalThis.fetch = async (url, options) => { assert.equal(url, 'https://test/' + kind + '/' + id + '/status'); assert.equal(options?.method, 'PATCH'); assert.equal((options?.headers as any).Authorization, 'Bearer token'); assert.deepEqual(JSON.parse(String(options?.body)), { expectedStatus: status, status: next }); return new Response(JSON.stringify({ data: { ...entry, status: next } })); };
  assert.equal(await updateCatalogStatus('https://test', 'token', kind, entry, signal), next);
 }
 const entry = { id, name: 'Original', code: 'CODE', status: 'ACTIVE' as const };
 globalThis.fetch = async () => new Response(JSON.stringify({ data: { ...entry, code: 'CHANGED', status: 'INACTIVE' } }));
 await assert.rejects(updateCatalogStatus('https://test', 'token', 'warehouses', entry, signal), /Actualiza el catálogo/);
 globalThis.fetch = async () => new Response('', { status: 409 });
 await assert.rejects(updateCatalogStatus('https://test', 'token', 'categories', entry, signal), (e: any) => e.status === 409 && /estado cambió/.test(e.message));
});
test('category directory keeps inactive categories for reactivation and rejects duplicate identities', async t => {
 const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; }); const row = { id: 'a', name: 'Original', code: 'CODE', status: 'INACTIVE' };
 globalThis.fetch = async () => new Response(JSON.stringify({ data: [row] })); assert.deepEqual(await categoryDirectoryRequest('https://test','token',new AbortController().signal), [row]);
 globalThis.fetch = async () => new Response(JSON.stringify({ data: [row,row] })); await assert.rejects(categoryDirectoryRequest('https://test','token',new AbortController().signal), /inesperadas/);
});

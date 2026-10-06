import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renameCatalogEntry } from '../src/api';
test('renames send expected original name and verify identity and new name', async t => {
 const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
 const id = 'a'.repeat(24), signal = new AbortController().signal;
 for (const kind of ['categories', 'warehouses'] as const) {
  globalThis.fetch = async (url, options) => {
   assert.equal(url, 'https://test/' + kind + '/' + id); assert.equal(options?.method, 'PATCH');
   assert.equal((options?.headers as Record<string,string>).Authorization, 'Bearer token');
   assert.deepEqual(JSON.parse(String(options?.body)), { expectedName: 'Old name', name: 'New name' });
   return new Response(JSON.stringify({ data: { id, name: 'New name', code: 'ORIGINAL', status: 'INACTIVE' } }));
  };
  assert.equal(await renameCatalogEntry('https://test', 'token', kind, id, 'Old name', ' New name ', signal), 'New name');
 }
 globalThis.fetch = async () => new Response(JSON.stringify({ data: { id: 'foreign', name: 'New name', code: 'CODE', status: 'ACTIVE' } }));
 await assert.rejects(renameCatalogEntry('https://test', 'token', 'categories', id, 'Old name', 'New name', signal), /Actualiza el catálogo/);
 globalThis.fetch = async () => new Response('', { status: 409 });
 await assert.rejects(renameCatalogEntry('https://test', 'token', 'warehouses', id, 'Old name', 'New name', signal), (error: any) => error.status === 409 && /nombre cambió/.test(error.message));
 await assert.rejects(renameCatalogEntry('https://test', 'token', 'categories', id, 'Old name', 'A', signal), /entre 2 y 100/);
});

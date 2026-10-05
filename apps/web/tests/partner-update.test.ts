import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updatePartner } from '../src/catalogEditApi';
test('contact updates confirm identity and payload, and flag uncertain writes', async (t) => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  const id = 'a'.repeat(24); const signal = new AbortController().signal;
  const draft = { name: ' Contact ', taxId: ' tax-1 ', email: ' TEST@example.com ' };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://test/customers/' + id); assert.equal(options?.method, 'PATCH');
    assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer token');
    const payload = JSON.parse(String(options?.body));
    assert.deepEqual(payload, { name: 'Contact', taxId: 'TAX-1', email: 'test@example.com' });
    return new Response(JSON.stringify({ data: { id, ...payload, status: 'INACTIVE' } }));
  };
  await updatePartner('https://test', 'customers', 'token', id, draft, signal);
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { id: 'foreign' } }));
  await assert.rejects(updatePartner('https://test', 'suppliers', 'token', id, draft, signal), /Actualiza el catálogo/);
  globalThis.fetch = async () => new Response('', { status: 409 });
  await assert.rejects(updatePartner('https://test', 'suppliers', 'token', id, draft, signal), (error: any) => error.status === 409);
  await assert.rejects(updatePartner('https://test', 'customers', 'token', 'bad', draft, signal), /válido/);
});

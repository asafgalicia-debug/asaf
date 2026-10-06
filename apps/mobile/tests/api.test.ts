import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStockRequest, createWarehouseRequest, filterBalances, inventoryLabel, movementRequest, stockRequest, validateStock, validateWarehouse, warehousesRequest } from '../src/inventoryApi';
import { ApiError, catalogPage, catalogRequest, categoriesRequest, createCategoryRequest, createPartner, createProductRequest, dashboardRequest, loginRequest, requestData, validateCategory, validatePartner, validateProduct } from '../src/api';

test('mobile API contracts and safe errors', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  await t.test('warehouse validation normalizes code and enforces API boundaries', () => {
    assert.deepEqual(validateWarehouse({ name: ' Central ', code: ' ctr ' }), { name: 'Central', code: 'CTR' });
    for (const name of ['A', 'a'.repeat(101)]) assert.throws(() => validateWarehouse({ name, code: 'AB' }), /nombre/);
    for (const code of ['A', 'a'.repeat(33)]) assert.throws(() => validateWarehouse({ name: 'Central', code }), /código/);
    assert.equal(validateWarehouse({ name: 'a'.repeat(100), code: 'a'.repeat(32) }).code.length, 32);
  });
  await t.test('warehouse write sends authorized scoped payload and confirms response', async () => {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://example.test/warehouses'); assert.equal(options?.method, 'POST');
      assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test');
      const payload = JSON.parse(String(options?.body));
      assert.deepEqual(payload, { name: 'Central', code: 'CTR' });
      return new Response(JSON.stringify({ data: { ...payload, id: 'w', status: 'ACTIVE' } }), { status: 201 });
    };
    assert.equal((await createWarehouseRequest('https://example.test', 'test', { name: ' Central ', code: 'ctr' }, new AbortController().signal)).id, 'w');
  });
  await t.test('warehouse write rejects ambiguous confirmation and preserves authorization error', async () => {
    const draft = { name: 'Central', code: 'CTR' };
    globalThis.fetch = async () => new Response(JSON.stringify({ data: { id: 'w', name: 'Central', code: 'OTHER', status: 'ACTIVE' } }));
    await assert.rejects(createWarehouseRequest('https://example.test', 'test', draft, new AbortController().signal), /busca el código/);
    globalThis.fetch = async () => new Response('', { status: 401 });
    await assert.rejects(createWarehouseRequest('https://example.test', 'test', draft, new AbortController().signal), (error: unknown) => error instanceof ApiError && error.status === 401);
  });
  await t.test('stock write validates quantity, identifiers and transfer destination', () => {
    const draft = { warehouseId: 'a'.repeat(24), productId: 'b'.repeat(24), destinationWarehouseId: 'c'.repeat(24), quantity: '0.000001', reference: ' R ' };
    assert.equal(validateStock('receipts', draft).quantity, 0.000001);
    assert.equal(validateStock('issues', draft).reference, 'R');
    assert.equal(validateStock('transfers', draft).destinationWarehouseId, draft.destinationWarehouseId);
    for (const quantity of ['0', '-1', '1,5', '1e3', '0.0000001']) assert.throws(() => validateStock('receipts', { ...draft, quantity }), /cantidad/);
    assert.throws(() => validateStock('transfers', { ...draft, destinationWarehouseId: draft.warehouseId }), /destino/);
    assert.throws(() => validateStock('issues', { ...draft, reference: ' ' }), /referencia/);
  });
  await t.test('stock creation confirms signed quantity and preserves ambiguity warning', async () => {
    const draft = { warehouseId: 'a'.repeat(24), productId: 'b'.repeat(24), destinationWarehouseId: 'c'.repeat(24), quantity: '2', reference: 'R' };
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://example.test/stock/transfers');
      const payload = JSON.parse(String(options?.body));
      assert.equal(payload.quantity, 2); assert.equal(payload.companyId, undefined);
      return new Response(JSON.stringify({ data: { ...payload, id: 'm', kind: 'TRANSFER', quantity: -2 } }), { status: 201 });
    };
    await createStockRequest('https://example.test', 'test', 'transfers', draft, new AbortController().signal);
    globalThis.fetch = async () => { throw new Error('network'); };
    await assert.rejects(createStockRequest('https://example.test', 'test', 'receipts', draft, new AbortController().signal), /referencia exacta/);
    globalThis.fetch = async () => new Response('', { status: 409 });
    await assert.rejects(createStockRequest('https://example.test', 'test', 'issues', draft, new AbortController().signal), (error: unknown) => error instanceof ApiError && error.status === 409 && error.message.includes('stock'));
  });
  await t.test('warehouse names validate identifiers, codes and status including inactive history', async () => {
    const row = { id: 'w', name: 'Central', code: 'CTR', status: 'INACTIVE' };
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://example.test/warehouses');
      assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test');
      return new Response(JSON.stringify({ data: [row] }));
    };
    assert.equal((await warehousesRequest('https://example.test', 'test', new AbortController().signal))[0].name, 'Central');
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [row, row] }));
    await assert.rejects(warehousesRequest('https://example.test', 'test', new AbortController().signal), /almacenes inesperados/);
  });
  await t.test('inventory names preserve identifiers and search does not alter quantities', () => {
    const rows = [{ productId: 'p', warehouseId: 'w', quantity: 3.5 }];
    const products = [{ id: 'p', name: 'Tornillo', sku: 'ABC' }];
    const warehouses = [{ id: 'w', name: 'Central', code: 'CTR', status: 'ACTIVE' as const }];
    assert.equal(inventoryLabel('p', products), 'Tornillo (p)');
    assert.equal(inventoryLabel('missing', products), 'Sin nombre disponible (missing)');
    for (const query of [' tornillo ', 'ABC', 'central', 'CTR']) assert.deepEqual(filterBalances(rows, query, products, warehouses), rows);
    assert.deepEqual(filterBalances(rows, 'missing', products, warehouses), []);
    assert.deepEqual(filterBalances(rows, 'p', [], []), rows);
  });
  await t.test('stock validates balances without inventing stock', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ warehouseId: 'w', productId: 'p', quantity: 2.5 }] }));
    assert.equal((await stockRequest('https://example.test', 'test', new AbortController().signal))[0].quantity, 2.5);
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ warehouseId: 'w', productId: 'p', quantity: '2' }] }));
    await assert.rejects(stockRequest('https://example.test', 'test', new AbortController().signal), /existencias inesperadas/);
  });
  await t.test('history encodes exact references and cursor and validates transfer destination', async () => {
    const cursor = 'a'.repeat(24);
    globalThis.fetch = async (url) => {
      assert.equal(url, `https://example.test/stock/movements?limit=25&reference=A%26B&cursor=${cursor}`);
      return new Response(JSON.stringify({ data: { items: [{ id: 'm', kind: 'ISSUE', warehouseId: 'w', productId: 'p', reference: 'A&B', userId: 'u', quantity: -2 }], nextCursor: cursor } }));
    };
    assert.equal((await movementRequest('https://example.test', 'test', new AbortController().signal, ' A&B ', cursor)).items[0].quantity, -2);
    globalThis.fetch = async () => new Response(JSON.stringify({ data: { items: [{ id: 'm', kind: 'TRANSFER', warehouseId: 'w', productId: 'p', reference: 'R', userId: 'u', quantity: -2 }], nextCursor: null } }));
    await assert.rejects(movementRequest('https://example.test', 'test', new AbortController().signal), /movimiento inesperado/);
    await assert.rejects(movementRequest('https://example.test', 'test', new AbortController().signal, '', 'invalid'), /filtros/);
  });
  await t.test('login normalizes email, preserves password and validates session', async () => {
    globalThis.fetch = async (_url, options) => {
      assert.deepEqual(JSON.parse(String(options?.body)), { email: 'user@example.com', password: ' keep ' });
      return new Response(JSON.stringify({ data: { token: 'test', user: { name: 'User', email: 'user@example.com', companyId:'company',branchId:'branch' } } }));
    };
    assert.equal((await loginRequest('https://example.test', ' USER@example.com ', ' keep ')).token, 'test');
  });
  await t.test('401 ignores corrupt or sensitive server messages', async () => {
    globalThis.fetch = async () => new Response('private server details', { status: 401 });
    await assert.rejects(loginRequest('https://example.test', 'u', 'p'), /contraseña/);
    await assert.rejects(dashboardRequest('https://example.test', 'test', new AbortController().signal), (error: unknown) => error instanceof ApiError && error.status === 401 && error.message.includes('sesión venció'));
  });
  await t.test('empty successful response is handled', async () => {
    globalThis.fetch = async () => new Response('');
    await assert.rejects(requestData('https://example.test', '/dashboard/summary'), /respuesta inesperada/);
  });
  await t.test('summary uses bearer auth and rejects invalid counts', async () => {
    const data = { companyId: 'c', branchId: 'b', lastUpdated: new Date().toISOString(), metrics: { sales: 1, purchases: 2, cash: -3, employees: 4, inventory: 5 } };
    globalThis.fetch = async (_url, options) => {
      assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test');
      return new Response(JSON.stringify({ data }));
    };
    assert.equal((await dashboardRequest('https://example.test', 'test', new AbortController().signal)).metrics.cash, -3);
    data.metrics.inventory = -1;
    await assert.rejects(dashboardRequest('https://example.test', 'test', new AbortController().signal), /indicadores inesperados/);
  });
  await t.test('timeout aborts the request', async () => {
    globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    await assert.rejects(requestData('https://example.test', '/test', {}, 5), /tardó demasiado/);
  });
  await t.test('catalog uses authorized endpoint and validates products', async () => {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://example.test/products');
      assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test');
      return new Response(JSON.stringify({ data: [{ id: 'p', name: 'Producto', status: 'ACTIVE', sku: 'SKU', price: 0 }] }));
    };
    assert.equal((await catalogRequest('https://example.test', 'products', 'test', new AbortController().signal))[0].price, 0);
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ id: 'p', name: 'Producto', status: 'ACTIVE', sku: 'SKU', price: -1 }] }));
    await assert.rejects(catalogRequest('https://example.test', 'products', 'test', new AbortController().signal), /producto inesperado/);
  });
  await t.test('contacts reject incomplete data and duplicate identifiers', async () => {
    const row = { id: 'c', name: 'Cliente', status: 'ACTIVE', email: 'c@example.com', taxId: 'ABC' };
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [row, row] }));
    await assert.rejects(catalogRequest('https://example.test', 'customers', 'test', new AbortController().signal), /catálogo inesperado/);
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ ...row, email: null }] }));
    await assert.rejects(catalogRequest('https://example.test', 'suppliers', 'test', new AbortController().signal), /contacto inesperado/);
  });
  await t.test('search and local pagination clamp stale page and handle empty lists', () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({ id: String(index), name: `Producto ${index}`, sku: 'CODE', status: 'ACTIVE' as const }));
    assert.equal(catalogPage(rows, '', 1).rows.length, 5);
    assert.equal(catalogPage(rows, ' producto 24 ', 8).current, 0);
    assert.equal(catalogPage(rows, 'code', 0).total, 25);
    assert.equal(catalogPage(rows, 'missing', 0).total, 0);
    assert.equal(catalogPage([], '', 0).pages, 1);
  });
  await t.test('403 is a safe permission error', async () => {
    globalThis.fetch = async () => new Response('private', { status: 403 });
    await assert.rejects(catalogRequest('https://example.test', 'customers', 'test', new AbortController().signal), (error: unknown) => error instanceof ApiError && error.status === 403 && error.message.includes('permiso'));
  });
  await t.test('partner validation normalizes data and rejects invalid inputs', () => {
    assert.deepEqual(validatePartner({ name: ' Cliente ', taxId: ' abc ', email: ' USER@example.com ' }), { name: 'Cliente', taxId: 'ABC', email: 'user@example.com' });
    assert.throws(() => validatePartner({ name: 'A', taxId: 'ABC', email: 'a@example.com' }), /nombre/);
    assert.throws(() => validatePartner({ name: 'Ab', taxId: 'AB', email: 'a@example.com' }), /fiscal/);
    assert.throws(() => validatePartner({ name: 'Ab', taxId: 'ABC', email: 'invalid' }), /correo/);
  });
  await t.test('product validation permits zero and rejects ambiguous prices', () => {
    const draft = { name: ' Producto ', sku: ' abc ', categoryId: 'cat', price: '0.00' };
    assert.deepEqual(validateProduct(draft), { name: 'Producto', sku: 'ABC', categoryId: 'cat', price: 0 });
    for (const price of ['', '-1', '1,25', 'NaN', '1e3', '1.234']) assert.throws(() => validateProduct({ ...draft, price }), /precio/);
    assert.throws(() => validateProduct({ ...draft, categoryId: '' }), /categoría/);
  });
  await t.test('category validates boundaries and normalizes code', () => {
    assert.deepEqual(validateCategory({ name: ' Categoría ', code: ' ab ' }), { name: 'Categoría', code: 'AB' });
    for (const name of ['A', 'a'.repeat(101)]) assert.throws(() => validateCategory({ name, code: 'AB' }), /nombre/);
    for (const code of ['A', 'a'.repeat(25)]) assert.throws(() => validateCategory({ name: 'Categoría', code }), /código/);
  });
  await t.test('category creation confirms active record and sends no tenant override', async () => {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://example.test/categories'); assert.equal(options?.method, 'POST');
      assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test');
      const payload = JSON.parse(String(options?.body));
      assert.deepEqual(payload, { name: 'Categoría', code: 'AB' });
      return new Response(JSON.stringify({ data: { ...payload, id: 'cat', status: 'ACTIVE' } }), { status: 201 });
    };
    assert.deepEqual(await createCategoryRequest('https://example.test', 'test', { name: 'Categoría', code: 'ab' }, new AbortController().signal), { id: 'cat', name: 'Categoría' });
  });
  await t.test('category ambiguous result warns before retry and preserves denial status', async () => {
    const draft = { name: 'Categoría', code: 'AB' };
    globalThis.fetch = async () => new Response(JSON.stringify({ data: { id: 'cat', status: 'INACTIVE' } }));
    await assert.rejects(createCategoryRequest('https://example.test', 'test', draft, new AbortController().signal), /antes de volver a guardar/);
    globalThis.fetch = async () => new Response('', { status: 403 });
    await assert.rejects(createCategoryRequest('https://example.test', 'test', draft, new AbortController().signal), (error: unknown) => error instanceof ApiError && error.status === 403);
  });
  await t.test('category lookup includes only active categories and validates schema', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ id: 'a', name: 'Activa', status: 'ACTIVE' }, { id: 'b', name: 'Inactiva', status: 'INACTIVE' }] }));
    assert.deepEqual(await categoriesRequest('https://example.test', 'test', new AbortController().signal), [{ id: 'a', name: 'Activa' }]);
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ id: 'a', name: 'Invalid', status: 'UNKNOWN' }] }));
    await assert.rejects(categoriesRequest('https://example.test', 'test', new AbortController().signal), /categorías inesperadas/);
  });
  await t.test('product write confirms response and protects ambiguous failures', async () => {
    const draft = { name: 'Producto', sku: 'sku', categoryId: 'cat', price: '12.50' };
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://example.test/products'); assert.equal(options?.method, 'POST');
      const payload = JSON.parse(String(options?.body));
      assert.deepEqual(payload, { name: 'Producto', sku: 'SKU', categoryId: 'cat', price: 12.5 });
      return new Response(JSON.stringify({ data: { ...payload, id: 'p', status: 'ACTIVE' } }), { status: 201 });
    };
    await createProductRequest('https://example.test', 'test', draft, new AbortController().signal);
    globalThis.fetch = async () => new Response(JSON.stringify({ data: { id: 'p' } }));
    await assert.rejects(createProductRequest('https://example.test', 'test', draft, new AbortController().signal), /busca el SKU/);
  });
  await t.test('create partner sends only allowed fields and confirms persisted response', async () => {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://example.test/customers');
      assert.equal(options?.method, 'POST');
      assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test');
      const payload = JSON.parse(String(options?.body));
      assert.deepEqual(payload, { name: 'Cliente', taxId: 'ABC', email: 'a@example.com' });
      return new Response(JSON.stringify({ data: { ...payload, id: 'c', status: 'ACTIVE' } }), { status: 201 });
    };
    await createPartner('https://example.test', 'customers', 'test', { name: 'Cliente', taxId: 'ABC', email: 'a@example.com' }, new AbortController().signal);
  });
  await t.test('ambiguous write failure warns against blind retry; conflicts stay explicit', async () => {
    const draft = { name: 'Cliente', taxId: 'ABC', email: 'a@example.com' };
    globalThis.fetch = async () => { throw new Error('network'); };
    await assert.rejects(createPartner('https://example.test', 'suppliers', 'test', draft, new AbortController().signal), /antes de volver a guardar/);
    globalThis.fetch = async () => new Response('', { status: 409 });
    await assert.rejects(createPartner('https://example.test', 'customers', 'test', draft, new AbortController().signal), (error: unknown) => error instanceof ApiError && error.status === 409);
  });
});

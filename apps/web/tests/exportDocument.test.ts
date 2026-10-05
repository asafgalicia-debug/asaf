import test from 'node:test';
import assert from 'node:assert/strict';
import { read, utils } from 'xlsx';
import { makeDemoProducts, filterDemoProducts, demoCompany } from '../src/demoProducts';
import { catalogDocument, documentHtml, collectCatalogPages } from '../src/exportDocument';
import { documentWorkbook } from '../src/exportWorkbook';
import { write } from 'xlsx';

test('demo contains exactly 2000 unique repeatable products and is separate from tenant identities', () => {
  const rows = makeDemoProducts();
  assert.equal(rows.length, 2000);
  assert.equal(new Set(rows.map(row => row.id)).size, 2000);
  assert.equal(new Set(rows.map(row => row.sku)).size, 2000);
  assert.equal(rows.filter(row => row.status === 'ACTIVE').length, 1800);
  assert.ok(rows.every(row => Number.isFinite(row.price) && row.price! > 0 && row.id.startsWith('demo-')));
  assert.deepEqual(rows, makeDemoProducts());
  assert.equal(filterDemoProducts(rows, 'demo-prod-2000')[0].sku, 'DEMO-PROD-2000');
});

test('real XLSX round trip contains all 2000 rows, numeric prices and explicit demo metadata', () => {
  const document = catalogDocument('products', makeDemoProducts(), demoCompany.name, undefined, '', true);
  const binary = write(documentWorkbook(document), { bookType: 'xlsx', type: 'buffer' });
  assert.equal(binary.subarray(0, 2).toString(), 'PK');
  const workbook = read(binary, { type: 'buffer' });
  const rows = utils.sheet_to_json(workbook.Sheets.Datos, { header: 1 }) as (string | number)[][];
  assert.equal(rows.length, 2001);
  assert.equal(rows[2000][1], 'DEMO-PROD-2000');
  assert.equal(typeof rows[1][3], 'number');
  assert.match(workbook.Sheets['Información'].B4.v, /FICTICIOS/);
});

test('PDF markup contains every product and escapes HTML; spreadsheet strings cannot execute formulas', () => {
  const document = catalogDocument('products', makeDemoProducts(), '<Demo & empresa>', undefined, '<img src=x>', true);
  document.rows[0][0] = '=HYPERLINK("https://example.test")';
  const html = documentHtml(document);
  assert.equal((html.match(/<tr>/g) ?? []).length, 2001);
  assert.match(html, /DEMO-PROD-2000/);
  assert.match(html, /&lt;Demo &amp; empresa&gt;/);
  assert.ok(!html.includes('<img src=x>'));
  const sheet = documentWorkbook(document).Sheets.Datos;
  assert.equal(sheet.A2.t, 's'); assert.equal(sheet.A2.f, undefined);
});

test('exports collect all 100 pages rather than only visible page', async () => {
  const products = makeDemoProducts();
  const rows = await collectCatalogPages(async cursor => {
    const offset = Number(cursor || 0);
    return { items: products.slice(offset, offset + 20), nextCursor: offset + 20 < products.length ? String(offset + 20) : null };
  }, new AbortController().signal);
  assert.deepEqual(rows, products);
});

test('failed pages, repeated cursors and cancellation cannot produce partial exports', async () => {
  const signal = new AbortController();
  await assert.rejects(collectCatalogPages(async () => { throw new Error('falló API'); }, signal.signal), /falló API/);
  await assert.rejects(collectCatalogPages(async () => ({ items: [], nextCursor: 'repeat' }), signal.signal), /repitió/);
  const canceled = new AbortController(); canceled.abort();
  await assert.rejects(collectCatalogPages(async () => ({ items: [], nextCursor: null }), canceled.signal), /cancelada/);
});

test('duplicated identities and excessive results fail instead of silently truncating', async () => {
  const row = makeDemoProducts()[0];
  await assert.rejects(collectCatalogPages(async cursor => ({ items: [row], nextCursor: cursor ? null : 'next' }), new AbortController().signal), /cambió/);
  const items = Array.from({ length: 10001 }, (_, index) => ({ ...row, id: String(index) }));
  await assert.rejects(collectCatalogPages(async () => ({ items, nextCursor: null }), new AbortController().signal), /10,000/);
});

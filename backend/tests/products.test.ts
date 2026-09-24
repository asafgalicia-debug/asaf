import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/productos/models/Category.js', () => ({
  getCategoryModel: () => ({ findOne: () => { const query: any = { lean: () => query, exec: async () => ({ _id: 'cat-1', companyId: 'co-1', status: 'ACTIVE' }) }; return query; } })
}));
vi.mock('../src/modules/productos/models/Product.js', () => ({
  getProductModel: () => ({
    find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId) }; return query; },
    create: async (input: any) => { const row = { ...input, _id: `product-${state.rows.length + 1}` }; state.rows.push(row); return row; }
  })
}));
import { createProduct, listProducts } from '../src/modules/productos/productService.js';
describe('product domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters products by company', async () => {
    await createProduct({ companyId: 'co-1', categoryId: 'cat-1', name: 'Monitor', sku: 'MON-1', price: 349.99 });
    await createProduct({ companyId: 'co-2', categoryId: 'cat-1', name: 'Keyboard', sku: 'KEY-1', price: 49.99 });
    const products = await listProducts('co-1');
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Monitor');
  });
  it('normalizes the SKU', async () => {
    const product = await createProduct({ companyId: 'co-1', categoryId: 'cat-1', name: 'Monitor', sku: 'mon-1', price: 349.99 });
    expect(product.sku).toBe('MON-1');
  });
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/productos/models/Category.js', () => ({
  getCategoryModel: () => ({
    find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId) }; return query; },
    create: async (input: any) => { const row = { ...input, _id: `category-${state.rows.length + 1}` }; state.rows.push(row); return row; }
  })
}));
import { createCategory, listCategories } from '../src/modules/productos/categoryService.js';
describe('category domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters categories by company', async () => {
    await createCategory({ companyId: 'co-1', name: 'Office', code: 'OFF' });
    await createCategory({ companyId: 'co-2', name: 'Tools', code: 'TLS' });
    const categories = await listCategories('co-1');
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('Office');
  });
  it('normalizes the category code', async () => {
    const category = await createCategory({ companyId: 'co-1', name: 'Office', code: 'off' });
    expect(category.code).toBe('OFF');
  });
});
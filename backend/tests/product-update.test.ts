import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ category: vi.fn(), update: vi.fn() }));
vi.mock('../src/modules/productos/models/Category.js', () => ({ getCategoryModel: () => ({ findOne: (...args: unknown[]) => ({ lean: () => ({ exec: () => state.category(...args) }) }) }) }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
import { updateProduct } from '../src/modules/productos/productService.js';
const input = { companyId: 'co', categoryId: 'cat', name: ' New name ', price: 12.5 };
describe('product editing', () => {
 beforeEach(() => { state.category.mockReset(); state.update.mockReset(); });
 it('scopes product and category and changes only editable fields', async () => {
  state.category.mockResolvedValue({ _id: 'cat' }); state.update.mockResolvedValue({ _id: 'id', ...input, name: 'New name', sku: 'ORIGINAL', status: 'INACTIVE' });
  const row = await updateProduct('id', input);
  expect(state.category).toHaveBeenCalledWith({ _id: 'cat', companyId: 'co', status: 'ACTIVE' });
  expect(state.update).toHaveBeenCalledWith({ _id: 'id', companyId: 'co' }, { $set: { name: 'New name', categoryId: 'cat', price: 12.5 } }, { new: true, runValidators: true });
  expect(row.sku).toBe('ORIGINAL'); expect(row.status).toBe('INACTIVE');
 });
 it('blocks foreign or inactive categories before update', async () => {
  state.category.mockResolvedValue(null);
  await expect(updateProduct('id', input)).rejects.toMatchObject({ statusCode: 400 }); expect(state.update).not.toHaveBeenCalled();
 });
 it('does not edit foreign or missing products', async () => {
  state.category.mockResolvedValue({ _id: 'cat' }); state.update.mockResolvedValue(null);
  await expect(updateProduct('foreign', input)).rejects.toMatchObject({ statusCode: 404 });
 });
 it('compares original fields atomically without changing SKU',async()=>{
  state.category.mockResolvedValue({_id:'cat'});state.update.mockResolvedValue(null);
  const expected={name:'Original',categoryId:'oldcat',price:5,sku:'ORIGINAL'};
  await expect(updateProduct('id',{...input,expected})).rejects.toMatchObject({statusCode:409});
  expect(state.update.mock.calls[0][0]).toEqual({_id:'id',companyId:'co',...expected});
  expect(state.update.mock.calls[0][1].$set).not.toHaveProperty('sku');
 });
});

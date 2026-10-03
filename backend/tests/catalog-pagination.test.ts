import { describe, expect, it } from 'vitest';
import { catalogFilter, catalogSlice, parseCatalogQuery } from '../src/core/catalogPagination.js';
describe('catalog pagination', () => {
 it('limits pages and rejects invalid cursors and tenant overrides', () => {
  expect(parseCatalogQuery({})).toEqual({ search: '', limit: 20 });
  expect(parseCatalogQuery({ search: ' Test ', limit: '50', cursor: 'a'.repeat(24) })).toEqual({ search: 'Test', limit: 50, cursor: 'a'.repeat(24) });
  for (const query of [{limit:0},{limit:51},{limit:1.5},{cursor:'bad'},{search:'a'.repeat(101)},{companyId:'other'},{search:['a','b']},{branchId:'other'}]) expect(() => parseCatalogQuery(query)).toThrow();
 });
 it('preserves tenant scope and escapes regex metacharacters as literal search', () => {
  const search = 'a.*[b](c)$^+?{x}|'+String.fromCharCode(92); const filter = catalogFilter({ companyId: 'co', branchId: 'br' }, {search, limit:20,cursor:'a'.repeat(24)}, ['name','email']);
  expect(filter).toMatchObject({companyId:'co',branchId:'br',_id:{$lt:'a'.repeat(24)}});
  const conditions = filter.$or as any[]; expect(conditions).toHaveLength(2); const regex = new RegExp(conditions[0].name.$regex,'i'); expect(regex.test(search)).toBe(true); expect(regex.test('aXXXb')).toBe(false);
 });
 it('uses an extra row to determine next cursor without exposing it', () => {
  const rows = [{_id:'c',name:'C'},{_id:'b',name:'B'},{_id:'a',name:'A'}];
  expect(catalogSlice(rows,2)).toEqual({items:[{id:'c',name:'C'},{id:'b',name:'B'}],nextCursor:'b'});
  expect(catalogSlice(rows,3).nextCursor).toBeNull(); expect(catalogSlice([],20)).toEqual({items:[],nextCursor:null});
 });
});

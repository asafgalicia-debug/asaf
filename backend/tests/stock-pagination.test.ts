import { describe, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({aggregate:vi.fn(),exec:vi.fn()}));
vi.mock('../src/modules/inventario/models/StockMovement.js',()=>({getStockMovementModel:()=>({aggregate:state.aggregate})}));
vi.mock('../src/modules/inventario/models/Warehouse.js',()=>({getWarehouseModel:()=>({collection:{name:'warehouses'}})}));
vi.mock('../src/modules/productos/models/Product.js',()=>({getProductModel:()=>({collection:{name:'products'}})}));
import { parseStockPageQuery, stockSearchLiteral } from '../src/modules/inventario/stockPagination.js';
import { pageStock } from '../src/modules/inventario/stockService.js';
describe('stock pagination',()=>{
 it('rejects malformed cursors, oversized queries and tenant overrides',()=>{for(const query of [{cursor:'bad'},{limit:51},{limit:0},{companyId:'foreign'},{branchId:'foreign'},{search:'x'.repeat(101)}])expect(()=>parseStockPageQuery(query)).toThrow();expect(parseStockPageQuery({})).toEqual({search:'',limit:20});expect(stockSearchLiteral('A.*[B]')).toBe('A\\.\\*\\[B\\]');});
 it('paginates after summing transfer effects and scopes both name lookups',async()=>{
  const warehouseId='a'.repeat(24),productId='b'.repeat(24);state.aggregate.mockReturnValue({exec:state.exec});state.exec.mockResolvedValue([{warehouseId,productId,quantity:3},{warehouseId,productId:'c'.repeat(24),quantity:1}]);
  expect(await pageStock('co','br',{search:'A.*',limit:1,cursor:warehouseId+':'+productId})).toEqual({items:[{warehouseId,productId,quantity:3}],nextCursor:warehouseId+':'+productId});
  const pipeline=state.aggregate.mock.calls.at(-1)![0];expect(pipeline[0]).toEqual({$match:{companyId:'co',branchId:'br'}});expect(pipeline.find((s:any)=>s.$group)).toEqual({$group:{_id:{warehouseId:'$effects.warehouseId',productId:'$productId'},quantity:{$sum:'$effects.quantity'}}});
  const joins=pipeline.filter((s:any)=>s.$lookup);expect(joins[0].$lookup.pipeline[0].$match.companyId).toBe('co');expect(joins[1].$lookup.pipeline[0].$match).toMatchObject({companyId:'co',branchId:'br'});expect(pipeline).toContainEqual({$limit:2});expect(pipeline.find((s:any)=>s.$match?.$or?.[0]?.productId).$match.$or[0].productId.$regex).toBe('A\\.\\*');
 });
});

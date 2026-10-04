import {test,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({sales:vi.fn(),cash:vi.fn()}));
vi.mock('../src/modules/ventas/models/Sale.js',()=>({getSaleModel:()=>({aggregate:(p:unknown)=>({exec:()=>state.sales(p)})})}));
vi.mock('../src/modules/finanzas/models/FinanceModels.js',()=>({getCashMovementModel:()=>({aggregate:(p:unknown)=>({exec:()=>state.cash(p)})})}));
import {utcPeriodStart,previewReport} from '../src/modules/reportes/reportPreview.js';
test('UTC periods cover year, quarter, month and Monday week boundaries',()=>{
 const now=new Date('2026-01-04T23:15:00Z');
 expect(utcPeriodStart('week',now).toISOString()).toBe('2025-12-29T00:00:00.000Z');
 for(const period of ['month','quarter','year'] as const)expect(utcPeriodStart(period,now).toISOString()).toBe('2026-01-01T00:00:00.000Z');
 expect(utcPeriodStart('quarter',new Date('2026-11-04T12:00:00Z')).toISOString()).toBe('2026-10-01T00:00:00.000Z');
});
test('cash report uses scoped cash movements by business date and preserves negative net',async()=>{
 state.cash.mockResolvedValue([{_id:'INFLOW',total:10,entries:1},{_id:'OUTFLOW',total:15,entries:2}]);
 const report=await previewReport('co','br','cash-flow','month',new Date('2026-10-04T12:00:00Z'));
 expect(state.cash.mock.calls[0][0][0].$match).toEqual({companyId:'co',branchId:'br',type:{$in:['INFLOW','OUTFLOW']},date:{$gte:'2026-10-01',$lte:'2026-10-04'}});
 expect(report.metrics.balance).toBe(-5);expect(report.basis).toBe('movementDate');
});
test('sales bounds timestamps, excludes cancelled sales and returns empty totals',async()=>{
 state.sales.mockResolvedValue([]);const now=new Date('2026-10-04T12:00:00Z');
 const report=await previewReport('co','br','sales','day',now);
 expect(state.sales.mock.calls[0][0][0].$match).toEqual({companyId:'co',branchId:'br',status:{$ne:'CANCELADA'},createdAt:{$gte:new Date('2026-10-04T00:00:00Z'),$lte:now}});
 expect(report.metrics.total).toBe(0);
});

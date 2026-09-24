import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter._id === 'prod-1' }) }));
vi.mock('../src/modules/produccion/models/ProductionOrder.js', () => ({ getProductionOrderModel: () => ({ find: (filter: any) => { const q: any = { sort: () => q, lean: () => q, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return q; }, create: async (i: any) => { const r = { ...i, _id: `order-${state.rows.length + 1}`, createdAt: new Date() }; state.rows.push(r); return r; } }) }));
import { createProductionOrder, getProductionSummary } from '../src/modules/produccion/productionService.js';
describe('production domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('calculates summary from tenant production orders', async () => { await createProductionOrder({ companyId: 'co-1', branchId: 'br-1', productId: 'prod-1', plannedQuantity: 12 }); const summary = await getProductionSummary('co-1', 'br-1'); expect(summary.metrics.totalOrders).toBe(1); expect(summary.metrics.activeOrders).toBe(1); expect(summary.metrics.plannedUnits).toBe(12); });
  it('creates a planned order with no completed units', async () => { const order = await createProductionOrder({ companyId: 'co-1', branchId: 'br-1', productId: 'prod-1', plannedQuantity: 10 }); expect(order.status).toBe('planned'); expect(order.completedQuantity).toBe(0); });
});
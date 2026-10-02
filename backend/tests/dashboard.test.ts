import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  sales: vi.fn(), purchases: vi.fn(), cash: vi.fn(), employees: vi.fn(), products: vi.fn()
}));
vi.mock('../src/modules/ventas/models/Sale.js', () => ({ getSaleModel: () => ({ aggregate: mocks.sales }) }));
vi.mock('../src/modules/compras/models/PurchaseOrder.js', () => ({ getPurchaseOrderModel: () => ({ aggregate: mocks.purchases }) }));
vi.mock('../src/modules/finanzas/models/FinanceModels.js', () => ({ getCashMovementModel: () => ({ aggregate: mocks.cash }) }));
vi.mock('../src/modules/recursos-humanos/models/Employee.js', () => ({ getEmployeeModel: () => ({ countDocuments: mocks.employees }) }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({ countDocuments: mocks.products }) }));
import { getDashboardSummary, listDashboardWidgets } from '../src/modules/dashboard/dashboardService.js';
beforeEach(() => {
  vi.resetAllMocks();
  for (const query of [mocks.sales, mocks.purchases, mocks.cash]) query.mockReturnValue({ exec: async () => [] });
  for (const query of [mocks.employees, mocks.products]) query.mockReturnValue({ exec: async () => 0 });
});
describe('dashboard MongoDB queries', () => {
  it('returns zero for empty tenants and scopes every query', async () => {
    const summary = await getDashboardSummary('company-a', 'branch-a');
    expect(summary.metrics).toEqual({ sales: 0, purchases: 0, cash: 0, employees: 0, inventory: 0 });
    for (const query of [mocks.sales, mocks.purchases, mocks.cash]) {
      expect(query.mock.calls[0][0][0].$match).toMatchObject({ companyId: 'company-a', branchId: 'branch-a' });
    }
    expect(mocks.sales.mock.calls[0][0][0].$match.status).toEqual({ $ne: 'CANCELADA' });
    expect(mocks.purchases.mock.calls[0][0][0].$match.status).toEqual({ $ne: 'CANCELADA' });
    expect(mocks.employees).toHaveBeenCalledWith({ companyId: 'company-a', branchId: 'branch-a', status: 'ACTIVE' });
    expect(mocks.products).toHaveBeenCalledWith({ companyId: 'company-a', status: 'ACTIVE' });
  });
  it('uses stored aggregate totals and does not fabricate trends', async () => {
    mocks.sales.mockReturnValue({ exec: async () => [{ value: 150 }] });
    mocks.cash.mockReturnValue({ exec: async () => [{ value: -20 }] });
    const widgets = await listDashboardWidgets('company-a', 'branch-a');
    expect(widgets[0].value).toBe(150);
    expect(widgets[1].value).toBe(-20);
    expect(widgets[0]).not.toHaveProperty('trend');
  });
  it('propagates database failures instead of reporting zero', async () => {
    mocks.sales.mockReturnValue({ exec: async () => { throw new Error('database unavailable'); } });
    await expect(getDashboardSummary('company-a', 'branch-a')).rejects.toThrow('database unavailable');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ reports: [] as any[] }));
vi.mock('../src/modules/reportes/models/Report.js', () => ({ getReportModel: () => ({
  find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.reports.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return query; },
  create: async (input: any) => { const row = { ...input, _id: `report-${state.reports.length + 1}`, toObject() { return { ...this }; } }; state.reports.push(row); return row; }
}) }));
vi.mock('../src/modules/ventas/models/Sale.js', () => ({ getSaleModel: () => ({ aggregate: () => ({ exec: async () => [{ total: 450, orders: 3, units: 5 }] }) }) }));
vi.mock('../src/modules/finanzas/models/FinanceModels.js', () => ({ getIncomeModel: () => ({ aggregate: () => ({ exec: async () => [{ total: 800, entries: 2 }] }) }), getExpenseModel: () => ({ aggregate: () => ({ exec: async () => [{ total: 250, entries: 1 }] }) }) }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({ countDocuments: () => ({ exec: async () => 7 }) }) }));
vi.mock('../src/modules/inventario/models/Warehouse.js', () => ({ getWarehouseModel: () => ({ countDocuments: () => ({ exec: async () => 2 }) }) }));

import { createReport, listReports } from '../src/modules/reportes/reportService.js';

describe('report domain', () => {
  beforeEach(() => { state.reports.length = 0; });
  it('lists reports only for the matching company and branch', async () => {
    await createReport({ companyId: 'co-1', branchId: 'br-1', userId: 'user-1', name: 'Ventas', type: 'sales', period: 'month' });
    state.reports.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', userId: 'user-2', name: 'Other', type: 'sales', period: 'month' });
    expect(await listReports('co-1', 'br-1')).toHaveLength(1);
  });
  it('calculates report data on the server and persists metadata', async () => {
    const report = await createReport({ companyId: 'co-1', branchId: 'br-1', userId: 'user-1', name: 'Reporte de caja', type: 'cash-flow', period: 'month' });
    expect(report.name).toBe('Reporte de caja');
    expect((report.data as any).income).toBe(800);
    expect((report.data as any).expenses).toBe(250);
    expect((report.data as any).balance).toBe(550);
  });
});

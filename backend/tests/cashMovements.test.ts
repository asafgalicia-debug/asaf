import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/finanzas/models/FinanceModels.js', () => ({ getBankAccountModel: () => ({ exists: async () => true }), getCashMovementModel: () => ({ find: (filter: any) => { const q: any = { sort: () => q, lean: () => q, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return q; }, create: async (i: any) => { const r = { ...i, _id: `movement-${state.rows.length + 1}` }; state.rows.push(r); return r; } }) }));
import { createCashMovement, listCashMovements } from '../src/modules/finanzas/cashMovementService.js';
describe('cash movement domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters entries by company and branch', async () => { await createCashMovement({ companyId: 'co-1', branchId: 'br-1', accountId: 'acc-1', concept: 'Initial payment', type: 'INFLOW', amount: 500, date: '2026-09-01' }); state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', accountId: 'acc-1', concept: 'Other', type: 'OUTFLOW', amount: 1, date: '2026-09-01' }); expect(await listCashMovements('co-1', 'br-1')).toHaveLength(1); });
  it('creates a typed cash movement', async () => { const row = await createCashMovement({ companyId: 'co-1', branchId: 'br-1', accountId: 'acc-1', concept: 'Payroll', type: 'OUTFLOW', amount: 3200, date: '2026-09-22' }); expect(row.concept).toBe('Payroll'); expect(row.amount).toBe(3200); });
});
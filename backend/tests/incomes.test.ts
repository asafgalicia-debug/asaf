import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/finanzas/models/FinanceModels.js', () => ({ getBankAccountModel: () => ({ exists: async () => true }), getIncomeModel: () => ({ find: (filter: any) => { const q: any = { sort: () => q, lean: () => q, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return q; }, create: async (i: any) => { const r = { ...i, _id: `income-${state.rows.length + 1}` }; state.rows.push(r); return r; } }) }));
import { createIncome, listIncomes } from '../src/modules/finanzas/incomeService.js';
describe('income domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters incomes by company and branch', async () => { await createIncome({ companyId: 'co-1', branchId: 'br-1', accountId: 'acc-1', concept: 'Service fee', amount: 100 }); state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', accountId: 'acc-1', concept: 'Other', amount: 5, status: 'PENDIENTE' }); expect(await listIncomes('co-1', 'br-1')).toHaveLength(1); });
  it('creates incomes pending', async () => { const row = await createIncome({ companyId: 'co-1', branchId: 'br-1', accountId: 'acc-1', concept: 'Consulting', amount: 1250.5 }); expect(row.concept).toBe('Consulting'); expect(row.amount).toBe(1250.5); expect(row.status).toBe('PENDIENTE'); });
});
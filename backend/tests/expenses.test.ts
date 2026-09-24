import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/finanzas/models/FinanceModels.js', () => ({ getBankAccountModel: () => ({ exists: async () => true }), getExpenseModel: () => ({ find: (filter: any) => { const q: any = { sort: () => q, lean: () => q, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return q; }, create: async (i: any) => { const r = { ...i, _id: `expense-${state.rows.length + 1}` }; state.rows.push(r); return r; } }) }));
import { createExpense, listExpenses } from '../src/modules/finanzas/expenseService.js';
describe('expense domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters expenses by company and branch', async () => { await createExpense({ companyId: 'co-1', branchId: 'br-1', accountId: 'acc-1', concept: 'Internet', amount: 80 }); state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', accountId: 'acc-1', concept: 'Other', amount: 5, status: 'PENDIENTE' }); expect(await listExpenses('co-1', 'br-1')).toHaveLength(1); });
  it('creates expenses pending', async () => { const row = await createExpense({ companyId: 'co-1', branchId: 'br-1', accountId: 'acc-1', concept: 'Internet', amount: 180.5 }); expect(row.amount).toBe(180.5); expect(row.status).toBe('PENDIENTE'); });
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/finanzas/models/FinanceModels.js', () => ({ getBankAccountModel: () => ({ find: (filter: any) => { const q: any = { sort: () => q, lean: () => q, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return q; }, create: async (i: any) => { const r = { ...i, _id: `bank-${state.rows.length + 1}` }; state.rows.push(r); return r; } }) }));
import { createBankAccount, listBankAccounts } from '../src/modules/finanzas/bankAccountService.js';
describe('finance domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters accounts by company and branch', async () => { await createBankAccount({ companyId: 'co-1', branchId: 'br-1', name: 'Operating', bankName: 'Example Bank', iban: 'ABCD1234' }); await createBankAccount({ companyId: 'co-1', branchId: 'br-2', name: 'Other', bankName: 'Example Bank', iban: 'EFGH5678' }); expect(await listBankAccounts('co-1', 'br-1')).toHaveLength(1); });
  it('normalizes account identifiers', async () => { const row = await createBankAccount({ companyId: 'co-1', branchId: 'br-1', name: 'Operating', bankName: 'Example Bank', iban: ' abcd1234 ' }); expect(row.iban).toBe('ABCD1234'); });
});
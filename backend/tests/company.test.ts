import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ companies: [] as Array<Record<string, unknown>>, branches: [] as Array<Record<string, unknown>> }));
type BranchQuery = { sort: () => BranchQuery; lean: () => BranchQuery; exec: () => Promise<Array<Record<string, unknown>>> };

vi.mock('../src/modules/empresas/models/Company.js', () => ({
  getCompanyModel: () => ({
    findById: (id: string) => ({ lean: () => ({ exec: async () => state.companies.find((row) => row._id === id) ?? null }) }),
    create: async (input: Record<string, unknown>) => {
      const row = { ...input, createdAt: new Date(), updatedAt: new Date() };
      state.companies.push(row);
      return { toObject: () => row };
    }
  })
}));

vi.mock('../src/modules/empresas/models/Branch.js', () => ({
  getBranchModel: () => ({
    find: (filter: { companyId: string }) => {
      const query: BranchQuery = { sort: () => query, lean: () => query, exec: async () => state.branches.filter((row) => row.companyId === filter.companyId) };
      return query;
    },
    create: async (input: Record<string, unknown>) => {
      const row = { ...input, createdAt: new Date(), updatedAt: new Date() };
      state.branches.push(row);
      return { toObject: () => row };
    }
  })
}));

import { createCompany, listCompanies } from '../src/modules/empresas/companyService.js';
import { createBranch, listBranches } from '../src/modules/empresas/branchService.js';

describe('company and branch domain', () => {
  beforeEach(() => { state.companies.length = 0; state.branches.length = 0; });

  it('persists companies and only returns the requested tenant', async () => {
    const company = await createCompany({ name: 'Empresa Prueba', taxId: 'A98765432' }, 'company-test-01');
    expect(company.id).toBe('company-test-01');
    expect((await listCompanies(company.id)).map((row) => row.id)).toEqual([company.id]);
    expect(await listCompanies('another-company')).toEqual([]);
  });

  it('persists branches and scopes listing by company', async () => {
    const branch = await createBranch({ companyId: 'company-test-01', name: 'Sucursal Valencia', code: 'VLC-01', city: 'Valencia' });
    expect(branch.companyId).toBe('company-test-01');
    expect(await listBranches('company-test-01')).toHaveLength(1);
    expect(await listBranches('another-company')).toHaveLength(0);
  });
});

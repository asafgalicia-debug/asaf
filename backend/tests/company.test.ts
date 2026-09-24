import { beforeEach, describe, expect, it, vi } from 'vitest';

const branchState = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }));

vi.mock('../src/modules/empresas/models/Branch.js', () => ({
  getBranchModel: () => ({
    find: (filter: { companyId: string }) => {
      const query: any = {
        sort: () => query,
        lean: () => query,
        exec: async () => branchState.rows.filter((row) => row.companyId === filter.companyId)
      };
      return query;
    },
    create: async (input: Record<string, unknown>) => {
      const row = { ...input, createdAt: new Date(), updatedAt: new Date() };
      branchState.rows.push(row);
      return { toObject: () => row };
    }
  })
}));

import { createCompany, listCompanies } from '../src/modules/empresas/companyService.js';
import { createBranch, listBranches } from '../src/modules/empresas/branchService.js';

describe('company and branch domain', () => {
  beforeEach(() => { branchState.rows.length = 0; });

  it('should list demo companies', () => {
    const companies = listCompanies();
    expect(companies.length).toBeGreaterThan(0);
    expect(companies[0].name).toBe('ERP Demo S.L.');
  });

  it('should persist a branch and scope listing by company', async () => {
    const company = createCompany({ name: 'Nova DistribuciÃ³n', taxId: 'A98765432' });
    const branch = await createBranch({ companyId: company.id, name: 'Sucursal Valencia', code: 'VLC-01', city: 'Valencia' });
    const rows = await listBranches(company.id);
    expect(company.taxId).toBe('A98765432');
    expect(branch.companyId).toBe(company.id);
    expect(rows).toHaveLength(1);
    expect(await listBranches('another-company')).toHaveLength(0);
  });
});

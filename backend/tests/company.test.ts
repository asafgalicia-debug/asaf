import { describe, expect, it } from 'vitest';

import { createCompany, listCompanies } from '../src/modules/empresas/companyService.js';
import { createBranch, listBranches } from '../src/modules/empresas/branchService.js';

describe('company and branch domain', () => {
  it('should list demo companies', () => {
    const companies = listCompanies();

    expect(companies.length).toBeGreaterThan(0);
    expect(companies[0].name).toBe('ERP Demo S.L.');
  });

  it('should create a company and branch', () => {
    const company = createCompany({ name: 'Nova Distribución', taxId: 'A98765432' });
    const branch = createBranch({
      companyId: company.id,
      name: 'Sucursal Valencia',
      code: 'VLC-01',
      city: 'Valencia'
    });

    expect(company.taxId).toBe('A98765432');
    expect(branch.companyId).toBe(company.id);
    expect(listBranches(company.id).length).toBeGreaterThan(0);
  });
});

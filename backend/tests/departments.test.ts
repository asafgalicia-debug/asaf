import { describe, expect, it } from 'vitest';

import { createDepartment, listDepartments } from '../src/modules/empresas/departmentService.js';

describe('department domain', () => {
  it('should list the default department for the demo company', () => {
    const departments = listDepartments('company-demo-01', 'branch-demo-01');

    expect(departments.length).toBeGreaterThan(0);
    expect(departments[0].code).toBe('ADM');
  });

  it('should create a valid department', () => {
    const department = createDepartment({
      companyId: 'company-demo-01',
      branchId: 'branch-demo-01',
      name: 'Finanzas',
      code: 'FIN'
    });

    expect(department.name).toBe('Finanzas');
    expect(listDepartments('company-demo-01', 'branch-demo-01').length).toBeGreaterThan(1);
  });
});

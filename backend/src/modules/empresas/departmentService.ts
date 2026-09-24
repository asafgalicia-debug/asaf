import { AppError } from '../../errors/AppError.js';

export type DepartmentRecord = {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
};

const departments: Record<string, DepartmentRecord> = {
  'dept-demo-01': {
    id: 'dept-demo-01',
    companyId: 'company-demo-01',
    branchId: 'branch-demo-01',
    name: 'Administración',
    code: 'ADM',
    status: 'ACTIVE'
  }
};

export function listDepartments(companyId: string, branchId?: string): DepartmentRecord[] {
  return Object.values(departments).filter((department) => {
    const matchesCompany = department.companyId === companyId;
    const matchesBranch = !branchId || department.branchId === branchId;
    return matchesCompany && matchesBranch;
  });
}

export function createDepartment(input: { companyId: string; branchId: string; name: string; code: string }): DepartmentRecord {
  const companyId = input.companyId.trim();
  const branchId = input.branchId.trim();
  const name = input.name.trim();
  const code = input.code.trim();

  if (!companyId || !branchId || !name || !code) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Departamento incompleto',
      friendlyMessage: 'Faltan datos obligatorios para crear el departamento.',
      statusCode: 400
    });
  }

  const department: DepartmentRecord = {
    id: `dept-${Date.now()}`,
    companyId,
    branchId,
    name,
    code,
    status: 'ACTIVE'
  };

  departments[department.id] = department;
  return department;
}

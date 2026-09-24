import { AppError } from '../../errors/AppError.js';

export type BranchRecord = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  city: string;
  isActive: boolean;
};

const branches: Record<string, BranchRecord> = {
  'branch-demo-01': {
    id: 'branch-demo-01',
    companyId: 'company-demo-01',
    name: 'Sucursal Central',
    code: '001',
    city: 'Madrid',
    isActive: true
  }
};

export function listBranches(companyId: string): BranchRecord[] {
  return Object.values(branches).filter((branch) => branch.companyId === companyId);
}

export function createBranch(input: { companyId: string; name: string; code: string; city: string }): BranchRecord {
  const companyId = input.companyId.trim();
  const name = input.name.trim();
  const code = input.code.trim();
  const city = input.city.trim();

  if (!companyId || !name || !code || !city) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'La sucursal necesita empresa, nombre, código y ciudad',
      friendlyMessage: 'Completa todos los datos requeridos de la sucursal.',
      statusCode: 400
    });
  }

  const branch: BranchRecord = {
    id: `branch-${Date.now()}`,
    companyId,
    name,
    code,
    city,
    isActive: true
  };

  branches[branch.id] = branch;
  return branch;
}

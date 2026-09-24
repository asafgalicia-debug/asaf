import { AppError } from '../../errors/AppError.js';

export type CompanyRecord = {
  id: string;
  name: string;
  taxId: string;
  status: 'ACTIVE' | 'INACTIVE';
  branchIds: string[];
};

const companies: Record<string, CompanyRecord> = {
  'company-demo-01': {
    id: 'company-demo-01',
    name: 'ERP Demo S.L.',
    taxId: 'B12345678',
    status: 'ACTIVE',
    branchIds: ['branch-demo-01']
  }
};

export function listCompanies(): CompanyRecord[] {
  return Object.values(companies);
}

export function getCompanyById(companyId: string): CompanyRecord | undefined {
  return companies[companyId];
}

export function createCompany(input: { name: string; taxId: string }): CompanyRecord {
  const name = input.name.trim();
  const taxId = input.taxId.trim();

  if (!name || !taxId) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Nombre y CIF/NIF son obligatorios',
      friendlyMessage: 'Debes indicar nombre y documento fiscal de la empresa.',
      statusCode: 400
    });
  }

  const company: CompanyRecord = {
    id: `company-${Date.now()}`,
    name,
    taxId,
    status: 'ACTIVE',
    branchIds: []
  };

  companies[company.id] = company;
  return company;
}

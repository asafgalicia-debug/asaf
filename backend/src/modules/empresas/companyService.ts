import { randomUUID } from 'node:crypto';

import { AppError } from '../../errors/AppError.js';
import { getCompanyModel, type CompanyDocument } from './models/Company.js';

export type CompanyRecord = {
  id: string;
  name: string;
  taxId: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

function serialize(row: CompanyDocument): CompanyRecord {
  const { _id, ...company } = row;
  return { id: String(_id), ...company };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export async function listCompanies(companyId: string): Promise<CompanyRecord[]> {
  const company = await getCompanyById(companyId);
  return company ? [company] : [];
}

export async function getCompanyById(companyId: string): Promise<CompanyRecord | undefined> {
  const normalizedId = companyId.trim();
  if (!normalizedId) return undefined;
  const row = await getCompanyModel().findById(normalizedId).lean().exec();
  return row ? serialize(row as CompanyDocument) : undefined;
}

export async function createCompany(input: { name: string; taxId: string }, id = `company-${randomUUID()}`): Promise<CompanyRecord> {
  const name = input.name.trim();
  const taxId = input.taxId.trim().toUpperCase();
  if (!name || !taxId || name.length > 160 || taxId.length > 32) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid company name or tax ID', friendlyMessage: 'Indica el nombre y el identificador fiscal de la empresa.', statusCode: 400 });
  }
  try {
    const row = await getCompanyModel().create({ _id: id, name, taxId, status: 'ACTIVE' });
    return serialize(row.toObject() as CompanyDocument);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError({ code: 'CONFLICT', message: 'Company identifier already exists', friendlyMessage: 'Ya existe una empresa con ese identificador.', statusCode: 409 });
    }
    throw error;
  }
}

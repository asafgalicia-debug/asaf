import { randomUUID } from 'node:crypto';

import { AppError } from '../../errors/AppError.js';
import { getBranchModel, type BranchDocument } from './models/Branch.js';

export type BranchRecord = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  city: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(row: BranchDocument): BranchRecord {
  const { _id, ...branch } = row;
  return { id: String(_id), ...branch };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export async function listBranches(companyId: string): Promise<BranchRecord[]> {
  const normalizedCompanyId = companyId.trim();
  if (!normalizedCompanyId) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Company ID is required', friendlyMessage: 'La empresa es obligatoria.', statusCode: 400 });
  }
  const rows = await getBranchModel().find({ companyId: normalizedCompanyId }).sort({ name: 1 }).lean().exec();
  return rows.map((row) => serialize(row as BranchDocument));
}

export async function createBranch(input: { companyId: string; name: string; code: string; city: string }): Promise<BranchRecord> {
  const companyId = input.companyId.trim();
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  const city = input.city.trim();
  if (!companyId || !name || !code || !city || name.length > 120 || code.length > 32 || city.length > 120) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Branch requires valid company, name, code, and city',
      friendlyMessage: 'Completa empresa, nombre, cÃ³digo y ciudad con valores vÃ¡lidos.',
      statusCode: 400
    });
  }
  try {
    const row = await getBranchModel().create({ _id: `branch-${randomUUID()}`, companyId, name, code, city, isActive: true });
    return serialize(row.toObject() as BranchDocument);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError({ code: 'CONFLICT', message: 'Branch code already exists for company', friendlyMessage: 'Ya existe una sucursal con ese cÃ³digo en esta empresa.', statusCode: 409 });
    }
    throw error;
  }
}

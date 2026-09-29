import { randomUUID } from 'node:crypto';

import { AppError } from '../../errors/AppError.js';
import { getBranchModel } from './models/Branch.js';
import { getDepartmentModel, type DepartmentDocument } from './models/Department.js';

export type DepartmentRecord = {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

function serialize(row: DepartmentDocument): DepartmentRecord {
  const { _id, ...department } = row;
  return { id: String(_id), ...department };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export async function listDepartments(companyId: string, branchId: string): Promise<DepartmentRecord[]> {
  const normalizedCompanyId = companyId.trim();
  const normalizedBranchId = branchId.trim();
  if (!normalizedCompanyId || !normalizedBranchId) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Company and branch are required', friendlyMessage: 'La empresa y sucursal son obligatorias.', statusCode: 400 });
  }
  const rows = await getDepartmentModel().find({ companyId: normalizedCompanyId, branchId: normalizedBranchId }).sort({ name: 1 }).lean().exec();
  return rows.map((row) => serialize(row as DepartmentDocument));
}

export async function createDepartment(input: { companyId: string; branchId: string; name: string; code: string }): Promise<DepartmentRecord> {
  const companyId = input.companyId.trim();
  const branchId = input.branchId.trim();
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  if (!companyId || !branchId || !name || !code || name.length > 120 || code.length > 32) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid department data', friendlyMessage: 'Completa empresa, sucursal, nombre y c\u00f3digo v\u00e1lidos.', statusCode: 400 });
  }
  const branch = await getBranchModel().exists({ _id: branchId, companyId, isActive: true });
  if (!branch) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Branch does not belong to the company or is inactive', friendlyMessage: 'La sucursal no existe, est\u00e1 inactiva o no pertenece a la empresa.', statusCode: 400 });
  }
  try {
    const row = await getDepartmentModel().create({ _id: `department-${randomUUID()}`, companyId, branchId, name, code, status: 'ACTIVE' });
    return serialize(row.toObject() as DepartmentDocument);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError({ code: 'CONFLICT', message: 'Department code already exists for branch', friendlyMessage: 'Ya existe un departamento con ese c\u00f3digo en esta sucursal.', statusCode: 409 });
    }
    throw error;
  }
}

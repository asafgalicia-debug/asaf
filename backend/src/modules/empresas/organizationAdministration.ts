import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import { getCompanyModel } from './models/Company.js';
import { getBranchModel } from './models/Branch.js';

export type OrganizationScope = { companyId: string; branchId: string; userId: string; ipAddress?: string };
export const companyEditSchema = z.object({ name: z.string().trim().min(2).max(160), taxId: z.string().trim().min(3).max(32).transform(v => v.toUpperCase()), expectedUpdatedAt: z.string().datetime() }).strict();
export const branchDraftSchema = z.object({ name: z.string().trim().min(2).max(120), code: z.string().trim().min(2).max(32).transform(v => v.toUpperCase()), city: z.string().trim().min(2).max(120) }).strict();
const branchEditSchema = branchDraftSchema.extend({ expectedUpdatedAt: z.string().datetime() });
const pageSchema = z.object({ page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(50).default(20), search: z.string().trim().max(100).default('') }).strict();
const invalid = () => new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid organization input', friendlyMessage: 'Revisa los datos de empresa o sucursal.', statusCode: 400 });
const conflict = () => new AppError({ code: 'CONFLICT', message: 'Organization changed', friendlyMessage: 'Los datos cambiaron. Actualiza antes de reintentar.', statusCode: 409 });
const companyRecord = (r: any) => ({ id: String(r._id), name: r.name, taxId: r.taxId, status: r.status, updatedAt: r.updatedAt.toISOString() });
const branchRecord = (r: any) => ({ id: String(r._id), companyId: r.companyId, name: r.name, code: r.code, city: r.city, isActive: r.isActive, updatedAt: r.updatedAt.toISOString() });

export async function readCurrentCompany(companyId: string) {
  const row = await getCompanyModel().findById(companyId).lean();
  if (!row) throw new AppError({ code: 'NOT_FOUND', message: 'Company missing', friendlyMessage: 'La empresa de tu sesión no está disponible.', statusCode: 404 });
  return companyRecord(row);
}
export async function pageCompanyBranches(companyId: string, query: unknown) {
  const parsed = pageSchema.safeParse(query);
  if (!parsed.success || !companyId?.trim()) throw invalid();
  const { page, limit, search } = parsed.data;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = { companyId, ...(search ? { $or: ['name', 'code', 'city'].map(key => ({ [key]: { $regex: escaped, $options: 'i' } })) } : {}) };
  const total = await getBranchModel().countDocuments(filter);
  const rows = await getBranchModel().find(filter).sort({ name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean();
  return { items: rows.map(branchRecord), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function saveOrganization(scope: OrganizationScope, kind: 'company' | 'branch', payload: unknown, id?: string) {
  if (!scope.companyId?.trim() || !scope.branchId?.trim() || !scope.userId?.trim()) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing organization actor', friendlyMessage: 'Inicia sesión de nuevo.', statusCode: 401 });
  if (id && (id.length > 150 || !id.trim())) throw invalid();
  const parsed = (kind === 'company' ? companyEditSchema : id ? branchEditSchema : branchDraftSchema).safeParse(payload);
  if (!parsed.success) throw invalid();
  const Company = getCompanyModel(), Branch = getBranchModel(), Audit = getAuditEventModel();
  await Promise.all([Company.init(), Branch.init(), Audit.init()]);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const company = await Company.findOne({ _id: scope.companyId, status: 'ACTIVE' }).session(session).lean();
      if (!company) throw conflict();
      if (kind === 'company') {
        const data = companyEditSchema.parse(parsed.data);
        if (company.updatedAt.toISOString() !== new Date(data.expectedUpdatedAt).toISOString()) throw conflict();
        if (company.name === data.name && company.taxId === data.taxId) throw invalid();
        const saved = await Company.findOneAndUpdate({ _id: scope.companyId, status: 'ACTIVE', updatedAt: company.updatedAt }, { $set: { name: data.name, taxId: data.taxId, updatedAt: new Date(Math.max(Date.now(), company.updatedAt.getTime() + 1)) } }, { session, new: true, timestamps: false }).lean();
        if (!saved) throw conflict();
        result = companyRecord(saved);
        await Audit.create([{ ...scope, action: 'UPDATE', module: 'empresas', entityId: scope.companyId, details: { previousName: company.name, previousTaxId: company.taxId, name: saved.name, taxId: saved.taxId } }], { session });
      } else {
        const data = branchDraftSchema.parse({ name: parsed.data.name, code: 'code' in parsed.data ? parsed.data.code : undefined, city: 'city' in parsed.data ? parsed.data.city : undefined });
        let previous;
        let saved;
        if (id) {
          const expectedUpdatedAt = branchEditSchema.parse(parsed.data).expectedUpdatedAt;
          previous = await Branch.findOne({ _id: id, companyId: scope.companyId, isActive: true, updatedAt: new Date(expectedUpdatedAt) }).session(session).lean();
          if (!previous) throw conflict();
          if (previous.name === data.name && previous.code === data.code && previous.city === data.city) throw invalid();
          saved = await Branch.findOneAndUpdate({ _id: id, companyId: scope.companyId, isActive: true, updatedAt: previous.updatedAt }, { $set: { ...data, updatedAt: new Date(Math.max(Date.now(), previous.updatedAt.getTime() + 1)) } }, { session, new: true, timestamps: false }).lean();
          if (!saved) throw conflict();
        } else {
          const [created] = await Branch.create([{ _id: `branch-${randomUUID()}`, companyId: scope.companyId, ...data, isActive: true }], { session });
          saved = created.toObject();
        }
        result = branchRecord(saved);
        await Audit.create([{ ...scope, action: id ? 'UPDATE' : 'CREATE', module: 'sucursales', entityId: result.id, details: { ...data, ...(previous ? { previousName: previous.name, previousCode: previous.code, previousCity: previous.city } : {}) } }], { session });
      }
    });
    return result!;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Branch code exists', friendlyMessage: 'Ya existe una sucursal con ese código en tu empresa.', statusCode: 409 });
    throw error;
  } finally { await session.endSession(); }
}

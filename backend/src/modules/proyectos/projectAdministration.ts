import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { catalogFilter, catalogSlice } from '../../core/catalogPagination.js';
import { getProjectModel } from './models/Project.js';
import { getCustomerModel } from '../clientes/models/Customer.js';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(v + 'T00:00:00Z'); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v; });
const values = z.object({ name: z.string().trim().min(2).max(120), startDate: date, endDate: date, status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']), progress: z.number().finite().min(0).max(100) }).strict();
export const projectCreateSchema = z.object({ customerId: z.string().regex(/^[a-f0-9]{24}$/i), name: z.string().trim().min(2).max(120), startDate: date, endDate: date }).strict().refine(v => v.endDate >= v.startDate);
export const projectEditSchema = values.extend({ expected: values }).strict().refine(v => v.endDate >= v.startDate && (v.status !== 'CLOSED' || v.progress === 100));
const pageSchema = z.object({ search: z.string().trim().max(100).default(''), status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional(), cursor: z.string().regex(/^[a-f0-9]{24}$/i).optional(), limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();
export function parseProjectPage(query: unknown) { const p = pageSchema.safeParse(query); if (!p.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid project query', friendlyMessage: 'Revisa la búsqueda de proyectos.', statusCode: 400 }); return p.data; }
export function parseProjectCustomerPage(query: unknown) { const p = pageSchema.omit({ status: true }).strict().safeParse(query); if (!p.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid customer selector query', friendlyMessage: 'Revisa la búsqueda de clientes.', statusCode: 400 }); return p.data; }
type Scope = { companyId: string; branchId: string; userId: string; ipAddress?: string };
export async function pageProjects(scope: Scope, query: z.infer<typeof pageSchema>) {
  const filter = catalogFilter({ companyId: scope.companyId, branchId: scope.branchId }, { search: query.search, cursor: query.cursor, limit: query.limit }, ['name']);
  if (query.status) filter.status = query.status;
  const rows = await getProjectModel().find(filter).sort({ _id: -1 }).limit(query.limit + 1).lean().exec();
  const ids = rows.map(row => row.customerId).filter(value => /^[a-f0-9]{24}$/i.test(value));
  const customers = await getCustomerModel().find({ companyId: scope.companyId, branchId: scope.branchId, _id: { $in: ids } }).select('name').lean().exec();
  const names = new Map(customers.map(row => [String(row._id), row.name]));
  return catalogSlice(rows.map(row => ({ ...row, customerName: names.get(row.customerId) })), query.limit);
}
export async function pageProjectCustomers(scope: Scope, query: z.infer<typeof pageSchema>) {
  const filter = catalogFilter({ companyId: scope.companyId, branchId: scope.branchId }, { search: query.search, cursor: query.cursor, limit: query.limit }, ['name']);
  filter.status = 'ACTIVE';
  return catalogSlice(await getCustomerModel().find(filter).select('name companyId branchId status').sort({ _id: -1 }).limit(query.limit + 1).lean().exec(), query.limit);
}
export async function saveAuditedProject(scope: Scope, payload: unknown, id?: string) {
  const parsed = id ? projectEditSchema.safeParse(payload) : projectCreateSchema.safeParse(payload);
  if (!scope.userId || !parsed.success || (id && !/^[a-f0-9]{24}$/i.test(id))) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid project operation', friendlyMessage: 'Revisa cliente, nombre, fechas y avance. Para cerrar, el avance debe ser 100%.', statusCode: 400 });
  await Promise.all([getProjectModel().init(), getAuditEventModel().init()]);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      let row;
      if (id) {
        const { expected, ...change } = parsed.data as z.infer<typeof projectEditSchema>;
        row = await getProjectModel().findOneAndUpdate({ _id: id, companyId: scope.companyId, branchId: scope.branchId, ...expected }, { $set: change }, { new: true, runValidators: true, session }).lean().exec();
        if (!row) throw new AppError({ code: 'CONFLICT', message: 'Project changed', friendlyMessage: 'El proyecto cambió. Actualiza antes de reintentar.', statusCode: 409 });
      } else {
        const input = parsed.data as z.infer<typeof projectCreateSchema>;
        const customer = await getCustomerModel().exists({ _id: input.customerId, companyId: scope.companyId, branchId: scope.branchId, status: 'ACTIVE' }).session(session);
        if (!customer) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Unavailable project customer', friendlyMessage: 'Selecciona un cliente activo de esta sucursal.', statusCode: 400 });
        const [created] = await getProjectModel().create([{ ...input, companyId: scope.companyId, branchId: scope.branchId, status: 'ACTIVE', progress: 0 }], { session });
        row = created.toObject();
      }
      await getAuditEventModel().create([{ userId: scope.userId, companyId: scope.companyId, branchId: scope.branchId, action: id ? 'UPDATE' : 'CREATE', module: 'proyectos', entityId: String(row._id), details: { customerId: row.customerId, status: row.status, progress: row.progress }, ipAddress: scope.ipAddress }], { session });
      const { _id, ...rest } = row;
      result = { id: String(_id), ...rest };
    });
    return result!;
  } finally { await session.endSession(); }
}

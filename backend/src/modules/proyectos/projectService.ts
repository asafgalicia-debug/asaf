import { AppError } from '../../errors/AppError.js';
import { getCustomerModel } from '../clientes/models/Customer.js';
import { getProjectModel, type ProjectStatus } from './models/Project.js';
export type ProjectRecord = { id: string; companyId: string; branchId: string; customerId: string; name: string; status: ProjectStatus; progress: number; startDate: string; endDate: string };
export async function listProjects(companyId: string, branchId: string): Promise<ProjectRecord[]> { const rows = await getProjectModel().find({ companyId, branchId }).sort({ createdAt: -1 }).lean().exec(); return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row })); }
function validDate(value: string): boolean { const date = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }
export async function createProject(input: { companyId: string; branchId: string; customerId: string; name: string; startDate: string; endDate: string }): Promise<ProjectRecord> {
  if (!input.name.trim() || !validDate(input.startDate) || !validDate(input.endDate) || input.endDate < input.startDate) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid project data', friendlyMessage: 'Revisa nombre y fechas del proyecto.', statusCode: 400 });
  const customer = await getCustomerModel().exists({ _id: input.customerId, companyId: input.companyId, status: 'ACTIVE' });
  if (!customer) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Project customer unavailable', friendlyMessage: 'El cliente debe existir, estar activo y pertenecer a tu empresa.', statusCode: 400 });
  const row = await getProjectModel().create({ ...input, name: input.name.trim(), status: 'ACTIVE', progress: 0 });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, customerId: row.customerId, name: row.name, status: row.status, progress: row.progress, startDate: row.startDate, endDate: row.endDate };
}
import { AppError } from '../../errors/AppError.js';
import { getUserModel } from '../usuarios/models/User.js';
import { getEmployeeModel, type EmployeeStatus } from './models/Employee.js';
export type EmployeeRecord = { id: string; companyId: string; branchId: string; departmentId: string; userId: string; fullName: string; position: string; status: EmployeeStatus };
export async function listEmployees(companyId: string, branchId: string): Promise<EmployeeRecord[]> { const rows = await getEmployeeModel().find({ companyId, branchId }).sort({ fullName: 1 }).lean().exec(); return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row })); }
export async function createEmployee(input: { companyId: string; branchId: string; departmentId: string; userId: string; fullName: string; position: string }): Promise<EmployeeRecord> {
  const linkedUser = await getUserModel().exists({ _id: input.userId, companyId: input.companyId, branchId: input.branchId, isActive: true });
  if (!linkedUser) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Employee user not found in tenant', friendlyMessage: 'El usuario debe estar activo y pertenecer a la misma empresa y sucursal.', statusCode: 400 });
  try {
    const row = await getEmployeeModel().create({ ...input, fullName: input.fullName.trim(), position: input.position.trim(), status: 'ACTIVE' });
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, departmentId: row.departmentId, userId: row.userId, fullName: row.fullName, position: row.position, status: row.status };
  } catch (error) { if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Employee already linked to user', friendlyMessage: 'Ese usuario ya tiene un registro de empleado.', statusCode: 409 }); throw error; }
}
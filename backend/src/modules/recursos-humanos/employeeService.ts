import mongoose, {type ClientSession} from 'mongoose';
import {getDepartmentModel} from '../empresas/models/Department.js';
import {getAuditEventModel} from '../auditoria/models/AuditEvent.js';
import {catalogFilter,catalogSlice,type CatalogQuery} from '../../core/catalogPagination.js';
import { AppError } from '../../errors/AppError.js';
import { getUserModel } from '../usuarios/models/User.js';
import { getEmployeeModel, type EmployeeStatus } from './models/Employee.js';
export type EmployeeRecord = { id: string; companyId: string; branchId: string; departmentId: string; userId: string; fullName: string; position: string; status: EmployeeStatus };
export async function listEmployees(companyId: string, branchId: string): Promise<EmployeeRecord[]> { const rows = await getEmployeeModel().find({ companyId, branchId }).sort({ fullName: 1 }).lean().exec(); return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row })); }
export async function createEmployee(input: { companyId: string; branchId: string; departmentId: string; userId: string; fullName: string; position: string }, session?:ClientSession): Promise<EmployeeRecord> {
  const linkedUser = await getUserModel().exists({ _id: input.userId, companyId: input.companyId, branchId: input.branchId, isActive: true }).session(session??null);
  if (!linkedUser) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Employee user not found in tenant', friendlyMessage: 'El usuario debe estar activo y pertenecer a la misma empresa y sucursal.', statusCode: 400 });
  const department=await getDepartmentModel().exists({_id:input.departmentId,companyId:input.companyId,branchId:input.branchId,status:'ACTIVE'}).session(session??null);
  if(!department)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid employee department',friendlyMessage:'Selecciona un departamento activo de tu empresa y sucursal.',statusCode:400});
  try {
    const value={...input,fullName:input.fullName.trim(),position:input.position.trim(),status:'ACTIVE' as const};
    const row = session ? (await getEmployeeModel().create([value],{session}))[0] : await getEmployeeModel().create(value);
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, departmentId: row.departmentId, userId: row.userId, fullName: row.fullName, position: row.position, status: row.status };
  } catch (error) { if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Employee already linked to user', friendlyMessage: 'Ese usuario ya tiene un registro de empleado.', statusCode: 409 }); throw error; }
}
export async function pageEmployees(companyId:string,branchId:string,query:CatalogQuery){
 const filter=catalogFilter({companyId,branchId},query,['fullName','position']);
 const rows=await getEmployeeModel().find(filter).sort({_id:-1}).limit(query.limit+1).lean().exec();return catalogSlice(rows,query.limit);
}

export async function createAuditedEmployee(input:Parameters<typeof createEmployee>[0],context:{userId:string;ipAddress?:string}){
 if(!context.userId.trim())throw new AppError({code:'UNAUTHORIZED',message:'Missing audit user',friendlyMessage:'La sesión no tiene un usuario activo.',statusCode:401});
 const model=getEmployeeModel(),audit=getAuditEventModel();await Promise.all([model.init(),audit.init()]);const session=await mongoose.startSession();
 try{return await session.withTransaction(async()=>{
  const row=await createEmployee(input,session);
  await audit.create([{companyId:input.companyId,branchId:input.branchId,userId:context.userId,action:'CREATE',module:'rrhh',entityId:row.id,details:{departmentId:row.departmentId,linkedUserId:row.userId},ipAddress:context.ipAddress}],{session});return row;
 });}finally{await session.endSession();}
}

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

export async function updateAuditedEmployee(input:{companyId:string;branchId:string;id:string;fullName:string;position:string;expected:{fullName:string;position:string}},context:{userId:string;ipAddress?:string}){
 if(!context.userId.trim())throw new AppError({code:'UNAUTHORIZED',message:'Missing employee audit actor',friendlyMessage:'La sesión no tiene un usuario activo.',statusCode:401});
 const model=getEmployeeModel(),audit=getAuditEventModel();await Promise.all([model.init(),audit.init()]);const session=await mongoose.startSession();
 try{return await session.withTransaction(async()=>{
  const row=await model.findOneAndUpdate({_id:input.id,companyId:input.companyId,branchId:input.branchId,fullName:input.expected.fullName,position:input.expected.position},{$set:{fullName:input.fullName.trim(),position:input.position.trim()}},{new:true,runValidators:true,session}).lean().exec();
  if(!row)throw new AppError({code:'CONFLICT',message:'Employee missing or concurrently changed',friendlyMessage:'El empleado cambió o ya no está disponible. Actualiza antes de editar.',statusCode:409});
  await audit.create([{companyId:input.companyId,branchId:input.branchId,userId:context.userId,action:'UPDATE',module:'rrhh',entityId:String(row._id),details:{fields:['fullName','position']},ipAddress:context.ipAddress}],{session});
  return {id:String(row._id),companyId:row.companyId,branchId:row.branchId,departmentId:row.departmentId,userId:row.userId,fullName:row.fullName,position:row.position,status:row.status};
 });}finally{await session.endSession();}
}

export async function updateAuditedEmployeeStatus(input:{companyId:string;branchId:string;id:string;status:EmployeeStatus;expectedStatus:EmployeeStatus},context:{userId:string;ipAddress?:string}){
 if(!context.userId.trim())throw new AppError({code:'UNAUTHORIZED',message:'Missing employee audit actor',friendlyMessage:'La sesión no tiene un usuario activo.',statusCode:401});
 if(!['ACTIVE','INACTIVE'].includes(input.status)||!['ACTIVE','INACTIVE'].includes(input.expectedStatus)||input.status===input.expectedStatus)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid employee transition',friendlyMessage:'Selecciona un estado distinto del actual.',statusCode:400});
 const model=getEmployeeModel(),audit=getAuditEventModel();await Promise.all([model.init(),audit.init()]);const session=await mongoose.startSession();
 try{return await session.withTransaction(async()=>{
  const current=await model.findOne({_id:input.id,companyId:input.companyId,branchId:input.branchId,status:input.expectedStatus}).session(session).lean().exec();
  if(!current)throw new AppError({code:'CONFLICT',message:'Employee status changed',friendlyMessage:'El empleado cambió o ya no está disponible. Actualiza la lista.',statusCode:409});
  if(input.status==='ACTIVE'){
   const user=await getUserModel().exists({_id:current.userId,companyId:input.companyId,branchId:input.branchId,isActive:true}).session(session);
   const department=await getDepartmentModel().exists({_id:current.departmentId,companyId:input.companyId,branchId:input.branchId,status:'ACTIVE'}).session(session);
   if(!user||!department)throw new AppError({code:'VALIDATION_ERROR',message:'Inactive employee links',friendlyMessage:'Para activar al empleado, su usuario y departamento deben estar activos en esta sucursal.',statusCode:400});
  }
  const row=await model.findOneAndUpdate({_id:input.id,companyId:input.companyId,branchId:input.branchId,status:input.expectedStatus},{$set:{status:input.status}},{new:true,runValidators:true,session}).lean().exec();
  if(!row)throw new AppError({code:'CONFLICT',message:'Employee status changed',friendlyMessage:'El empleado cambió. Actualiza la lista.',statusCode:409});
  await audit.create([{companyId:input.companyId,branchId:input.branchId,userId:context.userId,action:'UPDATE',module:'rrhh',entityId:String(row._id),details:{previousStatus:input.expectedStatus,status:input.status},ipAddress:context.ipAddress}],{session});
  return {id:String(row._id),companyId:row.companyId,branchId:row.branchId,departmentId:row.departmentId,userId:row.userId,fullName:row.fullName,position:row.position,status:row.status};
 });}finally{await session.endSession();}
}

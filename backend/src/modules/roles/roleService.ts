import {z} from 'zod';import {getUserModel} from '../usuarios/models/User.js';
import mongoose, { Types, type ClientSession } from 'mongoose';
import {getAuditEventModel} from '../auditoria/models/AuditEvent.js';
import { AppError } from '../../errors/AppError.js';
import { getRoleModel } from './models/Role.js';

export type RoleRecord = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  companyId?: string;
  isSystem?: boolean;
  updatedAt?:string;
  isActive?:boolean;
};

const roleCatalog: Record<string, RoleRecord> = {
  ADMIN: { id: 'role-admin-demo', name: 'ADMIN', description: 'Administrador del sistema', permissions: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'auth.profile', 'rrhh.ver', 'rrhh.crear', 'rrhh.editar', 'rrhh.eliminar', 'proyectos.ver', 'proyectos.crear', 'proyectos.editar', 'proyectos.eliminar', 'crm.ver', 'crm.crear', 'crm.editar', 'crm.eliminar', 'logistica.ver', 'logistica.crear', 'logistica.editar', 'logistica.autorizar', 'notificaciones.ver', 'notificaciones.configurar', 'auditoria.ver', 'reportes.ver', 'integraciones.ver', 'integraciones.configurar', 'ia.consultar', 'ia.configurar', 'ia.ejecutar', 'dashboard.ver', 'configuracion.ver'] },
  GERENTE: { id: 'role-gerente-demo', name: 'GERENTE', description: 'Responsable operativo', permissions: ['usuarios.ver', 'auth.profile', 'ventas.ver', 'compras.ver', 'proyectos.ver', 'proyectos.crear', 'proyectos.editar', 'crm.ver', 'crm.crear', 'crm.editar', 'logistica.ver', 'logistica.crear', 'logistica.editar', 'notificaciones.ver', 'auditoria.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver', 'configuracion.ver'] },
  VENTAS: { id: 'role-ventas-demo', name: 'VENTAS', description: 'Equipo comercial', permissions: ['usuarios.ver', 'auth.profile', 'ventas.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver'] },
  COMPRAS: { id: 'role-compras-demo', name: 'COMPRAS', description: 'Gestion de compras', permissions: ['usuarios.ver', 'auth.profile', 'compras.ver', 'reportes.ver', 'integraciones.ver', 'dashboard.ver'] },
  ALMACEN: { id: 'role-almacen-demo', name: 'ALMACEN', description: 'Operacion de almacen', permissions: ['usuarios.ver', 'auth.profile', 'inventario.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver'] },
  CONTABILIDAD: { id: 'role-contabilidad-demo', name: 'CONTABILIDAD', description: 'Contabilidad y finanzas', permissions: ['usuarios.ver', 'auth.profile', 'finanzas.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver'] },
  RRHH: { id: 'role-rrhh-demo', name: 'RRHH', description: 'Recursos humanos', permissions: ['usuarios.ver', 'auth.profile', 'rrhh.ver', 'rrhh.crear', 'rrhh.editar', 'rrhh.eliminar', 'reportes.ver', 'integraciones.ver', 'dashboard.ver'] },
  PRODUCCION: { id: 'role-produccion-demo', name: 'PRODUCCION', description: 'Operaciones de produccion', permissions: ['usuarios.ver', 'auth.profile', 'produccion.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver'] },
  AUDITOR: { id: 'role-auditor-demo', name: 'AUDITOR', description: 'Auditoria y control', permissions: ['usuarios.ver', 'auth.profile', 'auditoria.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver', 'configuracion.ver'] },
  CONSULTA: { id: 'role-consulta-demo', name: 'CONSULTA', description: 'Solo consulta', permissions: ['usuarios.ver', 'auth.profile', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver'] }
};

const roleDb: RoleRecord[] = Object.values(roleCatalog);
const normalizedKey = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export function listRoles(): RoleRecord[] { return roleDb; }

export function resolveRolePermissions(roleName: string): string[] {
  const role = roleCatalog[normalizedKey(roleName)];
  if (!role) throw new AppError({ code: 'NOT_FOUND', message: 'Rol no encontrado', friendlyMessage: 'El rol solicitado no existe.', statusCode: 404 });
  return role.permissions;
}

export function createRole(input: { name: string; description: string; permissions: string[] }): RoleRecord {
  const name = input.name.trim().toUpperCase();
  if (!name || !input.description.trim() || !Array.isArray(input.permissions) || input.permissions.length === 0) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Role requires a name, description, and permissions', friendlyMessage: 'Provide valid role details.', statusCode: 400 });
  }
  const created = { id: `role-${Date.now()}`, name, description: input.description.trim(), permissions: [...new Set(input.permissions)] };
  roleDb.push(created);
  roleCatalog[normalizedKey(name)] = created;
  return created;
}

export async function listRolesForCompany(companyId: string): Promise<RoleRecord[]> {
  const Role = getRoleModel();
  const customRoles = await Role.find({ companyId }).sort({ name: 1 }).lean().exec();
  return [
    ...Object.values(roleCatalog).map((role) => ({ ...role, permissions: [...role.permissions], isSystem: true, isActive: true })),
    ...customRoles.map((role) => ({ id: String(role._id), name: role.name, description: role.description, permissions: role.permissions, companyId: role.companyId, isSystem: false, isActive:role.isActive!==false, updatedAt:role.updatedAt.toISOString() }))
  ];
}

export async function findAssignableRole(roleId: string, companyId: string, session?:ClientSession): Promise<RoleRecord> {
  const systemRole = Object.values(roleCatalog).find((role) => role.id === roleId || normalizedKey(role.name) === normalizedKey(roleId));
  if (systemRole) return systemRole;
  if (!Types.ObjectId.isValid(roleId)) throw new AppError({ code: 'NOT_FOUND', message: 'Rol no encontrado', friendlyMessage: 'Selecciona un rol valido para tu empresa.', statusCode: 404 });
  const Role = getRoleModel();
  const role = session?await Role.findOneAndUpdate({ _id: roleId, companyId, isActive: {$ne:false} },{$inc:{__v:1}},{new:true,session,timestamps:false}).lean().exec():await Role.findOne({ _id: roleId, companyId, isActive: {$ne:false} }).lean().exec();
  if (!role) throw new AppError({ code: 'NOT_FOUND', message: 'Rol no encontrado en la empresa', friendlyMessage: 'Selecciona un rol valido para tu empresa.', statusCode: 404 });
  return { id: String(role._id), name: role.name, description: role.description, permissions: role.permissions, companyId: role.companyId, isSystem: false, isActive:role.isActive!==false, updatedAt:role.updatedAt.toISOString() };
}

export async function createRoleForCompany(companyId: string, input: { name: string; description: string; permissions: string[] }, session?:ClientSession): Promise<RoleRecord> {
  const name = input.name.trim().toUpperCase();
  const description = input.description.trim();
  const permissions = [...new Set(input.permissions)];
  if (!name || name.length > 60 || !description || description.length > 250 || permissions.length === 0 || permissions.some((permission) => !/^[a-z][a-z0-9_-]*\.[a-z][a-z0-9_-]*$/i.test(permission))) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Datos de rol invalidos', friendlyMessage: 'Revisa el nombre, la descripcion y los permisos.', statusCode: 400 });
  }
  if (Object.prototype.hasOwnProperty.call(roleCatalog, normalizedKey(name))) throw new AppError({ code: 'CONFLICT', message: 'Nombre reservado para rol del sistema', friendlyMessage: 'Ese nombre pertenece a un rol del sistema.', statusCode: 409 });
  const Role = getRoleModel();
  try {
    const [created] = await Role.create([{ companyId, name, description, permissions, isSystem: false }],session?{session}:{});
    return { id: String(created._id), name: created.name, description: created.description, permissions: created.permissions, companyId, isSystem: false, updatedAt:created.updatedAt.toISOString() };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      throw new AppError({ code: 'CONFLICT', message: 'Rol duplicado en la empresa', friendlyMessage: 'Ya existe un rol con ese nombre en tu empresa.', statusCode: 409 });
    }
    throw error;
  }
}
export async function createAuditedRole(scope:{companyId:string;branchId:string;userId:string;permissions:string[];ipAddress?:string},input:{name:string;description:string;permissions:string[]}):Promise<RoleRecord>{if(!scope.companyId?.trim()||!scope.branchId?.trim()||!scope.userId?.trim())throw new AppError({code:'UNAUTHORIZED',message:'Missing role scope',friendlyMessage:'Inicia sesión con empresa y sucursal.',statusCode:401});if(input.permissions.some(p=>!scope.permissions.includes(p)))throw new AppError({code:'FORBIDDEN',message:'Elevated role grant',friendlyMessage:'Solo puedes asignar permisos que ya tienes.',statusCode:403});await Promise.all([getRoleModel().init(),getAuditEventModel().init()]);const session=await mongoose.startSession();let result:RoleRecord|undefined;try{await session.withTransaction(async()=>{result=await createRoleForCompany(scope.companyId,input,session);await getAuditEventModel().create([{userId:scope.userId,companyId:scope.companyId,branchId:scope.branchId,action:'CREATE',module:'roles',entityId:result.id,details:{roleName:result.name,permissions:result.permissions},ipAddress:scope.ipAddress}],{session});});return result!;}finally{await session.endSession();}}

export const roleUpdateSchema=z.object({description:z.string().trim().min(2).max(250),permissions:z.array(z.string().regex(/^[a-z][a-z0-9_-]*\.[a-z][a-z0-9_-]*$/i)).min(1).max(100),expectedUpdatedAt:z.string().datetime()}).strict().refine(v=>new Set(v.permissions).size===v.permissions.length);
export async function updateAuditedRole(scope:{companyId:string;branchId:string;userId:string;permissions:string[];ipAddress?:string},roleId:string,payload:unknown){if(!scope.companyId?.trim()||!scope.branchId?.trim()||!/^[a-f0-9]{24}$/i.test(scope.userId))throw new AppError({code:'UNAUTHORIZED',message:'Missing role actor',friendlyMessage:'Inicia sesión de nuevo.',statusCode:401});const p=roleUpdateSchema.safeParse(payload);if(!p.success||!/^[a-f0-9]{24}$/i.test(roleId))throw new AppError({code:'VALIDATION_ERROR',message:'Invalid role update',friendlyMessage:'Revisa la descripción y los permisos.',statusCode:400});if(p.data.permissions.some(v=>!scope.permissions.includes(v)))throw new AppError({code:'FORBIDDEN',message:'Elevated grants',friendlyMessage:'Solo puedes asignar permisos que ya tienes.',statusCode:403});await Promise.all([getRoleModel().init(),getUserModel().init(),getAuditEventModel().init()]);const session=await mongoose.startSession();let result;try{await session.withTransaction(async()=>{const current=await getRoleModel().findOne({_id:roleId,companyId:scope.companyId,isSystem:false,isActive:{$ne:false},updatedAt:new Date(p.data.expectedUpdatedAt)}).session(session).lean();if(!current)throw new AppError({code:'CONFLICT',message:'Role changed',friendlyMessage:'El rol cambió. Actualiza antes de reintentar.',statusCode:409});if(current.permissions.some(v=>!scope.permissions.includes(v))||await getUserModel().exists({_id:scope.userId,companyId:scope.companyId,roleId}).session(session))throw new AppError({code:'FORBIDDEN',message:'Protected role',friendlyMessage:'No puedes editar tu propio rol ni uno con permisos superiores.',statusCode:403});if(current.description===p.data.description&&JSON.stringify([...current.permissions].sort())===JSON.stringify([...p.data.permissions].sort()))throw new AppError({code:'VALIDATION_ERROR',message:'Unchanged role',friendlyMessage:'Indica un cambio en la descripción o permisos.',statusCode:400});const updated=await getRoleModel().findOneAndUpdate({_id:roleId,companyId:scope.companyId,isSystem:false,updatedAt:current.updatedAt},{$set:{description:p.data.description,permissions:[...p.data.permissions].sort(),updatedAt:new Date(Math.max(Date.now(),current.updatedAt.getTime()+1))},$inc:{__v:1}},{new:true,session,timestamps:false}).lean();if(!updated)throw new AppError({code:'CONFLICT',message:'Role changed',friendlyMessage:'Actualiza el rol antes de reintentar.',statusCode:409});const affected=await getUserModel().updateMany({companyId:scope.companyId,roleId},{$set:{permissions:updated.permissions},$inc:{sessionVersion:1}},{session});await getAuditEventModel().create([{userId:scope.userId,companyId:scope.companyId,branchId:scope.branchId,action:'UPDATE',module:'roles',entityId:roleId,details:{previousPermissions:current.permissions,permissions:updated.permissions,affectedUsers:affected.modifiedCount,sessionsRevoked:true},ipAddress:scope.ipAddress}],{session});result={id:String(updated._id),name:updated.name,description:updated.description,permissions:updated.permissions,companyId:updated.companyId,isSystem:false,updatedAt:updated.updatedAt.toISOString()};});return result!;}finally{await session.endSession();}}

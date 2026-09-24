import { Types } from 'mongoose';
import { AppError } from '../../errors/AppError.js';
import { getRoleModel } from './models/Role.js';

export type RoleRecord = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  companyId?: string;
  isSystem?: boolean;
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
    ...Object.values(roleCatalog).map((role) => ({ ...role, permissions: [...role.permissions], isSystem: true })),
    ...customRoles.map((role) => ({ id: String(role._id), name: role.name, description: role.description, permissions: role.permissions, companyId: role.companyId, isSystem: false }))
  ];
}

export async function findAssignableRole(roleId: string, companyId: string): Promise<RoleRecord> {
  const systemRole = Object.values(roleCatalog).find((role) => role.id === roleId || normalizedKey(role.name) === normalizedKey(roleId));
  if (systemRole) return systemRole;
  if (!Types.ObjectId.isValid(roleId)) throw new AppError({ code: 'NOT_FOUND', message: 'Rol no encontrado', friendlyMessage: 'Selecciona un rol valido para tu empresa.', statusCode: 404 });
  const Role = getRoleModel();
  const role = await Role.findOne({ _id: roleId, companyId }).lean().exec();
  if (!role) throw new AppError({ code: 'NOT_FOUND', message: 'Rol no encontrado en la empresa', friendlyMessage: 'Selecciona un rol valido para tu empresa.', statusCode: 404 });
  return { id: String(role._id), name: role.name, description: role.description, permissions: role.permissions, companyId: role.companyId, isSystem: false };
}

export async function createRoleForCompany(companyId: string, input: { name: string; description: string; permissions: string[] }): Promise<RoleRecord> {
  const name = input.name.trim().toUpperCase();
  const description = input.description.trim();
  const permissions = [...new Set(input.permissions)];
  if (!name || name.length > 60 || !description || description.length > 250 || permissions.length === 0 || permissions.some((permission) => !/^[a-z][a-z0-9_-]*\.[a-z][a-z0-9_-]*$/i.test(permission))) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Datos de rol invalidos', friendlyMessage: 'Revisa el nombre, la descripcion y los permisos.', statusCode: 400 });
  }
  if (Object.prototype.hasOwnProperty.call(roleCatalog, normalizedKey(name))) throw new AppError({ code: 'CONFLICT', message: 'Nombre reservado para rol del sistema', friendlyMessage: 'Ese nombre pertenece a un rol del sistema.', statusCode: 409 });
  const Role = getRoleModel();
  try {
    const created = await Role.create({ companyId, name, description, permissions, isSystem: false });
    return { id: String(created._id), name: created.name, description: created.description, permissions: created.permissions, companyId, isSystem: false };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      throw new AppError({ code: 'CONFLICT', message: 'Rol duplicado en la empresa', friendlyMessage: 'Ya existe un rol con ese nombre en tu empresa.', statusCode: 409 });
    }
    throw error;
  }
}
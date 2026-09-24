import { AppError } from '../../errors/AppError.js';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  companyId: string;
  branchId: string;
  permissions: string[];
};

const USER_DB: Record<string, UserRecord[]> = {};

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  'role-admin-demo': ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'auth.profile'],
  'role-ventas-demo': ['usuarios.ver', 'auth.profile'],
  'role-compras-demo': ['usuarios.ver']
};

export function seedUsers(): void {
  USER_DB['company-demo-01'] = [
    {
      id: 'user-admin-demo',
      name: 'Administrador demo',
      email: 'admin@erp.local',
      roleId: 'role-admin-demo',
      companyId: 'company-demo-01',
      branchId: 'branch-demo-01',
      permissions: DEFAULT_ROLE_PERMISSIONS['role-admin-demo']
    }
  ];
}

export function listUsers(companyId: string): UserRecord[] {
  return USER_DB[companyId] ?? [];
}

export function createUser(input: {
  name: string;
  email: string;
  roleId: string;
  companyId: string;
  branchId: string;
}): UserRecord {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email || !input.roleId || !input.companyId || !input.branchId) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Datos del usuario incompletos',
      friendlyMessage: 'Faltan campos obligatorios para crear el usuario.',
      statusCode: 400
    });
  }

  if (!email.includes('@')) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Email inválido',
      friendlyMessage: 'El email no tiene un formato válido.',
      statusCode: 400
    });
  }

  const permissions = DEFAULT_ROLE_PERMISSIONS[input.roleId] ?? ['usuarios.ver'];
  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    name,
    email,
    roleId: input.roleId,
    companyId: input.companyId,
    branchId: input.branchId,
    permissions
  };

  const existing = USER_DB[input.companyId] ?? [];
  USER_DB[input.companyId] = [...existing, newUser];

  return newUser;
}

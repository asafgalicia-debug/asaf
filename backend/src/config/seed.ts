export type RoleSeed = {
  name: string;
  description: string;
  permissions: string[];
};

export type UserSeed = {
  email: string;
  name: string;
  passwordHash: string;
  companyId: string;
  branchId: string;
  roleId: string;
  permissions: string[];
};

export function buildDefaultRoleSeed(): RoleSeed[] {
  return [
    {
      name: 'ADMIN',
      description: 'Administrador del sistema',
      permissions: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'auth.profile', 'auditoria.ver', 'reportes.ver', 'integraciones.ver', 'integraciones.configurar', 'ia.consultar', 'ia.configurar', 'ia.ejecutar', 'dashboard.ver', 'configuracion.ver']
    },
    {
      name: 'GERENTE',
      description: 'Responsable operativo',
      permissions: ['usuarios.ver', 'auth.profile', 'ventas.ver', 'compras.ver', 'auditoria.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver', 'configuracion.ver']
    },
    {
      name: 'VENTAS',
      description: 'Equipo comercial',
      permissions: ['usuarios.ver', 'auth.profile', 'ventas.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver']
    },
    {
      name: 'COMPRAS',
      description: 'Gestión de compras',
      permissions: ['usuarios.ver', 'auth.profile', 'compras.ver', 'reportes.ver', 'integraciones.ver', 'dashboard.ver']
    },
    {
      name: 'ALMACÉN',
      description: 'Operación logística',
      permissions: ['usuarios.ver', 'auth.profile', 'inventario.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver']
    },
    {
      name: 'CONTABILIDAD',
      description: 'Contabilidad y finanzas',
      permissions: ['usuarios.ver', 'auth.profile', 'finanzas.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver']
    },
    {
      name: 'RRHH',
      description: 'Recursos humanos',
      permissions: ['usuarios.ver', 'auth.profile', 'rrhh.ver', 'reportes.ver', 'integraciones.ver', 'dashboard.ver']
    },
    {
      name: 'PRODUCCIÓN',
      description: 'Producción y operación',
      permissions: ['usuarios.ver', 'auth.profile', 'produccion.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver']
    },
    {
      name: 'AUDITOR',
      description: 'Auditoría y control',
      permissions: ['usuarios.ver', 'auth.profile', 'auditoria.ver', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver', 'configuracion.ver']
    },
    {
      name: 'CONSULTA',
      description: 'Consulta no operativa',
      permissions: ['usuarios.ver', 'auth.profile', 'reportes.ver', 'integraciones.ver', 'ia.consultar', 'dashboard.ver']
    }
  ];
}

export function buildDefaultUserSeed(): UserSeed {
  return {
    email: 'admin@erp.local',
    name: 'Administrador demo',
    passwordHash: '$2a$10$0h7zvBOWkWJ/erzJnkflgO9O2Nf3Twch5KI1vOczJ5NoMFGja91Na',
    companyId: 'company-demo-01',
    branchId: 'branch-demo-01',
    roleId: 'role-admin-demo',
    permissions: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'auth.profile', 'auditoria.ver', 'reportes.ver', 'integraciones.ver', 'integraciones.configurar', 'ia.consultar', 'ia.configurar', 'ia.ejecutar', 'dashboard.ver', 'configuracion.ver']
  };
}

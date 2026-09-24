export type ModuleManifest = {
  id: string;
  name: string;
  version: string;
  state: 'planeado' | 'en-construcci\u00f3n' | 'estable' | 'deprecado';
  apiPrefix: string;
  permissions: string[];
  enabledByDefault?: boolean;
};

const moduleCatalog: ModuleManifest[] = [
  { id: 'auth', name: 'Autenticaci\u00f3n', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/auth', permissions: ['auth.login', 'auth.register', 'auth.logout', 'auth.profile'], enabledByDefault: true },
  { id: 'usuarios', name: 'Usuarios', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/users', permissions: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar'], enabledByDefault: true },
  { id: 'roles', name: 'Roles y permisos', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/roles', permissions: ['roles.ver', 'roles.crear', 'roles.editar'], enabledByDefault: true },
  { id: 'auditoria', name: 'Auditor\u00eda', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/audit', permissions: ['auditoria.ver'], enabledByDefault: true }
];

export function loadModuleManifests(): ModuleManifest[] {
  return moduleCatalog.map((module) => ({ ...module, permissions: [...module.permissions] }));
}
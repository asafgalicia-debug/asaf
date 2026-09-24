import type { ModuleManifest } from '../../core/moduleRegistry.js';

const manifest: ModuleManifest = {
  id: 'usuarios',
  name: 'Usuarios',
  version: '0.1.0',
  state: 'en-construcción',
  apiPrefix: '/users',
  permissions: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar']
};

export default manifest;

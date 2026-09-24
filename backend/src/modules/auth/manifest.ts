import type { ModuleManifest } from '../../core/moduleRegistry.js';

const manifest: ModuleManifest = {
  id: 'auth',
  name: 'Autenticación',
  version: '0.1.0',
  state: 'en-construcción',
  apiPrefix: '/auth',
  permissions: ['auth.login', 'auth.register', 'auth.logout', 'auth.profile']
};

export default manifest;

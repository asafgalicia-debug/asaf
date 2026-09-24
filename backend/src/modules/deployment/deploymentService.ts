import { env } from '../../config/env.js';

export type DeploymentModule = {
  id: string;
  name: string;
  enabled: boolean;
  version: string;
  status: 'stable' | 'in-progress';
};

export type DeploymentTarget = {
  type: 'docker' | 'web' | 'mobile';
  name: string;
  status: 'ready' | 'planned';
  endpoint?: string;
};

export type DeploymentStatus = {
  service: string;
  version: string;
  environment: string;
  readyForProduction: boolean;
  modules: DeploymentModule[];
  deploymentTargets: DeploymentTarget[];
  uptimeSeconds: number;
  startedAt: string;
};

const ERP_VERSION = '0.1.0';
const startedAt = Date.now();

const modules: DeploymentModule[] = [
  { id: 'auth', name: 'Autenticación', enabled: true, version: '0.1.0', status: 'stable' },
  { id: 'users', name: 'Usuarios', enabled: true, version: '0.1.0', status: 'stable' },
  { id: 'roles', name: 'Roles y permisos', enabled: true, version: '0.1.0', status: 'stable' },
  { id: 'companies', name: 'Empresas y sucursales', enabled: true, version: '0.1.0', status: 'stable' },
  { id: 'sales', name: 'Ventas', enabled: true, version: '0.1.0', status: 'stable' },
  { id: 'inventory', name: 'Inventario', enabled: true, version: '0.1.0', status: 'stable' },
  { id: 'finance', name: 'Finanzas', enabled: true, version: '0.1.0', status: 'stable' },
  { id: 'dashboard', name: 'Dashboard', enabled: true, version: '0.1.0', status: 'stable' },
  { id: 'integrations', name: 'Integraciones', enabled: true, version: '0.1.0', status: 'stable' }
];

export function getDeploymentStatus(): DeploymentStatus {
  const uptimeSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  return {
    service: 'erp-api',
    version: ERP_VERSION,
    environment: env.NODE_ENV,
    readyForProduction: true,
    modules,
    deploymentTargets: [
      { type: 'docker', name: 'ERP API container', status: 'ready', endpoint: 'http://localhost:4000' },
      { type: 'web', name: 'ERP Web client', status: 'ready', endpoint: 'http://localhost:3000' },
      { type: 'mobile', name: 'ERP Mobile client', status: 'planned', endpoint: 'expo://app' }
    ],
    uptimeSeconds,
    startedAt: new Date(startedAt).toISOString()
  };
}

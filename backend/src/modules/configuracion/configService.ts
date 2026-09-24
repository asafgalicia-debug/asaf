import { AppError } from '../../errors/AppError.js';

export type ModuleConfig = {
  companyId: string;
  module: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updatedAt: string;
};

const moduleConfigs: Record<string, ModuleConfig> = {
  'company-demo-01:auth': {
    companyId: 'company-demo-01',
    module: 'auth',
    enabled: true,
    config: { requireMfa: false },
    updatedAt: new Date().toISOString()
  },
  'company-demo-01:sales': {
    companyId: 'company-demo-01',
    module: 'sales',
    enabled: true,
    config: { taxRate: 0.21 },
    updatedAt: new Date().toISOString()
  },
  'company-demo-01:inventory': {
    companyId: 'company-demo-01',
    module: 'inventory',
    enabled: true,
    config: { stockAlertThreshold: 10 },
    updatedAt: new Date().toISOString()
  }
};

export function listModuleConfigs(companyId: string): ModuleConfig[] {
  return Object.values(moduleConfigs).filter((item) => item.companyId === companyId);
}

export function getModuleConfig(companyId: string, module: string): ModuleConfig {
  const key = `${companyId}:${module}`;
  const config = moduleConfigs[key];

  if (!config) {
    throw new AppError({
      code: 'NOT_FOUND',
      message: 'Configuración no encontrada',
      friendlyMessage: 'No existe configuración activa para este módulo.',
      statusCode: 404
    });
  }

  return config;
}

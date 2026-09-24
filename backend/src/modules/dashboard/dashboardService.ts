import { AppError } from '../../errors/AppError.js';

export type DashboardWidget = {
  id: string;
  name: 'ventas' | 'compras' | 'finanzas' | 'rrhh' | 'inventario';
  title: string;
  value: number;
  trend: number;
};

export type DashboardSummary = {
  companyId: string;
  metrics: {
    sales: number;
    purchases: number;
    cash: number;
    employees: number;
    inventory: number;
  };
  lastUpdated: string;
};

const dashboardWidgets: Record<string, DashboardWidget[]> = {
  'company-demo-01': [
    { id: 'widget-sales', name: 'ventas', title: 'Ventas', value: 12450, trend: 12 },
    { id: 'widget-finance', name: 'finanzas', title: 'Finanzas', value: 8260, trend: 8 },
    { id: 'widget-inventory', name: 'inventario', title: 'Inventario', value: 340, trend: 5 }
  ]
};

const dashboardSummaries: Record<string, DashboardSummary> = {
  'company-demo-01': {
    companyId: 'company-demo-01',
    metrics: {
      sales: 12450,
      purchases: 6800,
      cash: 32000,
      employees: 48,
      inventory: 340
    },
    lastUpdated: new Date().toISOString()
  }
};

export function getDashboardSummary(companyId: string): DashboardSummary {
  const summary = dashboardSummaries[companyId];
  if (!summary) {
    throw new AppError({
      code: 'NOT_FOUND',
      message: 'Dashboard no encontrado',
      friendlyMessage: 'No existe un resumen de dashboard para esta empresa.',
      statusCode: 404
    });
  }
  return summary;
}

export function listDashboardWidgets(companyId: string): DashboardWidget[] {
  const widgets = dashboardWidgets[companyId];
  if (!widgets) {
    return [];
  }
  return widgets;
}

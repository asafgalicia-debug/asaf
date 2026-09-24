export type MaintenanceWorkOrder = {
  asset: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  hours: number;
};

export type MaintenancePlanningSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    preventiveCoverage: number;
    riskIndex: number;
    plannedHours: number;
    estimatedUptime: number;
  };
  nextMaintenanceWindow: string;
  workOrders: MaintenanceWorkOrder[];
};

export function getMaintenancePlanningSummary(): MaintenancePlanningSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      preventiveCoverage: 94.8,
      riskIndex: 22.6,
      plannedHours: 168,
      estimatedUptime: 98.7
    },
    nextMaintenanceWindow: '2026-09-29',
    workOrders: [
      { asset: 'Conveyor A3', status: 'scheduled', priority: 'high', hours: 18 },
      { asset: 'Press 12', status: 'in_progress', priority: 'medium', hours: 12 },
      { asset: 'Forklift 7', status: 'completed', priority: 'low', hours: 8 }
    ]
  };
}

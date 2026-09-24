export type MaintenanceAsset = {
  name: string;
  status: 'running' | 'scheduled' | 'warning';
  nextService: string;
  criticality: 'low' | 'medium' | 'high';
};

export type MaintenanceSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    availability: number;
    preventiveRate: number;
    downtimeRisk: number;
  };
  assets: MaintenanceAsset[];
};

export function getMaintenanceSummary(): MaintenanceSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      availability: 97.8,
      preventiveRate: 84.5,
      downtimeRisk: 6.2
    },
    assets: [
      { name: 'CNC-07', status: 'running', nextService: '2026-10-03', criticality: 'high' },
      { name: 'Boiler A2', status: 'scheduled', nextService: '2026-09-29', criticality: 'medium' },
      { name: 'Line 4 Robot', status: 'warning', nextService: '2026-09-26', criticality: 'high' }
    ]
  };
}

export type AssetRecord = {
  name: string;
  status: 'operational' | 'maintenance' | 'offline';
  utilization: number;
  downtime: number;
};

export type AssetManagementSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    utilizationRate: number;
    downtimeRate: number;
    maintenanceCoverage: number;
  };
  assets: AssetRecord[];
};

export function getAssetManagementSummary(): AssetManagementSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      utilizationRate: 86.4,
      downtimeRate: 4.8,
      maintenanceCoverage: 93.7
    },
    assets: [
      { name: 'Forklift 7', status: 'operational', utilization: 91, downtime: 2 },
      { name: 'Press 12', status: 'maintenance', utilization: 74, downtime: 7 },
      { name: 'Conveyor A3', status: 'offline', utilization: 58, downtime: 11 }
    ]
  };
}

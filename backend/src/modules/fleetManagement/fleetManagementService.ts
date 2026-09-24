export type FleetVehicle = {
  plate: string;
  status: 'available' | 'route' | 'maintenance';
  utilization: number;
  nextService: string;
};

export type FleetManagementSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    utilization: number;
    routeEfficiency: number;
    maintenanceReadiness: number;
  };
  vehicles: FleetVehicle[];
};

export function getFleetManagementSummary(): FleetManagementSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      utilization: 82.4,
      routeEfficiency: 94.1,
      maintenanceReadiness: 96.2
    },
    vehicles: [
      { plate: 'AB-1234-CD', status: 'route', utilization: 88, nextService: '2026-10-05' },
      { plate: 'EF-5678-GH', status: 'available', utilization: 74, nextService: '2026-10-12' },
      { plate: 'IJ-9012-KL', status: 'maintenance', utilization: 62, nextService: '2026-09-28' }
    ]
  };
}

export type WarehouseLocation = {
  zone: 'Zone A' | 'Zone B' | 'Zone C';
  utilization: number;
  travelDistance: number;
};

export type WarehouseOptimizationSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    slotUtilization: number;
    travelDistance: number;
    pickAccuracy: number;
  };
  locations: WarehouseLocation[];
};

export function getWarehouseOptimizationSummary(): WarehouseOptimizationSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      slotUtilization: 89.4,
      travelDistance: 210,
      pickAccuracy: 98.6
    },
    locations: [
      { zone: 'Zone A', utilization: 93, travelDistance: 180 },
      { zone: 'Zone B', utilization: 86, travelDistance: 220 },
      { zone: 'Zone C', utilization: 81, travelDistance: 240 }
    ]
  };
}

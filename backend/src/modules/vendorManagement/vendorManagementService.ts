export type Vendor = {
  name: string;
  health: 'healthy' | 'watch' | 'risk';
  score: number;
  onboarding: string;
};

export type VendorManagementSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    activeVendors: number;
    avgPerformance: number;
    dueReviews: number;
  };
  vendors: Vendor[];
};

export function getVendorManagementSummary(): VendorManagementSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      activeVendors: 42,
      avgPerformance: 88.5,
      dueReviews: 5
    },
    vendors: [
      { name: 'Northwind Supply', health: 'healthy', score: 92, onboarding: 'completed' },
      { name: 'Apex Logistics', health: 'watch', score: 82, onboarding: 'in-progress' },
      { name: 'BluePeak Services', health: 'healthy', score: 90, onboarding: 'completed' }
    ]
  };
}

export type PartnerStatus = 'healthy' | 'watch' | 'at-risk';

export type Partner = {
  name: string;
  status: PartnerStatus;
  access: 'full' | 'limited';
  performanceScore: number;
};

export type PartnerPortalSummary = {
  service: string;
  status: 'ready';
  metrics: {
    activePartners: number;
    healthRate: number;
    sharedOrders: number;
  };
  partners: Partner[];
};

export function getPartnerPortalSummary(): PartnerPortalSummary {
  return {
    service: 'erp-api',
    status: 'ready',
    metrics: {
      activePartners: 18,
      healthRate: 91.5,
      sharedOrders: 246
    },
    partners: [
      { name: 'Northwind', status: 'healthy', access: 'full', performanceScore: 94 },
      { name: 'BluePeak', status: 'watch', access: 'limited', performanceScore: 81 },
      { name: 'Crestline', status: 'healthy', access: 'full', performanceScore: 90 }
    ]
  };
}

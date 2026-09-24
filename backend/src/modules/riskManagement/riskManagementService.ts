export type RiskItem = {
  name: string;
  level: 'low' | 'medium' | 'high';
  exposure: number;
  mitigation: number;
};

export type RiskManagementSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    totalExposure: number;
    mitigationRate: number;
    criticalRisks: number;
  };
  risks: RiskItem[];
};

export function getRiskManagementSummary(): RiskManagementSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      totalExposure: 1840000,
      mitigationRate: 84.7,
      criticalRisks: 2
    },
    risks: [
      { name: 'Cybersecurity', level: 'high', exposure: 620000, mitigation: 87 },
      { name: 'Supplier concentration', level: 'medium', exposure: 410000, mitigation: 78 },
      { name: 'Operational dependency', level: 'low', exposure: 210000, mitigation: 92 }
    ]
  };
}

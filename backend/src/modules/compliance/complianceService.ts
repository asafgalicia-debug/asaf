export type ComplianceControl = {
  name: string;
  status: 'passed' | 'warning' | 'review';
  coverage: number;
};

export type ComplianceSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    policyCoverage: number;
    controlCount: number;
    remediationDue: number;
  };
  controls: ComplianceControl[];
};

export function getComplianceSummary(): ComplianceSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      policyCoverage: 96.2,
      controlCount: 18,
      remediationDue: 3
    },
    controls: [
      { name: 'Access review', status: 'passed', coverage: 100 },
      { name: 'Segregation of duties', status: 'warning', coverage: 88 },
      { name: 'Quarterly audit readiness', status: 'passed', coverage: 95 }
    ]
  };
}

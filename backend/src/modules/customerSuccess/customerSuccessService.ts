export type CustomerAccount = {
  name: string;
  stage: 'onboarding' | 'adopted' | 'expanding';
  health: 'healthy' | 'watch' | 'risk';
  nps: number;
};

export type CustomerSuccessSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    retentionRate: number;
    onboardingCompletion: number;
    atRiskAccounts: number;
  };
  accounts: CustomerAccount[];
};

export function getCustomerSuccessSummary(): CustomerSuccessSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      retentionRate: 93.1,
      onboardingCompletion: 87.6,
      atRiskAccounts: 2
    },
    accounts: [
      { name: 'Aster Labs', stage: 'adopted', health: 'healthy', nps: 74 },
      { name: 'Northwind Co', stage: 'expanding', health: 'healthy', nps: 82 },
      { name: 'Harbor One', stage: 'onboarding', health: 'watch', nps: 62 }
    ]
  };
}

export type BudgetDepartment = {
  name: string;
  planned: number;
  actual: number;
  variance: number;
};

export type BudgetPlanningSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    forecastVariance: number;
    burnRate: number;
    coverage: number;
  };
  departments: BudgetDepartment[];
};

export function getBudgetPlanningSummary(): BudgetPlanningSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      forecastVariance: 6.4,
      burnRate: 82.1,
      coverage: 96.7
    },
    departments: [
      { name: 'Operations', planned: 420000, actual: 395600, variance: -6.3 },
      { name: 'Sales', planned: 260000, actual: 272800, variance: 4.9 },
      { name: 'Support', planned: 180000, actual: 171300, variance: -4.8 }
    ]
  };
}

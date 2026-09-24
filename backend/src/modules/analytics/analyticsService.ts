export type AnalyticsTrend = {
  name: 'conversion' | 'retention' | 'traffic';
  value: number;
  period: string;
};

export type AnalyticsChannel = {
  name: string;
  sessions: number;
  conversionRate: number;
};

export type AnalyticsOverview = {
  service: string;
  status: 'active';
  channels: AnalyticsChannel[];
  trends: AnalyticsTrend[];
  kpis: {
    totalRevenue: number;
    conversionRate: number;
    activeCustomers: number;
  };
};

export function getAnalyticsOverview(): AnalyticsOverview {
  return {
    service: 'erp-api',
    status: 'active',
    channels: [
      { name: 'organic', sessions: 4200, conversionRate: 7.2 },
      { name: 'paid', sessions: 2100, conversionRate: 5.4 },
      { name: 'referral', sessions: 1300, conversionRate: 8.7 }
    ],
    trends: [
      { name: 'conversion', value: 9.8, period: '30d' },
      { name: 'retention', value: 88.5, period: '30d' },
      { name: 'traffic', value: 14.2, period: '30d' }
    ],
    kpis: {
      totalRevenue: 128400,
      conversionRate: 7.1,
      activeCustomers: 2230
    }
  };
}

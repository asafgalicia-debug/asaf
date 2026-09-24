import { describe, expect, it } from 'vitest';

import { getAnalyticsOverview } from '../src/modules/analytics/analyticsService.js';

describe('analytics domain', () => {
  it('should expose the ERP analytics overview and conversion trends', () => {
    const overview = getAnalyticsOverview();

    expect(overview.service).toBe('erp-api');
    expect(overview.status).toBe('active');
    expect(overview.channels.length).toBeGreaterThan(0);
    expect(overview.trends.some((trend) => trend.name === 'conversion')).toBe(true);
    expect(overview.kpis.totalRevenue).toBeGreaterThan(0);
  });
});

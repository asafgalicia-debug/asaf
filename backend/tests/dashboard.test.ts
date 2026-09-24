import { describe, expect, it } from 'vitest';

import { getDashboardSummary, listDashboardWidgets } from '../src/modules/dashboard/dashboardService.js';

describe('dashboard domain', () => {
  it('should return the company summary for the dashboard', () => {
    const summary = getDashboardSummary('company-demo-01');

    expect(summary.companyId).toBe('company-demo-01');
    expect(summary.metrics.sales).toBeGreaterThan(0);
  });

  it('should list dashboard widgets for the company', () => {
    const widgets = listDashboardWidgets('company-demo-01');

    expect(widgets.length).toBeGreaterThan(0);
    expect(widgets[0].name).toBe('ventas');
  });
});

import { describe, expect, it } from 'vitest';

import { getBusinessIntelligenceSummary } from '../src/modules/businessIntelligence/businessIntelligenceService.js';

describe('business intelligence domain', () => {
  it('should expose KPI trends, predictive signals, and strategic recommendations', () => {
    const summary = getBusinessIntelligenceSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('ready');
    expect(summary.kpis.length).toBeGreaterThan(0);
    expect(summary.recommendations.length).toBeGreaterThan(0);
    expect(summary.predictions.some((item) => item.name === 'revenue')).toBe(true);
  });
});

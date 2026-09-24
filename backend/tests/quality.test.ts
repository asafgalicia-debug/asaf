import { describe, expect, it } from 'vitest';

import { getQualitySummary } from '../src/modules/calidad/qualityService.js';

describe('quality domain', () => {
  it('should expose defect trends, inspection compliance, and first-pass yield', () => {
    const summary = getQualitySummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.firstPassYield).toBeGreaterThan(0);
    expect(summary.inspections.length).toBeGreaterThan(0);
    expect(summary.inspections.some((inspection) => inspection.line === 'Assembly A')).toBe(true);
  });
});

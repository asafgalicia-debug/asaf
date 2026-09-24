import { describe, expect, it } from 'vitest';

import { getComplianceSummary } from '../src/modules/compliance/complianceService.js';

describe('compliance domain', () => {
  it('should expose policy coverage, audit readiness, and control health', () => {
    const summary = getComplianceSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.policyCoverage).toBeGreaterThan(0);
    expect(summary.controls.length).toBeGreaterThan(0);
    expect(summary.controls.some((control) => control.name === 'Access review')).toBe(true);
  });
});

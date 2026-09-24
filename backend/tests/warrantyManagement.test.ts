import { describe, expect, it } from 'vitest';

import { getWarrantyManagementSummary } from '../src/modules/warrantyManagement/warrantyManagementService.js';

describe('warranty management domain', () => {
  it('should expose claims, coverage, and replacement rate metrics', () => {
    const summary = getWarrantyManagementSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.claimsRate).toBeGreaterThan(0);
    expect(summary.metrics.coverageRate).toBeGreaterThan(0);
    expect(summary.claims.length).toBeGreaterThan(0);
    expect(summary.claims.some((claim) => claim.asset === 'Luna Desk')).toBe(true);
  });
});

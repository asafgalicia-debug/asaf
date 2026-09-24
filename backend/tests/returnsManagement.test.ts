import { describe, expect, it } from 'vitest';

import { getReturnsManagementSummary } from '../src/modules/returnsManagement/returnsManagementService.js';

describe('returns management domain', () => {
  it('should expose return rate, recovery efficiency, and reverse logistics health', () => {
    const summary = getReturnsManagementSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.returnRate).toBeGreaterThan(0);
    expect(summary.metrics.recoveryRate).toBeGreaterThan(0);
    expect(summary.items.length).toBeGreaterThan(0);
    expect(summary.items.some((item) => item.reason === 'Damaged in transit')).toBe(true);
  });
});

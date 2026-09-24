import { describe, expect, it } from 'vitest';

import { getCustomerSuccessSummary } from '../src/modules/customerSuccess/customerSuccessService.js';

describe('customer success domain', () => {
  it('should expose retention, risk, and onboarding health for ERP customers', () => {
    const summary = getCustomerSuccessSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.accounts.length).toBeGreaterThan(0);
    expect(summary.metrics.retentionRate).toBeGreaterThan(0);
    expect(summary.accounts.some((account) => account.name === 'Aster Labs')).toBe(true);
  });
});

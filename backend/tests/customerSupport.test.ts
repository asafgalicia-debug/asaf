import { describe, expect, it } from 'vitest';

import { getCustomerSupportSummary } from '../src/modules/customerSupport/customerSupportService.js';

describe('customer support domain', () => {
  it('should expose ticket backlog, SLA compliance, and operational load for support teams', () => {
    const summary = getCustomerSupportSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.openTickets).toBeGreaterThan(0);
    expect(summary.supportTeams.length).toBeGreaterThan(0);
    expect(summary.supportTeams.some((team) => team.name === 'Tier 1')).toBe(true);
  });
});

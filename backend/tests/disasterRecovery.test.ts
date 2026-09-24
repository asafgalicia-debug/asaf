import { describe, expect, it } from 'vitest';

import { getDisasterRecoverySummary } from '../src/modules/disasterRecovery/disasterRecoveryService.js';

describe('disaster recovery domain', () => {
  it('should expose resilience posture, backup health, and recovery readiness', () => {
    const summary = getDisasterRecoverySummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.recoveryReadiness).toBeGreaterThan(0);
    expect(summary.plans.length).toBeGreaterThan(0);
    expect(summary.plans.some((plan) => plan.name === 'Core ERP')).toBe(true);
  });
});

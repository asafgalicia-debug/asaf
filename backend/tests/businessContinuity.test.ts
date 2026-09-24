import { describe, expect, it } from 'vitest';

import { getBusinessContinuitySummary } from '../src/modules/businessContinuity/businessContinuityService.js';

describe('business continuity domain', () => {
  it('should expose continuity posture, critical process coverage, and recovery confidence', () => {
    const summary = getBusinessContinuitySummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.coverage).toBeGreaterThan(0);
    expect(summary.processes.length).toBeGreaterThan(0);
    expect(summary.processes.some((process) => process.name === 'Finance')).toBe(true);
  });
});

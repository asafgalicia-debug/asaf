import { describe, expect, it } from 'vitest';

import { getAutomationSummary } from '../src/modules/automation/automationService.js';

describe('automation domain', () => {
  it('should expose ERP automation flows and expected execution status', () => {
    const summary = getAutomationSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('active');
    expect(summary.flows.length).toBeGreaterThan(0);
    expect(summary.flows.some((flow) => flow.id === 'approval')).toBe(true);
    expect(summary.metrics.executionsToday).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';

import { getRiskManagementSummary } from '../src/modules/riskManagement/riskManagementService.js';

describe('risk management domain', () => {
  it('should expose portfolio risk, mitigation health, and exposure concentration', () => {
    const summary = getRiskManagementSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.totalExposure).toBeGreaterThan(0);
    expect(summary.risks.length).toBeGreaterThan(0);
    expect(summary.risks.some((risk) => risk.name === 'Cybersecurity')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { getContractManagementSummary } from '../src/modules/contractManagement/contractManagementService.js';

describe('contract management domain', () => {
  it('should expose contract coverage, renewal risk, and compliance status', () => {
    const summary = getContractManagementSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.coverage).toBeGreaterThan(0);
    expect(summary.contracts.length).toBeGreaterThan(0);
    expect(summary.contracts.some((contract) => contract.vendor === 'Northwind Supply')).toBe(true);
  });
});

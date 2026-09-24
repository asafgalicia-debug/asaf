import { describe, expect, it } from 'vitest';

import { getVendorManagementSummary } from '../src/modules/vendorManagement/vendorManagementService.js';

describe('vendor management domain', () => {
  it('should expose vendor health, performance, and onboarding cadence', () => {
    const summary = getVendorManagementSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.activeVendors).toBeGreaterThan(0);
    expect(summary.vendors.length).toBeGreaterThan(0);
    expect(summary.vendors.some((vendor) => vendor.name === 'Northwind Supply')).toBe(true);
  });
});

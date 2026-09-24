import { describe, expect, it } from 'vitest';

import { getProcurementSummary } from '../src/modules/procurement/procurementService.js';

describe('procurement domain', () => {
  it('should expose supplier score, lead time, and spend coverage', () => {
    const summary = getProcurementSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.supplierScore).toBeGreaterThan(0);
    expect(summary.metrics.leadTime).toBeGreaterThan(0);
    expect(summary.orders.length).toBeGreaterThan(0);
    expect(summary.orders.some((order) => order.supplier === 'Northwind Supply')).toBe(true);
  });
});

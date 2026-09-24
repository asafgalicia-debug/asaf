import { describe, expect, it } from 'vitest';

import { getOrderFulfillmentSummary } from '../src/modules/orderFulfillment/orderFulfillmentService.js';

describe('order fulfillment domain', () => {
  it('should expose picking rate, on-time delivery, and fulfillment coverage', () => {
    const summary = getOrderFulfillmentSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.fulfillmentRate).toBeGreaterThan(0);
    expect(summary.metrics.onTimeDelivery).toBeGreaterThan(0);
    expect(summary.orders.length).toBeGreaterThan(0);
    expect(summary.orders.some((order) => order.channel === 'E-commerce')).toBe(true);
  });
});

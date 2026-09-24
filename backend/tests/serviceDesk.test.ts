import { describe, expect, it } from 'vitest';

import { getServiceDeskSummary } from '../src/modules/serviceDesk/serviceDeskService.js';

describe('service desk domain', () => {
  it('should expose queue health, active incidents, and response performance metrics', () => {
    const summary = getServiceDeskSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.activeIncidents).toBeGreaterThan(0);
    expect(summary.queues.length).toBeGreaterThan(0);
    expect(summary.queues.some((queue) => queue.name === 'Priority')).toBe(true);
  });
});

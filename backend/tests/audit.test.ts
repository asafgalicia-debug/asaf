import { describe, expect, it } from 'vitest';

import { createAuditEvent, listAuditEvents } from '../src/modules/auditoria/auditService.js';

describe('audit domain', () => {
  it('should list audit events for the company', () => {
    const events = listAuditEvents('company-demo-01');

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].module).toBe('ventas');
  });

  it('should create a valid audit event', () => {
    const event = createAuditEvent({
      companyId: 'company-demo-01',
      branchId: 'branch-demo-01',
      userId: 'user-demo-01',
      action: 'UPDATE',
      module: 'inventario',
      entityId: 'stock-001',
      previousState: { quantity: 10 },
      newState: { quantity: 12 },
      ipAddress: '127.0.0.1',
      details: { reason: 'Ajuste de inventario' }
    });

    expect(event.action).toBe('UPDATE');
    expect(event.module).toBe('inventario');
    expect(listAuditEvents('company-demo-01').length).toBeGreaterThan(1);
  });
});

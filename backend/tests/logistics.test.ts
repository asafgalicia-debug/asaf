import { describe, expect, it } from 'vitest';

import { createShipment, listShipments } from '../src/modules/logistica/shipmentService.js';

describe('logistics domain', () => {
  it('should list the demo shipment for the company', () => {
    const shipments = listShipments('company-demo-01');

    expect(shipments.length).toBeGreaterThan(0);
    expect(shipments[0].destination).toBe('Madrid');
  });

  it('should create a valid shipment', () => {
    const shipment = createShipment({
      companyId: 'company-demo-01',
      saleId: 'sale-demo-01',
      destination: 'Sevilla',
      status: 'PENDING',
      scheduledDate: '2026-10-01'
    });

    expect(shipment.destination).toBe('Sevilla');
    expect(shipment.status).toBe('PENDING');
    expect(listShipments('company-demo-01').length).toBeGreaterThan(1);
  });
});

import { AppError } from '../../errors/AppError.js';

export type ShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export type ShipmentRecord = {
  id: string;
  companyId: string;
  saleId: string;
  destination: string;
  status: ShipmentStatus;
  scheduledDate: string;
};

const shipments: Record<string, ShipmentRecord> = {
  'shipment-demo-01': {
    id: 'shipment-demo-01',
    companyId: 'company-demo-01',
    saleId: 'sale-demo-01',
    destination: 'Madrid',
    status: 'PENDING',
    scheduledDate: '2026-09-28'
  }
};

export function listShipments(companyId: string): ShipmentRecord[] {
  return Object.values(shipments).filter((shipment) => shipment.companyId === companyId);
}

export function createShipment(input: {
  companyId: string;
  saleId: string;
  destination: string;
  status: ShipmentStatus;
  scheduledDate: string;
}): ShipmentRecord {
  const companyId = input.companyId.trim();
  const saleId = input.saleId.trim();
  const destination = input.destination.trim();
  const scheduledDate = input.scheduledDate.trim();

  if (!companyId || !saleId || !destination || !scheduledDate) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Envío incompleto',
      friendlyMessage: 'Debe indicar venta, destino y fecha programada válidos.',
      statusCode: 400
    });
  }

  const shipment: ShipmentRecord = {
    id: `shipment-${Date.now()}`,
    companyId,
    saleId,
    destination,
    status: input.status,
    scheduledDate
  };

  shipments[shipment.id] = shipment;
  return shipment;
}

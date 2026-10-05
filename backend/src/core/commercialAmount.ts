import { AppError } from '../errors/AppError.js';
// Match persisted quantity precision and monetary totals consumed by cash settlement.
export function commercialTotal(quantity: number, unitAmount: number): number {
  const cents = Math.round(quantity * unitAmount * 100);
  if (!Number.isFinite(quantity) || quantity < 0.000001 || !Number.isFinite(unitAmount) || unitAmount < 0 || !Number.isSafeInteger(cents) || cents < 0) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid commercial amount', friendlyMessage: 'Revisa la cantidad y el importe: el total debe estar dentro del rango admitido.', statusCode: 400 });
  }
  const total = cents / 100;
  if (Math.round(total * 100) !== cents) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Commercial amount loses precision', friendlyMessage: 'El total es demasiado grande para conservar su precisión.', statusCode: 400 });
  return total;
}

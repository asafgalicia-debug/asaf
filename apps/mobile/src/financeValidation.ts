import { ApiError } from './api';
export function validateAccount(account: { name: string; bankName: string; iban: string }) {
  const payload = { name: account.name.trim(), bankName: account.bankName.trim(), iban: account.iban.replace(/\s+/g, '').toUpperCase() };
  if (payload.name.length < 2 || payload.name.length > 100 || payload.bankName.length < 2 || payload.bankName.length > 100 || payload.iban.length < 8 || payload.iban.length > 34) throw new ApiError('Revisa nombre y banco (2–100 caracteres) e identificador bancario (8–34).');
  return payload;
}
export function validateCashMovement(movement: { accountId: string; concept: string; type: string; amount: string; date: string }, accounts: { id: string; status: string }[]) {
  const amount = Number(movement.amount.trim()), concept = movement.concept.trim(), date = movement.date.trim();
  if (!accounts.some((row) => row.id === movement.accountId && row.status === 'ACTIVE') || !['INFLOW', 'OUTFLOW'].includes(movement.type) || concept.length < 2 || concept.length > 200 || !/^\d+(?:\.\d{1,2})?$/.test(movement.amount.trim()) || !Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100)) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw new ApiError('Selecciona una cuenta activa, concepto, importe positivo con dos decimales y fecha válida AAAA-MM-DD.');
  return { accountId: movement.accountId, concept, type: movement.type, amount, date };
}

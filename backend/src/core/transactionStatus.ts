export type TransactionStatus = 'PENDIENTE' | 'PAGADA' | 'APROBADA' | 'RECIBIDA' | 'CANCELADA';
export function allowedTransactionTransition(kind: 'sales' | 'purchase-orders', from: TransactionStatus, to: TransactionStatus): boolean {
  if (kind === 'sales') return from === 'PENDIENTE' && (to === 'PAGADA' || to === 'CANCELADA');
  return (from === 'PENDIENTE' && (to === 'APROBADA' || to === 'CANCELADA')) || (from === 'APROBADA' && (to === 'RECIBIDA' || to === 'CANCELADA'));
}

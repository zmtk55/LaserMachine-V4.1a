import { PaymentMethod, PaymentStatus } from '../types';

// Customer intent is not payment evidence. Only a separate, authorized
// confirmation may record money received.
export function createPendingPayment(method: PaymentMethod) {
  if (method !== PaymentMethod.CASH && method !== PaymentMethod.TRANSFER) {
    throw new Error('Elige pago en el taller o transferencia. No hay cobro en línea.');
  }
  return {
    paymentMethod: method,
    paymentStatus: PaymentStatus.PENDING,
    amountPaid: 0,
    pointsEarned: 0,
  } as const;
}

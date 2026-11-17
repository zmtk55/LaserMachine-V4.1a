import { describe, expect, it } from 'vitest';
import { createPendingPayment } from '../../utils/manualPayment';
import { PaymentMethod, PaymentStatus } from '../../types';

describe('manual order payment', () => {
  it.each([PaymentMethod.CASH, PaymentMethod.TRANSFER])('keeps %s unpaid until independently confirmed', method => {
    expect(createPendingPayment(method)).toEqual({
      paymentMethod: method,
      paymentStatus: PaymentStatus.PENDING,
      amountPaid: 0,
      pointsEarned: 0,
    });
  });
  it.each([PaymentMethod.CARD, PaymentMethod.MERCADOPAGO, PaymentMethod.OTHER])('rejects unsupported %s even if stale browser state selects it', method => {
    expect(() => createPendingPayment(method)).toThrow('No hay cobro en línea');
  });
});

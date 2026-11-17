import { DeliveryMethod, OrderItem, PaymentMethod } from '../types';
import { createPendingPayment } from '../utils/manualPayment';

export interface OrderRequest {
  // Create once per request and reuse on retries. Never use a sequence from localStorage.
  requestId: string;
  customer: { name: string; phone: string; email?: string };
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  deliveryMethod?: DeliveryMethod;
  notes?: string;
}
export interface OrderReceipt {
  requestId: string;
  orderId: string;
  receivedAt: string;
  // This is receipt of a request, not payment or production approval.
  paymentStatus: 'PENDIENTE';
  total?:number;
  reviewRequired?:boolean;
  totalConfirmed?:boolean;
}
export type SubmissionResult =
  | { state: 'received'; receipt: OrderReceipt }
  | { state: 'unconfirmed'; requestId: string; reason: 'network' | 'server' | 'invalid-receipt' };

export function prepareOrderRequest(input: OrderRequest): OrderRequest {
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(input.requestId)) throw new Error('Invalid request reference');
  if (!input.customer.name.trim() || !input.customer.phone.trim()) throw new Error('Missing customer contact');
  if (!input.items.length || input.items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 1)) {
    throw new Error('Invalid order quantities');
  }
  createPendingPayment(input.paymentMethod);
  // Keep design layers and logos, including front/back settings. Server must
  // validate assets, catalog, stock and compute prices, not trust client totals.
  return structuredClone(input);
}

/** Not wired to App until an authorized, real server implements this contract. */
export async function submitOrderRequest(
  endpoint: string,
  input: OrderRequest,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<SubmissionResult> {
  const payload = prepareOrderRequest(input);
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) {
    throw new Error('Order endpoint must use HTTPS');
  }
  if (url.username || url.password) throw new Error('Credentials must not be embedded in the endpoint');
  let response: Response;
  try {
    response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.requestId },
      body: JSON.stringify(payload), signal,
      credentials: 'same-origin',
      redirect: 'error',
    });
  } catch {
    return { state: 'unconfirmed', requestId: payload.requestId, reason: 'network' };
  }
  if (!response.ok) return { state: 'unconfirmed', requestId: payload.requestId, reason: 'server' };
  try {
    const receipt: unknown = await response.json();
    if (!receipt || typeof receipt !== 'object') throw new Error('Missing receipt');
    const r = receipt as Record<string, unknown>;
    if (r.requestId !== payload.requestId || typeof r.orderId !== 'string' || !r.orderId.trim() ||
        typeof r.receivedAt !== 'string' || !Number.isFinite(Date.parse(r.receivedAt)) ||
        r.paymentStatus !== 'PENDIENTE') throw new Error('Receipt does not match request');
    return { state: 'received', receipt: {
      requestId: payload.requestId, orderId: r.orderId,
      receivedAt: r.receivedAt, paymentStatus: 'PENDIENTE',
    } };
  } catch {
    return { state: 'unconfirmed', requestId: payload.requestId, reason: 'invalid-receipt' };
  }
}

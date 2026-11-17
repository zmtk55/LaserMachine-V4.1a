import { describe, it, expect, vi } from 'vitest';
import { prepareOrderRequest, submitOrderRequest, type OrderRequest } from '../../services/orderSubmission';
import { PaymentMethod, type OrderItem } from '../../types';
const request: OrderRequest = {
  requestId: 'test-reference-0001', customer: { name: 'TEST', phone: '0000000000' },
  paymentMethod: PaymentMethod.TRANSFER,
  items: [{ productId: 'fixture', quantity: 2, frontText: 'TEST', backText: 'BACK', frontLogos: [{id: 'fixture-logo'}] } as OrderItem],
};
const receipt = { requestId: request.requestId, orderId: 'test-order', receivedAt: '2026-11-06T18:00:00Z', paymentStatus: 'PENDIENTE' };
const endpoint = 'https://orders.example.invalid/requests'; // fixture only; never contacted
const reply = (body: unknown, status=200) => vi.fn(async () => new Response(JSON.stringify(body), {status})) as unknown as typeof fetch;

describe('order request transport contract (no backend)', () => {
 it('requires a valid request reference', () => expect(()=>prepareOrderRequest({...request, requestId:'1'})).toThrow());
 it('requires customer contact', () => expect(()=>prepareOrderRequest({...request,customer:{name:' ',phone:''}})).toThrow());
 it('requires items', () => expect(()=>prepareOrderRequest({...request,items:[]})).toThrow());
 it('rejects fractional quantities', () => expect(()=>prepareOrderRequest({...request,items:[{...request.items[0],quantity:1.5}]})).toThrow());
 it('rejects unsupported payments', () => expect(()=>prepareOrderRequest({...request,paymentMethod:PaymentMethod.MERCADOPAGO})).toThrow());
 it('preserves design data in an independent snapshot', () => {
   const snapshot=prepareOrderRequest(request);expect(snapshot.items).toEqual(request.items);expect(snapshot.items[0]).not.toBe(request.items[0]);
 });
 it('acknowledges only a matching receipt', async()=>expect(await submitOrderRequest(endpoint,request,reply(receipt))).toEqual({state:'received',receipt}));
 it.each([{...receipt,requestId:'someone-else'},{...receipt,paymentStatus:'PAGADO'},{...receipt,orderId:''},{...receipt,receivedAt:'invalid'},{}])('rejects invalid receipt %j', async body=>{
   expect((await submitOrderRequest(endpoint,request,reply(body))).state).toBe('unconfirmed');
 });
 it('does not call a failed server received', async()=>expect(await submitOrderRequest(endpoint,request,reply({},503))).toMatchObject({state:'unconfirmed',reason:'server'}));
 it('treats network failure as unknown, not definitely absent', async()=>{
   const fetcher=vi.fn(async()=>{throw new Error('offline')}) as unknown as typeof fetch;
   expect(await submitOrderRequest(endpoint,request,fetcher)).toMatchObject({state:'unconfirmed',reason:'network',requestId:request.requestId});
 });
 it('retries with the same key and body, without claiming exactly-once server behavior', async()=>{
   const fetcher=reply(receipt);await submitOrderRequest(endpoint,request,fetcher);await submitOrderRequest(endpoint,request,fetcher);
   const calls=vi.mocked(fetcher).mock.calls;expect(calls[0][1]).toEqual(calls[1][1]);expect(calls[0][1]?.headers).toMatchObject({'Idempotency-Key':request.requestId});
 });
 it('refuses insecure remote endpoints before sending',async()=>{
   const fetcher=reply(receipt);await expect(submitOrderRequest('http://orders.example.invalid/',request,fetcher)).rejects.toThrow('HTTPS');expect(fetcher).not.toHaveBeenCalled();
 });
});

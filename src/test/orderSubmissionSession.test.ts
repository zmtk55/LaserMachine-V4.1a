import {describe,it,expect,vi} from 'vitest';
import {createOrderSubmissionSession} from '../../services/orderSubmissionSession';
import {type OrderRequest,type SubmissionResult} from '../../services/orderSubmission';
import {PaymentMethod,type OrderItem} from '../../types';
const input=():OrderRequest=>({requestId:'checkout-fixture-001',customer:{name:'Fixture',phone:'0000000000'},paymentMethod:PaymentMethod.CASH,items:[{productId:'p',quantity:1,frontText:'FRENTE',backText:'DORSO',frontLogos:[],backLogos:[]} as unknown as OrderItem]});
const received:SubmissionResult={state:'received',receipt:{requestId:'checkout-fixture-001',orderId:'server-1',receivedAt:'2026-11-06T19:00:00Z',paymentStatus:'PENDIENTE'}};
describe('checkout session (local contract, not live persistence)',()=>{
 it('coalesces concurrent clicks into one transport call',async()=>{
  let done!:(x:SubmissionResult)=>void;const send=vi.fn(()=>new Promise<SubmissionResult>(r=>done=r));const s=createOrderSubmissionSession(input(),send);const a=s.submit(),b=s.submit();expect(send).toHaveBeenCalledTimes(1);done(received);expect(await a).toEqual(await b);
 });
 it('keeps the same snapshot and id for retry after ambiguous failure',async()=>{
  const source=input();const send=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce(received);const s=createOrderSubmissionSession(source,send);source.items[0].quantity=99;expect((await s.submit()).state).toBe('unconfirmed');await s.submit();expect(send.mock.calls[0][0]).toEqual(send.mock.calls[1][0]);expect(send.mock.calls[1][0].items[0].quantity).toBe(1);
 });
 it('does not send again after matching server acknowledgement',async()=>{
  const send=vi.fn(async()=>received);const s=createOrderSubmissionSession(input(),send);await s.submit();await s.submit();expect(send).toHaveBeenCalledTimes(1);
 });
 it('rejects a receipt for another request',async()=>{
  const s=createOrderSubmissionSession(input(),async()=>({...received,receipt:{...received.receipt,requestId:'another-checkout-01'}}));expect(await s.submit()).toMatchObject({state:'unconfirmed',reason:'invalid-receipt'});
 });
 it('returns independent request snapshots including front and back design',()=>{
  const s=createOrderSubmissionSession(input(),async()=>received);s.getRequest().items[0].backText='CHANGED';expect(s.getRequest().items[0].backText).toBe('DORSO');
 });
 it('does not mutate the cart on receipt or failure',async()=>{
  const source=input(),before=structuredClone(source);const s=createOrderSubmissionSession(source,async()=>received);await s.submit();expect(source).toEqual(before);
 });
});

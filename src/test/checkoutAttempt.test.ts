import {describe,it,expect} from 'vitest';
import {checkoutFingerprint,checkoutAttemptMatches,canClearCheckoutCart,type CheckoutAttempt} from '../../services/checkoutAttempt';
import {PaymentMethod,type OrderItem} from '../../types';
import type {CheckoutRequest} from '../../services/supabaseCheckout';
const input:CheckoutRequest={requestId:'fixture-request-0001',customer:{name:'test',phone:'000'},items:[{id:'1',quantity:1,frontText:'original'} as OrderItem],expectedTotal:100,paymentMethod:PaymentMethod.CASH};
const attempt:CheckoutAttempt={ownerId:'client-1',fingerprint:checkoutFingerprint(input),input,cache:new Map()};
describe('checkout retry cart ownership',()=>{
 it('keeps request reference outside intent fingerprint',()=>expect(checkoutFingerprint({...input,requestId:'different-reference'})).toBe(attempt.fingerprint));
 it('only reuses a matching visible request for same owner',()=>expect(checkoutAttemptMatches(attempt,'client-1',input)).toBe(true));
 it('detects changed engraving',()=>expect(checkoutAttemptMatches(attempt,'client-1',{...input,items:[{...input.items[0],frontText:'new'}]})).toBe(false));
 it('detects changed customer or price',()=>{expect(checkoutAttemptMatches(attempt,'client-1',{...input,customer:{...input.customer,phone:'other'}})).toBe(false);expect(checkoutAttemptMatches(attempt,'client-1',{...input,expectedTotal:200})).toBe(false);});
 it('does not reuse across accounts',()=>expect(checkoutAttemptMatches(attempt,'other',input)).toBe(false));
 it('only clears an unchanged current cart after matching receipt',()=>expect(canClearCheckoutCart(attempt,{ownerId:'client-1',fingerprint:attempt.fingerprint})).toBe(true));
 it('preserves edits made during an ambiguous/in-flight request',()=>expect(canClearCheckoutCart(attempt,{ownerId:'client-1',fingerprint:checkoutFingerprint({...input,notes:'changed'})})).toBe(false));
 it('never clears a new account cart or signed-out view',()=>{expect(canClearCheckoutCart(attempt,{ownerId:'other',fingerprint:attempt.fingerprint})).toBe(false);expect(canClearCheckoutCart(attempt,null)).toBe(false);});
});

import {persistCheckoutAttempt,restoreCheckoutAttempt,clearPersistedCheckoutAttempt} from '../../services/checkoutAttempt';
describe('durable checkout attempt across close/crash',()=>{
 it('restores a prepared attempt with the same reference and owner after reopen',()=>{
  const prepared={...input,items:[{...input.items[0],customBackgroundImage:undefined,backgroundAssetId:'asset-1'}]} as CheckoutRequest;
  const a:CheckoutAttempt={ownerId:'client-1',fingerprint:checkoutFingerprint(input),input,cache:new Map(),prepared};
  persistCheckoutAttempt(a);
  const r=restoreCheckoutAttempt();
  expect(r?.prepared?.requestId).toBe('fixture-request-0001');
  expect(r?.ownerId).toBe('client-1');
  expect(r?.fingerprint).toBe(a.fingerprint);
  expect((r?.prepared?.items[0] as {backgroundAssetId?:string}).backgroundAssetId).toBe('asset-1');
  clearPersistedCheckoutAttempt();
  expect(restoreCheckoutAttempt()).toBe(null);
 });
 it('a restored attempt still matches only the same owner and unchanged intent',()=>{
  const prepared={...input} as CheckoutRequest;
  persistCheckoutAttempt({ownerId:'client-1',fingerprint:checkoutFingerprint(input),input,cache:new Map(),prepared});
  const r=restoreCheckoutAttempt()!;
  expect(checkoutAttemptMatches(r,'client-1',input)).toBe(true);
  expect(checkoutAttemptMatches(r,'other-user',input)).toBe(false);
  expect(checkoutAttemptMatches(r,'client-1',{...input,expectedTotal:999})).toBe(false);
  clearPersistedCheckoutAttempt();
 });
 it('persists nothing before assets are prepared (no half reference)',()=>{
  persistCheckoutAttempt({ownerId:'client-1',fingerprint:checkoutFingerprint(input),input,cache:new Map()});
  expect(restoreCheckoutAttempt()).toBe(null);
 });
 it('ignores corrupt or foreign stored payloads',()=>{
  localStorage.setItem('lm_checkout_attempt_v1','{not json');
  expect(restoreCheckoutAttempt()).toBe(null);
  localStorage.setItem('lm_checkout_attempt_v1',JSON.stringify({ownerId:42,fingerprint:null,prepared:{}}));
  expect(restoreCheckoutAttempt()).toBe(null);
  clearPersistedCheckoutAttempt();
 });
});

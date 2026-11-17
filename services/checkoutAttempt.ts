import type {CheckoutRequest} from './supabaseCheckout';
export interface CheckoutAttempt {ownerId:string; fingerprint:string; input:CheckoutRequest;cache:Map<string,string>;prepared?:CheckoutRequest}
/** Only requestId differs on retry. Exact visible intent is retained separately from uploaded assets. */
export function checkoutFingerprint(input:CheckoutRequest):string {const {requestId,...intent}=input;return JSON.stringify(intent);}
export function checkoutAttemptMatches(attempt:CheckoutAttempt,ownerId:string,input:CheckoutRequest):boolean{return attempt.ownerId===ownerId&&attempt.fingerprint===checkoutFingerprint(input);}
export function canClearCheckoutCart(attempt:CheckoutAttempt,current:{ownerId:string;fingerprint:string}|null):boolean{return current?.ownerId===attempt.ownerId&&current.fingerprint===attempt.fingerprint;}

const ATTEMPT_KEY='lm_checkout_attempt_v1';
/** Durable copy of a prepared attempt so a browser close/crash mid-checkout can be
 * retried with the same requestId instead of creating a duplicate order. */
export function persistCheckoutAttempt(attempt:CheckoutAttempt):void {
 if(!attempt.prepared)return;
 try{localStorage.setItem(ATTEMPT_KEY,JSON.stringify({ownerId:attempt.ownerId,fingerprint:attempt.fingerprint,prepared:attempt.prepared}));}catch{}
}
export function restoreCheckoutAttempt():CheckoutAttempt|null {
 try{
  const raw=localStorage.getItem(ATTEMPT_KEY);if(!raw)return null;
  const d=JSON.parse(raw);
  if(!d||typeof d.ownerId!=='string'||typeof d.fingerprint!=='string'||!d.prepared||typeof d.prepared.requestId!=='string')return null;
  return {ownerId:d.ownerId,fingerprint:d.fingerprint,input:d.prepared,cache:new Map(),prepared:d.prepared};
 }catch{return null;}
}
export function clearPersistedCheckoutAttempt():void {
 try{localStorage.removeItem(ATTEMPT_KEY);}catch{}
}

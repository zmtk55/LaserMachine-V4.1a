import {supabase} from './supabaseClient';
import {prepareOrderRequest,OrderRequest,SubmissionResult} from './orderSubmission';
export interface CheckoutRequest extends OrderRequest {expectedTotal:number;couponCode?:string;pointsRedeemed?:number}
/** Prepared adapter, deliberately not connected to App until remote RPC and UI validation. */
export async function submitSupabaseCheckout(request:CheckoutRequest):Promise<SubmissionResult>{
 const payload=prepareOrderRequest(request) as CheckoutRequest;
 if(!Number.isFinite(payload.expectedTotal)||payload.expectedTotal<0)throw Error('Revisa el total');
 if(!supabase)throw Error('Supabase no está configurado');
 let data:any,error:any;
 try{({data,error}=await supabase.rpc('lm_submit_order',{payload}));}catch{return {state:'unconfirmed',requestId:payload.requestId,reason:'network'};}
 if(error)return {state:'unconfirmed',requestId:payload.requestId,reason:'server'};
 if(!data||data.requestId!==payload.requestId||typeof data.orderId!=='string'||!data.orderId||data.paymentStatus!=='PENDIENTE'||(!data.reviewRequired&&data.total!==payload.expectedTotal)||!Number.isFinite(Date.parse(data.receivedAt)))return {state:'unconfirmed',requestId:payload.requestId,reason:'invalid-receipt'};
 return {state:'received',receipt:{requestId:data.requestId,orderId:data.orderId,receivedAt:data.receivedAt,paymentStatus:'PENDIENTE',total:data.total,reviewRequired:data.reviewRequired===true,totalConfirmed:data.totalConfirmed!==false}};
}

import {prepareOrderRequest, type OrderRequest, type SubmissionResult} from './orderSubmission';

export type OrderSender = (request:OrderRequest)=>Promise<SubmissionResult>;
/** One checkout attempt. Keep until confirmed or explicitly discarded.
 * Does not clear cart, reserve stock, redeem coupons/points or infer admin rights.
 * Network ambiguity retains the exact request reference and snapshot for retry.
 * Backend must enforce idempotency and server-side pricing/permissions.
 */
export function createOrderSubmissionSession(input:OrderRequest, send:OrderSender) {
  const snapshot=prepareOrderRequest(input);
  let inFlight:Promise<SubmissionResult>|null=null;
  let received:SubmissionResult|null=null;
  return {
    getRequest:()=>structuredClone(snapshot),
    submit():Promise<SubmissionResult> {
      if(received)return Promise.resolve(structuredClone(received));
      if(inFlight)return inFlight;
      inFlight=(async()=>{
        let result:SubmissionResult;
        try{result=await send(structuredClone(snapshot));}
        catch{result={state:'unconfirmed',requestId:snapshot.requestId,reason:'network'};}
        // Defense in depth: an adapter must not acknowledge another checkout.
        if(result.state==='received'&&result.receipt.requestId!==snapshot.requestId)
          result={state:'unconfirmed',requestId:snapshot.requestId,reason:'invalid-receipt'};
        if(result.state==='received')received=structuredClone(result);
        return structuredClone(result);
      })().finally(()=>{inFlight=null;});
      return inFlight;
    },
  };
}

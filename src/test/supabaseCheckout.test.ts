import {describe,it,expect,vi} from 'vitest';
const rpc=vi.hoisted(()=>vi.fn());vi.mock('../../services/supabaseClient',()=>({supabase:{rpc}}));
import {submitSupabaseCheckout} from '../../services/supabaseCheckout';
const request:any={requestId:'checkout_test_00001',customer:{name:'Test',phone:'000'},items:[{quantity:1}],paymentMethod:'EFECTIVO',expectedTotal:100};
describe('checkout RPC adapter preparation',()=>{
 it('acknowledges matching unpaid server receipt only',async()=>{rpc.mockResolvedValue({data:{requestId:request.requestId,orderId:'LM-1',receivedAt:'2026-11-06T20:00:00Z',paymentStatus:'PENDIENTE',total:100},error:null});expect((await submitSupabaseCheckout(request)).state).toBe('received');expect(rpc).toHaveBeenCalledWith('lm_submit_order',{payload:request});});
 it('retains request identity after network ambiguity',async()=>{rpc.mockRejectedValue(Error('network'));expect(await submitSupabaseCheckout(request)).toEqual({state:'unconfirmed',requestId:request.requestId,reason:'network'});});
 it('does not acknowledge server error',async()=>{rpc.mockResolvedValue({data:null,error:Error('invalid')});expect((await submitSupabaseCheckout(request)).state).toBe('unconfirmed');});
 it.each([{paymentStatus:'PAGADO',total:100},{paymentStatus:'PENDIENTE',total:101}])('rejects mismatched payment or total',async extra=>{rpc.mockResolvedValue({data:{requestId:request.requestId,orderId:'LM-1',receivedAt:'2026-11-06T20:00:00Z',...extra},error:null});expect((await submitSupabaseCheckout(request)).state).toBe('unconfirmed');});
});

it('acknowledges review receipt without treating estimated total as confirmed',async()=>{rpc.mockResolvedValue({data:{requestId:request.requestId,orderId:'LM-review',receivedAt:'2026-11-06T20:00:00Z',paymentStatus:'PENDIENTE',total:500,reviewRequired:true,totalConfirmed:false},error:null});const result=await submitSupabaseCheckout(request);expect(result.state).toBe('received');if(result.state==='received')expect(result.receipt).toMatchObject({reviewRequired:true,totalConfirmed:false,total:500});});

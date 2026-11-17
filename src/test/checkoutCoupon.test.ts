import{describe,it,expect}from'vitest';import{checkoutCouponError}from'../../utils/couponValidation';import type{Coupon}from'../../types';
const base={code:'PERSONAL',active:true,discountPercent:10,maxUses:-1,usedCount:0,assignedToPhone:'6371111111'}as Coupon;
describe('checkout coupon eligibility',()=>{
 it('requires a phone before accepting a personal coupon',()=>expect(checkoutCouponError(base,'  ')).toContain('Ingresa tu teléfono'));
 it('rejects another phone without revealing the intended recipient',()=>{const error=checkoutCouponError(base,'6372222222');expect(error).toContain('no corresponde');expect(error).not.toContain('6371111111');});
 it('accepts the assigned phone and surrounding whitespace',()=>expect(checkoutCouponError(base,' 6371111111 ')).toBe(''));
 it('allows non-personal coupons without a phone',()=>expect(checkoutCouponError({...base,assignedToPhone:undefined},'')).toBe(''));
 it('treats a zero-use limit as exhausted',()=>expect(checkoutCouponError({...base,maxUses:0},base.assignedToPhone!)).toContain('límite'));
 it('rejects inactive and expired coupons',()=>{expect(checkoutCouponError({...base,active:false},base.assignedToPhone!)).toContain('activo');expect(checkoutCouponError({...base,expiryDate:'2020-01-01'},base.assignedToPhone!)).toContain('expirado');});
 it.each([0,101,NaN])('rejects invalid discount %s',discountPercent=>expect(checkoutCouponError({...base,discountPercent},base.assignedToPhone!)).toContain('no válido'));
});

import type {Coupon} from '../types';
/** Shared rules for both coupon entry points. No writes or new discount policy. */
export function couponIdentityError(code:string,discount:number,coupons:Pick<Coupon,'code'>[]):string{
 const normalized=code.trim().toUpperCase();
 if(!normalized)return 'Escribe un código.';
 if(coupons.some(c=>c.code.trim().toUpperCase()===normalized))return 'Ya existe un cupón con ese código.';
 if(!Number.isFinite(discount)||discount<1||discount>100)return 'El descuento debe estar entre 1 y 100%.';
 return '';
}

/** Checkout checks are separate from the server's final eligibility decision. */
export function checkoutCouponError(coupon:Coupon|undefined,phone:string,now=Date.now()):string{
 if(!coupon)return 'Cupón no válido.';
 if(!coupon.active)return 'Este cupón ya no está activo.';
 if(coupon.expiryDate&&(!Number.isFinite(Date.parse(coupon.expiryDate))||Date.parse(coupon.expiryDate)<now))return 'Este cupón ha expirado.';
 if(!Number.isFinite(coupon.discountPercent)||coupon.discountPercent<1||coupon.discountPercent>100)return 'Cupón no válido.';
 if(coupon.maxUses!==-1&&(coupon.usedCount||0)>=(coupon.maxUses??1))return 'Este cupón ha alcanzado su límite de usos.';
 if(coupon.assignedToPhone){
  if(!phone.trim())return 'Ingresa tu teléfono para validar este cupón personal.';
  if(coupon.assignedToPhone.trim()!==phone.trim())return 'Este cupón no corresponde al teléfono del pedido.';
 }
 return '';
}

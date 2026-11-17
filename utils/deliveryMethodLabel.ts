import {DeliveryMethod} from '../types';
/** Display only. Never changes the saved delivery method or guesses an unknown one. */
export function deliveryMethodLabel(method:unknown):string{
 switch(method){
  case DeliveryMethod.PICKUP:return 'Recolección en tienda';
  case DeliveryMethod.SHIPPING:return 'Envío a domicilio';
  case DeliveryMethod.LOCAL_DELIVERY:return 'Entrega local';
  default:return 'Modalidad por confirmar';
 }
}

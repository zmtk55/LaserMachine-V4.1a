import type{OrderItem}from'../types';
/** Opening an editor never removes the original. Commit replaces it in place. */
export function commitCartItem(cart:OrderItem[],item:OrderItem,editingId?:string):OrderItem[]{
 if(editingId&&cart.some(row=>row.id===editingId))return cart.map(row=>row.id===editingId?{...item,id:editingId}:row);
 return [...cart,item];
}

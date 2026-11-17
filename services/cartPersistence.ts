import type {OrderItem} from '../types';
export const CART_KEY='lm_cart_v1';
const restoreError='No se pudo recuperar el carrito guardado. La copia anterior se conserva en este navegador.';
const saveError='No se pudo guardar el carrito en este navegador. No cierres ni recargues esta página: podrías recuperar una versión anterior.';
export type CartStore=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const state=(x:any)=>x&&['x','y','scale','rotate'].every(k=>typeof x[k]==='number'&&Number.isFinite(x[k]));
const logos=(x:any)=>Array.isArray(x)&&x.every(l=>l&&typeof l.id==='string'&&typeof l.url==='string'&&state(l.state));
function validItem(x:any):x is OrderItem{return x&&typeof x.id==='string'&&typeof x.productId==='string'&&typeof x.colorName==='string'&&typeof x.frontText==='string'&&typeof x.backText==='string'&&Number.isInteger(x.quantity)&&x.quantity>0&&['unitPrice','totalPrice','frontFontId','backFontId'].every(k=>typeof x[k]==='number'&&Number.isFinite(x[k]))&&state(x.frontDesignState)&&state(x.backDesignState)&&logos(x.frontLogos)&&logos(x.backLogos);}
export function readCart(store:CartStore):{items:OrderItem[];error:string}{
 try{const raw=store.getItem(CART_KEY);if(!raw)return {items:[],error:''};const parsed=JSON.parse(raw);const items=Array.isArray(parsed)?parsed:parsed?.version===1?parsed.items:null;
 if(!Array.isArray(items)||!items.every(validItem)||new Set(items.map(x=>x.id)).size!==items.length)throw Error('Invalid cart');
 return {items,error:''};}catch{return {items:[],error:restoreError};}
}
/** A local cart is not a server order or a confirmed price. Never writes customer/contact/auth data. */
export function writeCart(store:CartStore,items:OrderItem[]):string{
 try{
  if(!items.length){store.removeItem(CART_KEY);return '';}
  if(!items.every(validItem))throw Error('Invalid cart');
  // Object URLs do not survive a browser restart. Do not claim they were saved.
  for(const item of items){const images=[item.customBackgroundImage,...[...item.frontLogos,...item.backLogos].flatMap(l=>[l.url,l.originalUrl])];if(images.some(url=>url?.startsWith('blob:')))throw Error('Temporary image');}
  store.setItem(CART_KEY,JSON.stringify({version:1,items}));return '';
 }catch{return saveError;}
}

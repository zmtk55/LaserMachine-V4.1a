import {useEffect,useRef,useState} from 'react';
import type {OrderItem} from '../types';
import {readCart,writeCart} from './cartPersistence';
export function usePersistentCart(){
 const [initial]=useState(()=>{try{return readCart(localStorage);}catch{return {items:[] as OrderItem[],error:'El almacenamiento de este navegador no está disponible. El carrito se conserva sólo mientras esta página siga abierta.'};}});
 const [cart,setCart]=useState<OrderItem[]>(initial.items);
 const [cartStorageError,setCartStorageError]=useState(initial.error);
 const initialItems=useRef(initial.items);
 useEffect(()=>{
  // Never overwrite an unreadable copy merely by opening the site.
  if(cart===initialItems.current)return;
  let error:string;try{error=writeCart(localStorage,cart);}catch{error='No se pudo guardar el carrito en este navegador. No cierres ni recargues esta página.';}
  setCartStorageError(error);
 },[cart]);
 useEffect(()=>{if(!cartStorageError)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[cartStorageError]);
 return {cart,setCart,cartStorageError};
}

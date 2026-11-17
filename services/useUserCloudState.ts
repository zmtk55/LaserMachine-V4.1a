import {useState,useEffect,useRef,useCallback,Dispatch,SetStateAction} from 'react';
import {supabase} from './supabaseClient';
type Kind='favorites'|'notifications'|'order_history';
/** Owner-scoped state. Loading never triggers a save, including failed loads. */
export function useUserCloudState<T>(kind:Kind,empty:T):[T,Dispatch<SetStateAction<T>>,string]{
 const [value,setValue]=useState(empty),[status,setStatus]=useState('Sin sesión');
 const state=useRef({userId:'',revision:0,ready:false,busy:false,pending:undefined as T|undefined,generation:0});
 const current=useRef(value);current.current=value;
 useEffect(()=>{
  if(!supabase)return;let active=true;
  const load=async()=>{
   const c=state.current;const generation=++c.generation;c.ready=false;c.userId='';c.pending=undefined;setValue(empty);
   const {data:{session}}=await supabase.auth.getSession();if(!active||generation!==c.generation)return;
   if(!session){setStatus('Sin sesión');return;}const id=session.user.id;
   const {data,error}=await supabase.from('lm_user_data').select('revision,data').eq('user_id',id).eq('kind',kind).maybeSingle();
   if(!active||generation!==c.generation)return;
   if(error){setStatus('No se pudo cargar');return;}c.userId=id;c.revision=data?.revision??0;c.ready=true;setValue(data?.data??empty);setStatus('Cargado de Supabase');
  };
  load();const {data}=supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(event==='SIGNED_IN'&&session?.user.id!==state.current.userId))setTimeout(load,0);});
  return()=>{active=false;state.current.generation++;data.subscription.unsubscribe();};
 },[kind]);
 const flush=useCallback(async()=>{
  const c=state.current;if(!supabase||!c.ready||c.busy||c.pending===undefined)return;
  c.busy=true;const next=c.pending;c.pending=undefined;const generation=c.generation,id=c.userId,revision=c.revision;setStatus('Guardando');
  try{
   const query=revision===0?supabase.from('lm_user_data').insert({user_id:id,kind,revision:1,data:next}):supabase.from('lm_user_data').update({revision:revision+1,data:next}).eq('user_id',id).eq('kind',kind).eq('revision',revision);
   const {data,error}=await query.select('revision').single();
   if(generation!==c.generation)return;if(error||!data)throw Error('Sin confirmación');c.revision=data.revision;setStatus('Guardado en Supabase');
  }catch{if(generation===c.generation){c.ready=false;setStatus('No guardado. Recarga antes de reintentar.');}}
  finally{c.busy=false;if(c.pending!==undefined&&c.ready)queueMicrotask(flush);}
 },[kind]);
 const update=useCallback<Dispatch<SetStateAction<T>>>((change)=>{
  const c=state.current;if(!c.ready){setStatus('Espera la carga de tu sesión');return;}
  const next=typeof change==='function'?(change as (v:T)=>T)(current.current):change;
  current.current=next;setValue(next);c.pending=next;void flush();
 },[flush]);
 return [value,update,status];
}

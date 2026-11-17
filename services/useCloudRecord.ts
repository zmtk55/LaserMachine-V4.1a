import {useState,useEffect,useRef} from 'react';
import {businessStore} from './businessPersistence';
import {BusinessTable,RevisionedRecord} from './supabaseRecordStore';
/** Private single-record editor. Never writes on mount or after a failed load. */
export function useCloudRecord<T extends object>(table:BusinessTable,id:string,empty:T){
 const [value,setValue]=useState<T>(empty),[ready,setReady]=useState(false),[saving,setSaving]=useState(false),[status,setStatus]=useState('Cargando datos…');
 const [loadAttempt,setLoadAttempt]=useState(0);
 const [baseline,setBaseline]=useState(JSON.stringify(empty));
 const receipt=useRef<RevisionedRecord<T>|null>(null),busy=useRef(false),latest=useRef(value);latest.current=value;
 const dirty=ready&&JSON.stringify(value)!==baseline;
 useEffect(()=>{let active=true;setReady(false);setStatus('Cargando datos…');Promise.resolve().then(()=>businessStore().read<T>(table,id)).then(row=>{if(!active)return;receipt.current=row;const next=row?.data??empty;setValue(next);latest.current=next;setBaseline(JSON.stringify(next));setReady(true);setStatus('Cambios guardados');}).catch(()=>{if(active)setStatus('No se pudo cargar. Guardado bloqueado.');});return()=>{active=false;};},[table,id,loadAttempt]);
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 async function save(next:T=latest.current){
  if(!ready||busy.current)throw Error('Espera la carga o el guardado en curso');
  busy.current=true;setSaving(true);setStatus('Guardando cambios…');const snapshot=JSON.stringify(next),atStart=JSON.stringify(latest.current);
  try{const row=await businessStore().save(table,{id,revision:receipt.current?.revision??0,data:{...(receipt.current?.data??{}),...next}});receipt.current=row;setBaseline(JSON.stringify(row.data));if(JSON.stringify(latest.current)===atStart||JSON.stringify(latest.current)===snapshot){setValue(row.data);latest.current=row.data;}setStatus('Cambios guardados');return row;}
  catch(e){setStatus('No guardado. Cambios conservados.');throw e;}finally{busy.current=false;setSaving(false);}
 }
 return {value,setValue,ready,status,save,dirty,saving,reload:()=>setLoadAttempt(n=>n+1)};
}

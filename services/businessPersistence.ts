import {supabase} from './supabaseClient';
import {createSupabaseRecordStore,BusinessTable,RevisionedRecord} from './supabaseRecordStore';
export const businessStore=()=>{
 if(!supabase)throw Error('Supabase no está configurado');
 return createSupabaseRecordStore({projectUrl:import.meta.env.VITE_SUPABASE_URL,publishableKey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,accessToken:async()=>(await supabase.auth.getSession()).data.session?.access_token??null});
};
export class BusinessWorkspace {
 private rows=new Map<BusinessTable,Map<string,RevisionedRecord<any>>>();
 private baseline=new Map<BusinessTable,string>();
 private loaded=false;
 constructor(private store=businessStore()){}
 async load(){
  this.loaded=false;
  const tables:BusinessTable[]=['lm_products','lm_fonts','lm_orders','lm_customers','lm_store_private','lm_pricing'];
  const result=await Promise.all(tables.map(async t=>[t,await this.store.list(t)] as const));
  for(const [t,rows] of result)this.rows.set(t,new Map(rows.map(r=>[r.id,r])));
  this.loaded=true;
  return Object.fromEntries(result.map(([t,rows])=>[t,rows.map(r=>r.data)]));
 }
 trackInitial(table:BusinessTable,records:any[]){this.baseline.set(table,JSON.stringify(records));}
 async save(table:BusinessTable,records:any[]){
  if(!this.loaded)throw Error('Espera la carga de Supabase antes de guardar');
  if(this.baseline.get(table)===JSON.stringify(records))return;
  const previous=this.rows.get(table);if(!previous)throw Error('Módulo sin cargar');
  const ids=new Set<string>();
  for(const value of records){
   const id=String(value.id??'main');if(ids.has(id))throw Error('ID duplicado');ids.add(id);
   const old=previous.get(id);
   const data=stripOrderDisplayData(table,{...(old?.data??{}),...value});
   if(old&&JSON.stringify(old.data)===JSON.stringify(data))continue;
   const receipt=await this.store.save(table,{id,revision:old?.revision??0,data});previous.set(id,receipt);
  }
  for(const [id,row] of previous){if(!ids.has(id)){await this.store.remove(table,id,row.revision);previous.delete(id);}}
  this.baseline.set(table,JSON.stringify(records));
 }
}

export function stripOrderDisplayData(table:BusinessTable,value:any){
 if(table==='lm_fonts'){
  // Los bytes oficiales incluidos en el frontend (bundled) son recursos versionados,
  // nunca contenido del catálogo vivo: se excluyen de toda escritura remota.
  if(value?.bundled){const copy={...value};delete copy.fileData;delete copy.bundled;return copy;}
  return value;
 }
 if(table!=='lm_orders')return value;const copy=structuredClone(value);
 for(const item of copy.items??[]){if(item.backgroundAssetId)delete item.customBackgroundImage;for(const key of ['frontLogos','backLogos'])for(const layer of item[key]??[]){if(layer.assetId)delete layer.url;if(layer.originalAssetId)delete layer.originalUrl;}}return copy;
}

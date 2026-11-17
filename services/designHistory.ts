import {readLocalDesignImage} from './localDesignImage';
import {supabase} from './supabaseClient';
export interface SavedDesign {id:string;name:string;payload:any;created_at:string;}
const requireClient=()=>{if(!supabase)throw Error('Supabase no configurado');return supabase;};
export async function listDesigns():Promise<SavedDesign[]>{const {data,error}=await requireClient().from('lm_design_history').select('id,name,payload,created_at').order('created_at',{ascending:false});if(error)throw error;return data??[];}
const assertCurrent=(isCurrent:()=>boolean)=>{if(!isCurrent())throw Error('Operación de borrador cancelada');};
export async function saveDesign(name:string,payload:any,isCurrent:()=>boolean=()=>true){
 assertCurrent(isCurrent);
 const s=requireClient();const {data:{session}}=await s.auth.getSession();assertCurrent(isCurrent);if(!session)throw Error('Inicia sesión para guardar tu diseño');
 const cache=new Map<string,string>();
 const capture=async(url:string)=>{
  assertCurrent(isCurrent);if(!url)return url;if(cache.has(url))return {$asset:cache.get(url)};
  // Only existing local data is submitted. No server fetch of caller URLs.
  const blob=await readLocalDesignImage(url);assertCurrent(isCurrent);
  const {data,error}=await s.functions.invoke('lm-design-assets',{body:blob,headers:{'Content-Type':blob.type}});
  assertCurrent(isCurrent);if(error||!data?.asset?.id)throw Error('No se pudo verificar la imagen original; tu diseño sigue abierto');
  cache.set(url,data.asset.id);return {$asset:data.asset.id};
 };
 const copy=structuredClone(payload);
 for(const side of ['frontLogos','backLogos'])for(const logo of copy[side]??[]){logo.url=await capture(logo.url);if(logo.originalUrl)logo.originalUrl=await capture(logo.originalUrl);}
 if(copy.customBackgroundImage)copy.customBackgroundImage=await capture(copy.customBackgroundImage);
 assertCurrent(isCurrent);
 const {data,error}=await s.from('lm_design_history').insert({owner_id:session.user.id,name,payload:copy}).select('id').single();if(error)throw error;return data.id;
}
export async function restoreDesign(row:SavedDesign,isCurrent:()=>boolean=()=>true){
 assertCurrent(isCurrent);
 const s=requireClient(),copy=structuredClone(row.payload);const cache=new Map<string,string>();
 const restore=async(ref:any)=>{
  assertCurrent(isCurrent);if(typeof ref==='string')return ref;if(!ref?.$asset)throw Error('Referencia de imagen inválida');if(cache.has(ref.$asset))return cache.get(ref.$asset);
  const {data:asset,error}=await s.from('lm_verified_assets').select('id,original_path,sha256,mime_type').eq('id',ref.$asset).single();assertCurrent(isCurrent);if(error||!asset)throw Error('No tienes acceso a la imagen original');
  const {data:blob,error:downloadError}=await s.storage.from('lm-private-designs').download(asset.original_path);assertCurrent(isCurrent);if(downloadError||!blob)throw Error('No se pudo descargar el original privado');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');assertCurrent(isCurrent);if(digest!==asset.sha256)throw Error('El original no coincide con el archivo verificado');
  const value=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as string);reader.onerror=reject;reader.readAsDataURL(new Blob([blob],{type:asset.mime_type}));});assertCurrent(isCurrent);cache.set(ref.$asset,value);return value;
 };
 for(const side of ['frontLogos','backLogos'])for(const logo of copy[side]??[]){logo.url=await restore(logo.url);if(logo.originalUrl)logo.originalUrl=await restore(logo.originalUrl);}
 if(copy.customBackgroundImage)copy.customBackgroundImage=await restore(copy.customBackgroundImage);
 assertCurrent(isCurrent);return copy;
}
export async function deleteDesign(id:string){const {error}=await requireClient().from('lm_design_history').delete().eq('id',id);if(error)throw error;}

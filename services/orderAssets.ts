import {supabase} from './supabaseClient';
/** Only the order owner or authorized admin can read original assets through RLS. */
export async function hydrateOrderAssets(orders:any[]){
 if(!supabase)return orders;const cache=new Map<string,string>();
 const get=async(id:string)=>{if(cache.has(id))return cache.get(id);const {data,error}=await supabase!.from('lm_verified_assets').select('original_path,mime_type').eq('id',id).maybeSingle();if(error||!data)return undefined;const r=await supabase!.storage.from('lm-private-designs').download(data.original_path);if(r.error||!r.data)return undefined;const value=await new Promise<string>((resolve,reject)=>{const f=new FileReader();f.onload=()=>resolve(f.result as string);f.onerror=reject;f.readAsDataURL(new Blob([r.data!],{type:data.mime_type}));});cache.set(id,value);return value;};
 for(const order of orders)for(const item of order.items??[]){if(item.backgroundAssetId)item.customBackgroundImage=await get(item.backgroundAssetId);for(const side of ['frontLogos','backLogos'])for(const layer of item[side]??[]){if(layer.assetId)layer.url=await get(layer.assetId);if(layer.originalAssetId)layer.originalUrl=await get(layer.originalAssetId);}
 }
 return orders;
}

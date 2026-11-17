import {supabase} from './supabaseClient';import {readLocalDesignImage} from './localDesignImage';import {CheckoutRequest} from './supabaseCheckout';
/** Cache a successful upload in this checkout attempt, including ambiguous retries. */
export async function prepareCheckoutAssets(input:CheckoutRequest,cache:Map<string,string>){
 if(!supabase)throw Error('Supabase no configurado');const request=structuredClone(input);
 const upload=async(url:string)=>{if(cache.has(url))return cache.get(url)!;const blob=await readLocalDesignImage(url);const {data,error}=await supabase!.functions.invoke('lm-design-assets',{body:blob,headers:{'Content-Type':blob.type}});if(error||!data?.asset?.id)throw Error('No se pudo verificar el archivo original. Carrito conservado');cache.set(url,data.asset.id);return data.asset.id as string;};
 for(const item of request.items){if(item.customBackgroundImage){(item as any).backgroundAssetId=await upload(item.customBackgroundImage);delete item.customBackgroundImage;}for(const side of ['frontLogos','backLogos'] as const){item[side]=await Promise.all(item[side].map(async layer=>{
  return {id:layer.id,assetId:await upload(layer.url),originalAssetId:await upload(layer.originalUrl||layer.url),state:layer.state} as any;
 }));}}
 return request;
}

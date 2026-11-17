/** Bind design layers to server-owned verified references. Do not persist caller URLs.
 * This preparation must run on the trusted server before a matching asset-aware RPC.
 * It does NOT make current RPC005 asset-aware and is deliberately disconnected.
 */
export async function resolveCheckoutAssets(identity,request,assets){
 if(!identity?.verified||!identity.userId)throw Error('Verified identity required');
 const snapshot=structuredClone(request);
 for(const item of snapshot.items??[]){
  for(const key of ['frontLogos','backLogos']){
   if(!Array.isArray(item[key]))throw Error('Design logo array required');
   const next=[];
   for(const layer of item[key]){
    if(typeof layer.assetId!=='string')throw Error('Upload original before checkout');
    const ref=await assets.checkoutAsset(identity,layer.assetId);
    next.push({id:layer.id,assetId:ref.id,sha256:ref.sha256,mimeType:ref.mimeType,state:structuredClone(layer.state)});
   }
   item[key]=next;
  }
 }
 return snapshot;
}

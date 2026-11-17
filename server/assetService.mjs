import {randomUUID} from 'node:crypto';
import {verifyUploadedAsset} from './verifyAsset.mjs';
/** Injectable server-side service preparation. Repository must be privileged and immutable.
 * No browser caller may supply its own owner ID, verification record or repository.
 */
export function createAssetService({repository,renderSvg,clock=()=>new Date()}){
 if(!repository||typeof renderSvg!=='function')throw Error('Trusted storage and bounded SVG renderer required');
 const requireIdentity=identity=>{if(!identity?.verified||typeof identity.userId!=='string'||!identity.userId)throw Error('Verified server identity required');};
 return {
  async upload(identity,bytes,mime){
   requireIdentity(identity);
   const checked=await verifyUploadedAsset(bytes,mime);
   // The trusted renderer is responsible for isolation, timeout/memory bounds and
   // fonts. Its output is decoded again. A render result never replaces the vector.
   let preview;
   if(mime==='image/svg+xml'){
    preview=await renderSvg(checked.original,{maxPixels:20_000_000,timeoutMs:3000,network:false});
    await verifyUploadedAsset(preview,'image/png');
   }else preview=bytes;
   const id=randomUUID(),createdAt=clock().toISOString();
   const record={id,ownerId:identity.userId,sha256:checked.sha256,mimeType:checked.mimeType,createdAt,status:'verified',previewMimeType:mime==='image/svg+xml'?'image/png':checked.mimeType,original:Buffer.from(bytes),preview:Buffer.from(preview)};
   await repository.insertImmutable(record);
   return {id,mimeType:record.mimeType,sha256:record.sha256,createdAt};
  },
  async checkoutAsset(identity,id){
   requireIdentity(identity);if(typeof id!=='string'||!id)throw Error('Asset reference required');
   const record=await repository.get(id);
   if(!record||record.ownerId!==identity.userId||record.status!=='verified')throw Error('Asset not authorized');
   return {id:record.id,sha256:record.sha256,mimeType:record.mimeType};
  },
 };
}

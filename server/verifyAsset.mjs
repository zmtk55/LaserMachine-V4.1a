import {validateEngravingSvg} from './validateSvg.mjs';
import {validateRaster} from './validateRaster.mjs';
/** Server-only preparation. No privileged fetches. Call only on bounded upload bytes.
 * A returned record still needs server-owned immutable storage, owner authorization
 * and bounded rendering before checkout can trust its ID.
 */
export async function verifyUploadedAsset(bytes,declaredMime){
 if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>5_000_000)throw Error('Invalid upload size');
 if(declaredMime==='image/svg+xml'){
  const source=bytes.toString('utf8');if(!Buffer.from(source,'utf8').equals(bytes))throw Error('SVG must be valid UTF-8');
  return {...validateEngravingSvg(source),verifiedForCheckout:false};
 }
 const result=await validateRaster(bytes);
 if(result.mimeType!==declaredMime)throw Error('Upload MIME does not match decoded image');
 return {...result,verifiedForCheckout:false};
}

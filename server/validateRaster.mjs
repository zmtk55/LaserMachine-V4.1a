import sharp from 'sharp';
import {createHash} from 'node:crypto';
/** Decode real bytes, not a trusted MIME label. Original remains available for engraving. */
export async function validateRaster(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>5_000_000)throw Error('Invalid raster size');
 const image=sharp(bytes,{limitInputPixels:20_000_000,animated:false,failOn:'warning'});
 const metadata=await image.metadata();
 if(!['png','jpeg','webp'].includes(metadata.format)||!metadata.width||!metadata.height||(metadata.pages??1)>1)throw Error('Unsupported raster format or animation');
 if(metadata.width>10000||metadata.height>10000||metadata.width*metadata.height>20_000_000)throw Error('Raster dimensions exceed limits');
 // Force a full decode. metadata alone can succeed for a truncated image.
 const decoded=await image.clone().raw().toBuffer({resolveWithObject:true});
 if(decoded.info.width!==metadata.width||decoded.info.height!==metadata.height)throw Error('Raster decode mismatch');
 return {sha256:createHash('sha256').update(bytes).digest('hex'),mimeType:{png:'image/png',jpeg:'image/jpeg',webp:'image/webp'}[metadata.format],width:metadata.width,height:metadata.height,original:bytes};
}

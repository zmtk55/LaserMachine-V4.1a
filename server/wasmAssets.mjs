/** Supabase Edge-compatible prototype. No sharp, native renderer, worker_threads or network fetch.
 * WASM binaries must be supplied at startup from deployed static assets by the adapter.
 * The hosted Edge CPU/memory boundary is still unverified; never deploy as-is.
 */
import {Resvg,initWasm} from '@resvg/resvg-wasm';
import decodePng,{init as initPng} from '@jsquash/png/decode.js';
import decodeJpeg,{init as initJpeg} from '@jsquash/jpeg/decode.js';
import decodeWebp,{init as initWebp} from '@jsquash/webp/decode.js';
import {imageSize} from './rasterHeader.mjs';
import {validateEngravingSvg} from './validateSvg.mjs';
import {prepareSvgFontRender} from './svgFonts.mjs';
let ready;
export function initAssetWasm({resvg,png,jpeg,webp}){
 if(!ready)ready=Promise.all([initWasm(resvg),initPng(png),initJpeg(jpeg),initWebp(webp)]);
 return ready;
}
const view=bytes=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
function disallowAnimation(bytes,type){
 if(type==='png'){
  for(let offset=8;offset+12<=bytes.length;){const length=view(bytes).getUint32(offset);if(offset+12+length>bytes.length)throw Error('Truncated PNG');const name=String.fromCharCode(...bytes.subarray(offset+4,offset+8));if(name==='acTL')throw Error('Animation requires review');offset+=12+length;if(name==='IEND')break;}
 }
 if(type==='webp'){
  for(let offset=12;offset+8<=bytes.length;){const name=String.fromCharCode(...bytes.subarray(offset,offset+4)),length=view(bytes).getUint32(offset+4,true);if(offset+8+length>bytes.length)throw Error('Truncated WebP');if(name==='ANIM'||name==='ANMF')throw Error('Animation requires review');offset+=8+length+(length%2);}
 }
}
export async function decodeRasterWasm(bytes,declaredMime,{maxPixels=4_000_000}={}){
 if(!ready)throw Error('WASM initialization required');await ready;
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>5_000_000)throw Error('Invalid upload size');
 const header=imageSize(bytes),mime={png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[header.type];
 if(!mime||mime!==declaredMime)throw Error('MIME mismatch');
 if(!header.width||!header.height||header.width>10000||header.height>10000||header.width*header.height>maxPixels)throw Error('Raster dimensions exceed limits');
 disallowAnimation(bytes,header.type);
 const exact=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
 const decoded=await ({png:decodePng,jpg:decodeJpeg,webp:decodeWebp}[header.type])(exact);
 if(decoded.width!==header.width||decoded.height!==header.height||decoded.data.length!==decoded.width*decoded.height*4)throw Error('Decode mismatch');
 return {mimeType:mime,width:decoded.width,height:decoded.height};
}
export async function renderSvgWasm(source,{maxPixels=4_000_000,trustedFonts=[]}={}){
 if(!ready)throw Error('WASM initialization required');await ready;
 validateEngravingSvg(source);
 const {fontBuffers,renderSource}=prepareSvgFontRender(source,trustedFonts);
 let renderer,image;
 try{
  renderer=new Resvg(renderSource,{fitTo:{mode:'width',value:512},font:{fontBuffers}});
  // Dimension preflight MUST precede render/allocation, not follow it.
  if(!Number.isFinite(renderer.width)||!Number.isFinite(renderer.height)||renderer.width<=0||renderer.height<=0||512*Math.ceil(512*renderer.height/renderer.width)>maxPixels)throw Error('Preview dimensions exceed limits');
  image=renderer.render();
  if(image.width*image.height>maxPixels)throw Error('Preview dimensions exceed limits');
  return image.asPng();
 }finally{try{image?.free();}finally{try{renderer?.free();}catch{/* Preserve original renderer failure; WASM panic requires fresh instance. */}}}
}

import {useEffect,useState} from 'react';
import {previewInk} from './designPreview';

/** Preview contrast only. Does not infer a material, change the stored design or predict the engraved finish. */
export function photoPreviewInk(pixels:ArrayLike<number>,fallback:string){
 let light=0,count=0;
 for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<128)continue;light+=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];count++;}
 return count?previewInk(light/count<110?'#000000':'#ffffff'):fallback;
}
export function useOwnPhotoInk(photo:string|undefined|null,fallback:string){
 const [sample,setSample]=useState<{photo:string;ink:string}|null>(null);
 useEffect(()=>{
  if(!photo?.startsWith('data:image/'))return;
  let active=true;const image=new Image();
  image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.drawImage(image,image.naturalWidth*.45,image.naturalHeight*.35,image.naturalWidth*.1,image.naturalHeight*.3,0,0,32,32);const ink=photoPreviewInk(ctx.getImageData(0,0,32,32).data,fallback);if(active)setSample({photo,ink});}catch{/* Keep existing tone when the image cannot be sampled. */}};
  image.src=photo;return()=>{active=false;image.onload=null;};
 },[photo,fallback]);
 return photo&&sample?.photo===photo?sample.ink:fallback;
}
/** Recolour only app-created monochrome monograms in the preview; original SVG stays unchanged. */
export function monogramPreviewUrl(url:string,ink:string){
 const prefix='data:image/svg+xml;charset=utf-8,';
 if(!url.startsWith(prefix))return url;
 try{const svg=decodeURIComponent(url.slice(prefix.length));if(!svg.includes('data-lm-monogram="true"')&&!svg.includes('id="lm-monogram"'))return url;return prefix+encodeURIComponent(svg.replaceAll('#c4c9cf',ink));}catch{return url;}
}

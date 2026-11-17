import type {FontOption} from '../types';
import {bundledFontFor} from './bundledFonts';
export interface FontReference {id:number|string;name:string;source:'included'|'workshop'|'catalog';sha256?:string;}
export function fontReference(font:FontOption|undefined,id?:number|string,name?:string):FontReference|undefined{
 const key=font?.id??id;if(key==null)return undefined;
 const included=font?.bundled?bundledFontFor(font):undefined;
 return {id:key,name:included?.family||font?.name||name||'',source:font?.bundled?'included':font?.isCustom?'workshop':'catalog'};
}
export function fontReferenceLabel(ref:FontReference|undefined){
 if(!ref)return 'Fuente sin identificar';
 const title=ref.source==='workshop'?'Fuente':'Catálogo';
 return `${title} #${ref.id}${ref.name?' · '+ref.name:''}${ref.source==='included'?' · archivo incluido, sin número de taller':ref.source==='catalog'?' · número de taller sin confirmar':''}`;
}
export function fontReferenceBrief(ref:FontReference|undefined){if(!ref)return 'Fuente sin identificar';return ref.source==='workshop'?`#${ref.id}${ref.name?' · '+ref.name:''}`:ref.name||`Referencia ${ref.id}`;}
const xml=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export async function fontFileDigest(font:FontOption){if(!font.fileData)throw Error('Archivo de fuente no disponible');const raw=atob(font.fileData.split(',')[1]),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export function identifyMonogram(svg:string,ref:FontReference,text:string,template:string){
 const info=xml(JSON.stringify({version:1,font:ref,text,template}));
 return svg.replace('<svg ','<svg id="lm-monogram" ').replace(/(<svg\b[^>]*>)/,`$1<desc id="lm-font-reference">${info}</desc>`);
}
export function readMonogramReference(url:string|undefined):{font:FontReference;text:string;template:string}|undefined{
 if(!url?.startsWith('data:image/svg+xml'))return undefined;
 try{const comma=url.indexOf(','),raw=url.slice(comma+1),svg=url.slice(0,comma).includes(';base64')?decodeURIComponent(escape(atob(raw))):decodeURIComponent(raw);const data=svg.match(/<desc id="lm-font-reference">([\s\S]*?)<\/desc>/)?.[1];if(!data)return undefined;const parsed=JSON.parse(data.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));if(parsed.version!==1||!['string','number'].includes(typeof parsed.font?.id)||typeof parsed.font?.name!=='string'||!['included','workshop','catalog'].includes(parsed.font?.source)||typeof parsed.text!=='string'||typeof parsed.template!=='string')return undefined;return parsed;}catch{return undefined;}
}

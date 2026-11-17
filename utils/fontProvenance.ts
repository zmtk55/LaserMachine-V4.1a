import {FontOption} from '../types';
export const LEGACY_FONT_FAMILIES:Record<string,string>={'font-google':'Plus Jakarta Sans','font-industrial':'Anton','font-mono':'JetBrains Mono','font-bold1':'Bebas Neue','font-script1':'Permanent Marker','font-script2':'Permanent Marker (inclinada)','font-serif1':'Playfair Display','font-display1':'Plus Jakarta Sans (peso 900)'};
/** Legacy aliases remain intact for old designs, but are not files supplied by the workshop. */
export function hasFontFile(font:FontOption|undefined):boolean{const valid=!!font?.fileData&&/^data:[^,]*;base64,[A-Za-z0-9+/=\s]+$/.test(font.fileData);return valid&&(font?.isCustom===true||font?.bundled===true);}
export function productionFont(font:FontOption|undefined){return hasFontFile(font)&&font.active!==false;}
export function fontSourceLabel(font:FontOption){if(hasFontFile(font))return font.bundled?'Archivo oficial de la familia, incluido y verificado':'Archivo propio';return `Referencia: ${LEGACY_FONT_FAMILIES[font.cssFamily]||'fuente del navegador'}. Sin archivo propio`;}
export async function checkFontFile(data:string){if(typeof FontFace==='undefined')throw Error('No se puede comprobar el archivo en este navegador.');const face=new FontFace('lm-file-check',`url(${JSON.stringify(data)})`);await face.load();return true;}

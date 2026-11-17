import {FontOption} from '../types';
import {productionFont} from './fontProvenance';
/** Convert SVG labels to paths from the selected catalog file. No system-font fallback. */
export async function loadOwnFont(font:FontOption){
 if(!productionFont(font))throw Error('Carga y activa una tipografía propia para crear monogramas.');
 const {create}=await import('fontkit');
 const raw=atob(font.fileData!.split(',')[1]);
 return create(Uint8Array.from(raw,c=>c.charCodeAt(0)) as any) as any;
}
export function outlineSvgText(svg:string,font:any):string{
 return svg.replace(/<text\b([^>]*)>([^<]*)<\/text>/g,(_,attrs:string,text:string)=>{
  const attr=(name:string)=>attrs.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'))?.[1];
  for(const c of Array.from(text))if(!font.hasGlyphForCodePoint(c.codePointAt(0)!))throw Error('Esta tipografía no contiene todos los caracteres del monograma.');
  const run=font.layout(text),size=Number(attr('font-size')||40),scale=size/font.unitsPerEm;
  if(!Number.isFinite(scale)||scale<=0)throw Error('Tamaño de monograma inválido');
  const total=run.positions.reduce((sum:number,p:any)=>sum+p.xAdvance,0)*scale;
  const anchor=attr('text-anchor'),x=Number(attr('x')||0)-(anchor==='middle'?total/2:anchor==='end'?total:0),y=Number(attr('y')||0);
  let offset=0;
  const paths=run.glyphs.map((glyph:any,i:number)=>{if(!glyph.id)throw Error('Carácter sin contorno disponible');const pos=run.positions[i],path=glyph.path.toSVG();const result=`<path d="${path}" transform="translate(${x+(offset+pos.xOffset)*scale} ${y-pos.yOffset*scale}) scale(${scale} ${-scale})"/>`;offset+=pos.xAdvance;return result;}).join('');
  return `<g fill="${attr('fill')||'currentColor'}">${paths}</g>`;
 });
}

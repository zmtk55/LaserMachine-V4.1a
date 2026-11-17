import {SaxesParser} from 'saxes';
import {create} from 'fontkit';
/** Exact font-file checks, never substitutes UI fonts or fetches caller URLs.
 * trustedFonts comes from server-owned catalog bytes, not the request.
 */
export function resolveSvgFonts(source,trustedFonts=[]){
 const available=new Map();
 for(const entry of trustedFonts){
  if(!available.has(entry.family))available.set(entry.family,[]);
  available.get(entry.family).push(entry);
 }
 const checked=new Map();
 const checkedFont=family=>{
  if(checked.has(family))return checked.get(family);
  const candidates=available.get(family);if(candidates.length!==1)throw Error('Ambiguous font family');
  const entry=candidates[0];
  if(!(entry.bytes instanceof Uint8Array)||entry.bytes.length>5_000_000)throw Error('Invalid catalog font bytes');
  const font=create(Buffer.from(entry.bytes));if(!font.familyName||font.fonts)throw Error('Font collection needs explicit face');
  if(entry.family!==font.familyName)throw Error('Catalog font family does not match embedded font');
  const result={font,bytes:entry.bytes};checked.set(family,result);return result;
 };
 const stack=[],used=new Set();const parser=new SaxesParser({xmlns:true});
 parser.on('opentag',tag=>{
  const parent=stack.at(-1)??{};const attrs=Object.fromEntries(Object.values(tag.attributes).map(a=>[a.local,a.value]));
  const styles=Object.fromEntries((attrs.style??'').split(';').filter(x=>x.trim()).map(x=>{const i=x.indexOf(':');return [x.slice(0,i).trim(),x.slice(i+1).trim()];}));
  stack.push({text:parent.text||['text','tspan','textPath'].includes(tag.local),family:styles['font-family']??attrs['font-family']??parent.family,weight:styles['font-weight']??attrs['font-weight']??parent.weight??'normal',style:styles['font-style']??attrs['font-style']??parent.style??'normal'});
 });
 parser.on('closetag',()=>stack.pop());
 parser.on('text',text=>{
  const current=stack.at(-1);if(!current?.text||!text.trim())return;
  const family=current.family?.replace(/^(['"])(.*)\1$/,'$2');
  if(!family||!available.has(family))throw Error('SVG text needs verified engraving font mapping before preview');
  if(!['normal','400'].includes(current.weight)||current.style!=='normal')throw Error('SVG styled font face needs explicit mapping');
  const {font}=checkedFont(family);
  for(const character of text)if(!/\s/u.test(character)&&!font.hasGlyphForCodePoint(character.codePointAt(0)))throw Error('Font is missing SVG text glyph');
  used.add(family);
 });
 parser.on('error',error=>{throw error;});parser.write(source).close();
 return [...used].map(family=>checkedFont(family).bytes);
}

/** Catalog aliases bind to the bytes of exactly one stored face. Renderer source
 * is derived separately. The caller must retain the uploaded original unchanged.
 */
export function catalogFontEntries(rows=[]){
 return rows.filter(f=>f.active!==false&&f.fileData?.startsWith('data:')&&f.fileData.includes(';base64,')).map(f=>{
  const bytes=Buffer.from(f.fileData.split(',')[1],'base64');
  if(bytes.length>5_000_000)throw Error('Catalog font too large');
  const font=create(bytes);if(!font.familyName||font.fonts)throw Error('Explicit font face required');
  return {family:font.familyName,alias:f.cssFamily,bytes};
 });
}
export function prepareSvgFontRender(source,trustedFonts=[]){
 const byAlias=new Map(),byFamily=new Map();
 for(const entry of trustedFonts){
  if(entry.alias){const list=byAlias.get(entry.alias)??[];list.push(entry);byAlias.set(entry.alias,list);}
  const list=byFamily.get(entry.family)??[];list.push(entry);byFamily.set(entry.family,list);
 }
 const checked=new Map(),used=new Map(),stack=[];let output='';
 const escapeText=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const escapeAttr=s=>escapeText(s).replaceAll('"','&quot;').replaceAll('\n','&#10;').replaceAll('\r','&#13;').replaceAll('\t','&#9;');
 const inspect=entry=>{
  if(checked.has(entry))return checked.get(entry);
  if(!(entry.bytes instanceof Uint8Array)||entry.bytes.length>5_000_000)throw Error('Invalid catalog font bytes');
  const font=create(Buffer.from(entry.bytes));if(!font.familyName||font.fonts||font.familyName!==entry.family)throw Error('Catalog font family does not match embedded font');
  const result={entry,font,weight:font['OS/2']?.usWeightClass??400,style:font.italicAngle?'italic':'normal'};
  if(font.variationAxes&&Object.keys(font.variationAxes).length)throw Error('Variable font axes require explicit mapping');
  checked.set(entry,result);return result;
 };
 const faceFor=current=>{
  const family=current.family?.replace(/^(['"])(.*)\1$/,'$2');if(!family)throw Error('SVG text needs verified engraving font mapping');
  const weight=current.weight==='normal'?400:current.weight==='bold'?700:Number(current.weight);
  const style=current.style==='oblique'?'italic':current.style;
  if(!Number.isFinite(weight)||weight<100||weight>900||!['normal','italic'].includes(style))throw Error('SVG styled font face needs explicit mapping');
  if(byAlias.has(family)){
   const candidates=byAlias.get(family);if(candidates.length!==1)throw Error('Ambiguous catalog font alias');
   const face=inspect(candidates[0]);
   // CSS aliases are defined by the app as normal/400 for this exact file.
   // Explicit emphasis may only select a face that actually exists, never synthesize.
   if((weight!==400&&weight!==face.weight)||(style!=='normal'&&style!==face.style))throw Error('SVG styled font face needs explicit mapping');
   return face;
  }
  const candidates=(byFamily.get(family)??[]).map(inspect).filter(f=>f.weight===weight&&f.style===style);
  if(candidates.length!==1)throw Error('SVG text needs unambiguous verified font face mapping');
  return candidates[0];
 };
 const parser=new SaxesParser({xmlns:true});
 parser.on('opentag',tag=>{
  const attrs=Object.fromEntries(Object.values(tag.attributes).map(a=>[a.name,a.value]));
  const styles=Object.fromEntries((attrs.style??'').split(';').filter(x=>x.trim()).map(x=>{const i=x.indexOf(':');return [x.slice(0,i).trim(),x.slice(i+1).trim()];}));
  const parent=stack.at(-1)??{};const current={text:parent.text||['text','tspan','textPath'].includes(tag.local),family:styles['font-family']??attrs['font-family']??parent.family,weight:styles['font-weight']??attrs['font-weight']??parent.weight??'normal',style:styles['font-style']??attrs['font-style']??parent.style??'normal'};
  stack.push(current);
  if(current.text&&current.family){const face=faceFor(current);current.face=face;attrs['font-family']=face.entry.family;attrs['font-weight']=String(face.weight);attrs['font-style']=face.style;for(const name of ['font-family','font-weight','font-style'])delete styles[name];if(attrs.style!==undefined)attrs.style=Object.entries(styles).map(([k,v])=>k+':'+v).join(';');}
  output+='<'+tag.name+Object.entries(attrs).map(([k,v])=>' '+k+'="'+escapeAttr(v)+'"').join('')+'>';
 });
 parser.on('closetag',tag=>{stack.pop();output+='</'+tag.name+'>';});
 parser.on('text',text=>{
  const current=stack.at(-1);if(current?.text&&text.trim()){
   const face=current.face??faceFor(current);for(const character of text)if(!/\s/u.test(character)&&!face.font.hasGlyphForCodePoint(character.codePointAt(0)))throw Error('Font is missing SVG text glyph');
   used.set(face.entry,face.entry.bytes);
  }
  output+=escapeText(text);
 });
 parser.on('error',error=>{throw error;});parser.write(source).close();
 return {renderSource:output,fontBuffers:[...used.values()]};
}

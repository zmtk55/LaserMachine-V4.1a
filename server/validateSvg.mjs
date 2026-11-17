import {SaxesParser} from 'saxes';
import {createHash} from 'node:crypto';
const elements=new Set('svg g defs path rect circle ellipse line polyline polygon text tspan textPath use symbol title desc clipPath mask linearGradient radialGradient stop pattern'.split(' '));
const attributes=new Set('id version xmlns xmlns:xlink viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points transform fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity color style class preserveAspectRatio font-family font-size font-weight font-style text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing dx dy rotate textLength lengthAdjust href xlink:href clip-path clip-rule mask gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity patternUnits patternContentUnits patternTransform marker-start marker-mid marker-end'.split(' '));
const styleProperties=new Set('fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity color font-family font-size font-weight font-style text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing clip-path clip-rule mask stop-color stop-opacity'.split(' '));
/** Server-side preparation only. Returns the unchanged original after strict XML validation.
 * Never treats a client validation flag as authority. No network or file access.
 * Unsupported features are review errors, not silently removed or rasterized.
 */
export function validateEngravingSvg(source){
 if(typeof source!=='string'||Buffer.byteLength(source)>2_000_000||source.includes('\0'))throw Error('SVG size or encoding is invalid');
 const ids=new Set(),references=new Set(),stack=[],useEdges=[];let nodes=0,depth=0,root=false,textSize=0;
 const checkValue=(value)=>{
  if(/[\u0000-\u001f\u007f\\]/.test(value)||/@import|expression\s*\(|javascript\s*:|data\s*:|https?\s*:|file\s*:|var\s*\(/i.test(value))throw Error('Active or external SVG content requires review');
  const urls=[...value.matchAll(/url\s*\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi)];
  if(/url\s*\(/i.test(value.replace(/url\s*\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi,'')))throw Error('Malformed SVG reference');
  for(const [, ,url] of urls){if(!/^#[A-Za-z_][\w.:-]*$/.test(url))throw Error('Only local SVG references are allowed');references.add(url.slice(1));}
 };
 const parser=new SaxesParser({xmlns:true});
 parser.on('error',error=>{throw Error('Invalid SVG XML: '+error.message);});
 parser.on('doctype',()=>{throw Error('SVG DTD/entities are not allowed');});
 parser.on('processinginstruction',()=>{throw Error('SVG processing instructions are not allowed');});
 parser.on('opentag',tag=>{
  if(++nodes>20000||++depth>64)throw Error('SVG complexity exceeds review limits');
  if(!root){if(tag.local!=='svg'||tag.uri!=='http://www.w3.org/2000/svg')throw Error('SVG root/namespace required');root=true;}
  if(tag.uri!=='http://www.w3.org/2000/svg'||!elements.has(tag.local))throw Error('Unsupported SVG element: '+tag.name);
  const node={id:null,parent:stack.at(-1)??null};stack.push(node);
  for(const attr of Object.values(tag.attributes)){
   if(!attributes.has(attr.name)||/^on/i.test(attr.local))throw Error('Unsupported SVG attribute: '+attr.name);
   if(attr.name==='xmlns'){if(attr.value!=='http://www.w3.org/2000/svg')throw Error('Unexpected namespace');continue;}
   if(attr.name==='xmlns:xlink'){if(attr.value!=='http://www.w3.org/1999/xlink')throw Error('Unexpected xlink namespace');continue;}
   if(attr.uri&&!['http://www.w3.org/1999/xlink'].includes(attr.uri))throw Error('Unexpected SVG attribute namespace');
   checkValue(attr.value);
   if(attr.local==='id'){if(!/^[A-Za-z_][\w.:-]*$/.test(attr.value)||ids.has(attr.value))throw Error('Invalid or duplicate SVG id');ids.add(attr.value);node.id=attr.value;}
   if(attr.local==='href'){if(!/^#[A-Za-z_][\w.:-]*$/.test(attr.value))throw Error('External SVG href not allowed');references.add(attr.value.slice(1));if(tag.local==='use')useEdges.push([node,attr.value.slice(1)]);}
   if(attr.local==='style')for(const declaration of attr.value.split(';').filter(x=>x.trim())){const colon=declaration.indexOf(':');if(colon<1||!styleProperties.has(declaration.slice(0,colon).trim())||/!important/i.test(declaration))throw Error('Unsupported SVG style');}
  }
 });
 parser.on('closetag',()=>{depth--;stack.pop();});
 parser.on('text',text=>{textSize+=text.length;if(textSize>200000)throw Error('SVG text exceeds review limits');});
 parser.on('cdata',()=>{throw Error('SVG CDATA requires review');});
 parser.write(source).close();if(!root||depth!==0)throw Error('Incomplete SVG');
 for(const id of references)if(!ids.has(id))throw Error('Missing local SVG reference: '+id);
 // A use target may contain another use indirectly. Build dependency edges for
 // every named ancestor to catch recursive expansions without expanding geometry.
 const graph=new Map();
 for(const [node,target] of useEdges){for(let ancestor=node;ancestor;ancestor=ancestor.parent){if(ancestor.id){const edges=graph.get(ancestor.id)??new Set();edges.add(target);graph.set(ancestor.id,edges);}}}
 const visited=new Set(),visiting=new Set();
 const visit=(id,level=0)=>{if(level>64)throw Error('SVG reference depth requires review');if(visiting.has(id))throw Error('Recursive SVG use is not allowed');if(visited.has(id))return;visiting.add(id);for(const target of graph.get(id)??[])visit(target,level+1);visiting.delete(id);visited.add(id);};
 for(const id of graph.keys())visit(id);
 return {original:source,sha256:createHash('sha256').update(source).digest('hex'),mimeType:'image/svg+xml',nodes,requiresBoundedRender:true};
}

import React from 'react';
import type {FontOption,LogoItem} from '../types';
import {fontReference,fontReferenceLabel,fontReferenceBrief,readMonogramReference} from '../utils/fontReference';
export function FontIdentification({fonts=[],text,text2,fontId,fontId2,fontName,logos=[],detailed=false}:{fonts?:FontOption[];text?:string;text2?:string;fontId?:number|string;fontId2?:number|string;fontName?:string;logos?:LogoItem[];detailed?:boolean}){
 const rows:{label:string;value:string}[]=[];
 const format=detailed?fontReferenceLabel:fontReferenceBrief;
 const label=(id:number|string|undefined,name?:string)=>format(fontReference(fonts.find(f=>String(f.id)===String(id)),id,name));
 if(text?.trim())rows.push({label:'Texto 1',value:label(fontId,fontName)});
 if(text2?.trim())rows.push({label:'Texto 2',value:label(fontId2)});
 logos.forEach((logo,index)=>{const ref=readMonogramReference(logo.originalUrl)||readMonogramReference(logo.url);if(ref)rows.push({label:`Monograma ${index+1} (${ref.text})`,value:format(ref.font)});else if(logo.url?.includes('lm-monogram')||logo.url?.includes('data-lm-monogram'))rows.push({label:`Monograma ${index+1}`,value:'Fuente original sin identificar. Se conserva el dibujo.'});});
 return rows.length?<dl className="space-y-1 text-xs normal-case text-zinc-800 dark:text-zinc-200" aria-label="Letras del diseño">{rows.map((row,i)=><div key={i} className="flex flex-wrap gap-x-1"><dt className="font-bold">{row.label}:</dt><dd className="break-words">{row.value}</dd></div>)}</dl>:null;
}

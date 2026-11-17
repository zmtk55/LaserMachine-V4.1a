import {productionFont} from '../utils/fontProvenance';
import React,{useState,useMemo,useRef,useLayoutEffect} from 'react';
import {FontOption,FontCategory} from '../types';
import {Type,Plus,Minus,ArrowLeft,ArrowRight} from 'lucide-react';
interface FontShowcaseProps {fonts:FontOption[];onSelectFont:(fontId:number,text:string)=>void;onBack?:()=>void;initialText?:string;}
// Measure the longest word in the actual font. Never split a name into letters.
export function FontSample({text,family,size}:{text:string;family:string;size:number}){
 const box=useRef<HTMLDivElement>(null),measure=useRef<HTMLSpanElement>(null);
 const [fitted,setFitted]=useState(size);
 useLayoutEffect(()=>{let active=true;const fit=()=>{if(!active||!box.current||!measure.current)return;const available=box.current.clientWidth-32;const widths=Array.from(measure.current.children).map(word=>word.getBoundingClientRect().width);const whole=widths.pop()||0;const longest=Math.max(...widths,0);if(available>0&&longest>0)setFitted(Math.min(size,size*available/longest,Math.max(Math.min(size,32),size*available/whole)));else setFitted(size);};fit();document.fonts?.ready.then(fit);const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(fit);if(box.current)observer?.observe(box.current);return()=>{active=false;observer?.disconnect();};},[text,family,size]);
 const words=text.split(/\s+/u).filter(Boolean);
 return <div ref={box} className="lm-font-sample" style={{fontFamily:family}}><span ref={measure} className="lm-font-measure" aria-hidden="true" style={{fontSize:size}}>{words.map((word,i)=><span key={i} style={{display:'block',width:'max-content'}}>{word}</span>)}<span style={{display:'block',width:'max-content'}}>{text}</span></span><span className="lm-font-preview" style={{fontSize:fitted}}>{text}</span></div>;
}
export const FontShowcase:React.FC<FontShowcaseProps>=({fonts=[],onSelectFont,onBack,initialText})=>{
 const [previewText,setPreviewText]=useState(initialText||''),[activeCategory,setActiveCategory]=useState<FontCategory|'TODAS'>('TODAS'),[size,setSize]=useState(64),[textError,setTextError]=useState(false);
 const categories:(FontCategory|'TODAS')[]=['TODAS','BASICAS','DEPORTE','CURSIVA','FONTS 2026','KIDS'];
 const available=useMemo(()=>fonts.filter(productionFont),[fonts]);
 const filtered=useMemo(()=>{return available.filter(f=>(activeCategory==='TODAS'||(f.category||'BASICAS')===activeCategory));},[available,activeCategory]);
 return <main className="lm-font-showcase lm-font-browser">
  <div className="lm-font-browser-entry">{onBack&&<button onClick={onBack} aria-label="Volver al catálogo"><ArrowLeft size={18}/></button>}
  <label className="lm-font-test" htmlFor="lm-font-test-input"><span className="lm-font-test-label">Prueba tu nombre</span><div><Type size={18}/><input id="lm-font-test-input" aria-label="Prueba tu nombre" autoComplete="off" value={previewText} aria-invalid={textError} onChange={e=>{setPreviewText(e.target.value);setTextError(false);}} placeholder="Escribe un nombre o frase"/></div>{textError&&<span role="alert" className="lm-font-text-error">Escribe el nombre o frase que quieres ver en tu termo.</span>}</label></div>
  <div className="lm-font-browser-filters"><select aria-label="Categoría de fuentes" value={activeCategory} onChange={e=>setActiveCategory(e.target.value as FontCategory|'TODAS')}>{categories.map(c=><option key={c} value={c}>{c==='TODAS'?'Categorías':c==='BASICAS'?'Básicas':c==='DEPORTE'?'Deporte':c==='CURSIVA'?'Cursiva':c==='KIDS'?'Kids':'Fonts 2026'}</option>)}</select></div>
  <div className="lm-font-browser-toolbar"><span role="status">{filtered.length} {filtered.length===1?'fuente':'fuentes'}</span><div className="lm-font-size"><span>Tamaño</span><button aria-label="Reducir tamaño de las muestras" disabled={size<=20} onClick={()=>setSize(s=>Math.max(20,s-4))}><Minus size={16}/></button><input aria-label="Tamaño de las muestras" type="range" min="20" max="120" step="2" value={size} onChange={e=>setSize(Number(e.target.value))}/><button aria-label="Aumentar tamaño de las muestras" disabled={size>=120} onClick={()=>setSize(s=>Math.min(120,s+4))}><Plus size={16}/></button></div></div>
  <div className="lm-font-grid">{!filtered.length&&<p className="lm-font-empty">{!available.length?'Las tipografías del taller aún no están cargadas. No se muestran fuentes de ejemplo como catálogo real.':'No hay fuentes disponibles en esta categoría'}</p>}{filtered.map((font,index)=><button key={font.id} className="lm-font-card" aria-label={`Elegir muestra ${index+1}`} onClick={()=>{if(!previewText.trim()){setTextError(true);document.getElementById('lm-font-test-input')?.focus();return;}onSelectFont(font.id,previewText.trim());}}><div className="lm-font-caption"><ArrowRight size={16}/></div><FontSample text={previewText||'Aa'} family={font.cssFamily||'sans-serif'} size={size}/></button>)}</div>
 </main>;
};
export default FontShowcase;

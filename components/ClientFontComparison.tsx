import React,{useMemo,useState}from'react';
import{Type,LayoutGrid,List,Minus,Plus}from'lucide-react';
import{FontOption}from'../types';
import{productionFont}from'../utils/fontProvenance';
import{FontSample}from'./FontShowcase';
export function ClientFontComparison({fonts}:{fonts:FontOption[]}){
 const[text,setText]=useState(''),[category,setCategory]=useState('Todas'),[view,setView]=useState<'list'|'grid'>('list'),[size,setSize]=useState(40);
 const available=useMemo(()=>fonts.filter(productionFont),[fonts]);
 const categories=useMemo(()=>['Todas',...new Set(available.map(f=>f.category||'Sin categoría'))],[available]);
 const filtered=useMemo(()=>available.filter(f=>category==='Todas'||(f.category||'Sin categoría')===category),[available,category]);
 const categoryLabel=(value:string)=>value==='Todas'?'Categorías':value==='BASICAS'?'Básicas':value==='CURSIVA'?'Cursiva':value==='DEPORTE'?'Deporte':value==='KIDS'?'Infantiles':value;
 return <section className="lm-client-fonts" aria-labelledby="client-fonts-title">
  <header><h2 id="client-fonts-title">Compara las fuentes</h2><span>{filtered.length} {filtered.length===1?'fuente':'fuentes'}</span></header>
  {!available.length?<p className="lm-font-provenance">Todavía no hay archivos tipográficos disponibles. La personalización con texto está bloqueada hasta que el taller los cargue.</p>:<>
   <label className="lm-compare-test" htmlFor="client-font-text"><span>Tu texto en cada fuente</span><div><Type size={18}/><input id="client-font-text" value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe un nombre o frase" autoComplete="off"/></div></label>
   <div className="lm-compare-filters"><select aria-label="Categoría de fuentes" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}</select></div>
   <div className="lm-compare-toolbar"><div role="group" aria-label="Tamaño de las muestras"><button aria-label="Reducir muestras" disabled={size<=24} onClick={()=>setSize(s=>Math.max(24,s-4))}><Minus size={16}/></button><span>{size}px</span><button aria-label="Aumentar muestras" disabled={size>=72} onClick={()=>setSize(s=>Math.min(72,s+4))}><Plus size={16}/></button></div><div role="group" aria-label="Vista de fuentes"><button aria-label="Vista de lista" aria-pressed={view==='list'} onClick={()=>setView('list')}><List size={18}/></button><button aria-label="Vista de cuadrícula" aria-pressed={view==='grid'} onClick={()=>setView('grid')}><LayoutGrid size={18}/></button></div></div>
   {!filtered.length?<p role="status" className="lm-compare-empty">No hay fuentes en esta categoría.</p>:<div className="lm-compare-results" data-view={view}>{filtered.map((font,index)=><article key={font.id} aria-label={`Muestra ${index+1}`}><FontSample text={text||'Aa'} family={font.cssFamily||'sans-serif'} size={size}/></article>)}</div>}
  </>}
 </section>;
}

import React,{useMemo,useState}from'react';
import{Search,Type,LayoutGrid,List,Minus,Plus}from'lucide-react';
import{FontOption}from'../types';
import{productionFont}from'../utils/fontProvenance';
export function ClientFontComparison({fonts}:{fonts:FontOption[]}){
 const[text,setText]=useState(''),[query,setQuery]=useState(''),[category,setCategory]=useState('Todas'),[view,setView]=useState<'list'|'grid'>('list'),[size,setSize]=useState(40);
 const available=useMemo(()=>fonts.filter(productionFont),[fonts]);
 const categories=useMemo(()=>['Todas',...new Set(available.map(f=>f.category||'Sin categoría'))],[available]);
 const filtered=useMemo(()=>{const q=query.trim().toLocaleLowerCase();return available.filter(f=>(category==='Todas'||(f.category||'Sin categoría')===category)&&(!q||f.name.toLocaleLowerCase().includes(q)||String(f.id)===q.replace(/^#/,'')));},[available,category,query]);
 return <section className="lm-client-fonts" aria-labelledby="client-fonts-title">
  <header><h2 id="client-fonts-title">Compara las fuentes</h2><span>{filtered.length} {filtered.length===1?'fuente':'fuentes'}</span></header>
  {!available.length?<p className="lm-font-provenance">Todavía no hay archivos tipográficos disponibles. La personalización con texto está bloqueada hasta que el taller los cargue.</p>:<>
   <label className="lm-compare-test" htmlFor="client-font-text"><span>Tu texto en cada fuente</span><div><Type size={18}/><input id="client-font-text" value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe un nombre o frase" autoComplete="off"/></div></label>
   <div className="lm-compare-filters"><div className="lm-compare-search"><Search size={16}/><input aria-label="Buscar fuente por nombre o número" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nombre o número"/></div><select aria-label="Categoría de fuentes" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
   <div className="lm-compare-toolbar"><div role="group" aria-label="Tamaño de las muestras"><button aria-label="Reducir muestras" disabled={size<=24} onClick={()=>setSize(s=>Math.max(24,s-4))}><Minus size={16}/></button><span>{size}px</span><button aria-label="Aumentar muestras" disabled={size>=72} onClick={()=>setSize(s=>Math.min(72,s+4))}><Plus size={16}/></button></div><div role="group" aria-label="Vista de fuentes"><button aria-label="Vista de lista" aria-pressed={view==='list'} onClick={()=>setView('list')}><List size={18}/></button><button aria-label="Vista de cuadrícula" aria-pressed={view==='grid'} onClick={()=>setView('grid')}><LayoutGrid size={18}/></button></div></div>
   {!filtered.length?<p role="status" className="lm-compare-empty">No hay fuentes con esos filtros. Prueba otro nombre, número o categoría.</p>:<div className="lm-compare-results" data-view={view}>{filtered.map(font=><article key={font.id} aria-label={`Fuente #${font.id} ${font.name}`}><div className="lm-compare-meta"><span className="lm-compare-id">#{font.id}</span><h3>{font.name}</h3><span className="lm-compare-category">{font.category||'Sin categoría'}</span></div><p className="lm-compare-sample" style={{fontFamily:font.cssFamily,fontSize:size}}>{text||'Aa'}</p></article>)}</div>}
  </>}
 </section>;
}

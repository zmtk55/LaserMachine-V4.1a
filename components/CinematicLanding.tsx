import React, {useEffect, useRef, useState} from 'react';
import {Product, StoreConfig} from '../types';
import '../src/styles/cinematic.css';
type Scene = 'frio' | 'calor' | 'outdoor';
const scenes: {key:Scene;label:string;line:string}[] = [
 {key:'frio',label:'Frío',line:'Para el hielo.'},
 {key:'calor',label:'Caliente',line:'Para el café.'},
 {key:'outdoor',label:'Outdoor',line:'Para el camino.'},
];
// Artwork derivatives exclude embedded interface. Cold/warm desktop originals
// and original depth layers have not been recovered. See asset-provenance.md.
export function CinematicLanding({onNavigate}: {storeConfig:StoreConfig;products:Product[];onLogin:()=>void;onNavigate:(v:'SHOP'|'CUSTOMIZER'|'LANDING')=>void}) {
 const [scene,setScene]=useState(0); const [paused,setPaused]=useState(false); const wrap=useRef<HTMLDivElement>(null);
 const [progress,setProgress]=useState(0); const [reduced,setReduced]=useState(false);
 useEffect(()=>{
  const mq=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(mq.matches);sync();mq.addEventListener('change',sync);
  const el=wrap.current;let sc:HTMLElement|Window=window;let p=el?.parentElement;
  while(p && p!==document.body){if(/auto|scroll/.test(getComputedStyle(p).overflowY)&&p.scrollHeight>p.clientHeight){sc=p;break;}p=p.parentElement;}
  const read=()=>{if(!el)return;const top=sc===window?0:(sc as HTMLElement).getBoundingClientRect().top;const y=Math.max(0,top-el.getBoundingClientRect().top);const unit=Math.max(1,el.clientHeight-(innerHeight-64));const v=Math.min(1,y/unit);setProgress(v);};
  sc.addEventListener('scroll',read,{passive:true});window.addEventListener('resize',read);read();
  return()=>{sc.removeEventListener('scroll',read);window.removeEventListener('resize',read);mq.removeEventListener('change',sync);};
 },[]);
 useEffect(()=>{if(paused||reduced)return;const t=setInterval(()=>setScene(n=>(n+1)%scenes.length),6000);return()=>clearInterval(t);},[paused,reduced]);
 const select=(i:number)=>{setScene(i);setPaused(true);};
 return <section ref={wrap} className="lm-cinema lm-ui" aria-label="Termos personalizados" aria-roledescription="carrusel">
  <div className="lm-cinema-stage">
   {scenes.map((s,i)=><div key={s.key} className={`lm-cinema-scene ${s.key} ${scene===i?'active':''}`} aria-hidden="true" style={{transform:reduced?'none':`scale(${1.015+progress*.025})`}}>
    <picture><source media="(min-width: 768px)" srcSet={`/landing/${s.key==='outdoor'?'outdoor-desktop':s.key+'-mobile'}.webp`}/><img src={`/landing/${s.key}-mobile.webp`} alt="" /></picture>
   </div>)}
   <div className="lm-cinema-shade" aria-hidden="true"/>
   <div className="lm-cinema-copy">
    <p className="lm-cinema-eyebrow">Termos grabados con láser</p>
    <h1>Tu termo,<br/>a tu nombre.</h1><p className="lm-cinema-line">{scenes[scene].line}</p>
    <div className="lm-cinema-actions"><button className="lm-primary" onClick={()=>onNavigate('CUSTOMIZER')}>Diseña el tuyo</button><button className="lm-cinema-secondary" onClick={()=>onNavigate('SHOP')}>Ver termos</button></div>
    <div className="lm-cinema-tabs" role="tablist" aria-label="Imágenes del carrusel">{scenes.map((s,i)=><button key={s.key} id={`scene-${s.key}`} role="tab" aria-selected={scene===i} tabIndex={scene===i?0:-1} onClick={()=>select(i)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=(i+(e.key==='ArrowRight'?1:2))%3;select(n);document.getElementById(`scene-${scenes[n].key}`)?.focus();}}}>{s.label}</button>)}</div>
    <div className="lm-cinema-carousel-controls"><button aria-label="Imagen anterior" onClick={()=>select((scene+2)%3)}>‹</button><span>{scene+1} / {scenes.length}</span><button aria-label="Imagen siguiente" onClick={()=>select((scene+1)%3)}>›</button>{!reduced&&<button className="lm-carousel-pause" aria-label={paused?'Reanudar carrusel':'Pausar carrusel'} onClick={()=>setPaused(p=>!p)}>{paused?'Reanudar':'Pausar'}</button>}</div>

   </div>
   <span className="lm-cinema-scroll">Desliza ↓</span>
  </div>
 </section>;
}

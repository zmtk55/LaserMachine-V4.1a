import React,{useEffect,useState}from'react';
import{Mountain}from'lucide-react';
export const DesktopFrostBackground=({index:externalIndex,onChange}:{index?:number;onChange?:(value:number)=>void})=>{
 const[desktop,setDesktop]=useState(false),[index,setIndex]=useState(9);
 const current=externalIndex??index;
 useEffect(()=>{if(typeof window.matchMedia!=='function')return;const m=window.matchMedia('(min-width:1024px)');const sync=()=>setDesktop(m.matches);sync();m.addEventListener('change',sync);return()=>m.removeEventListener('change',sync);},[]);
 if(!desktop)return null;
 return <><div className="lm-frost-landscape" style={{backgroundImage:`url(/backgrounds/frost/${String(current+1).padStart(2,'0')}.webp)`}} aria-hidden="true"/><button className="lm-frost-trigger" aria-label="Cambiar fondo de paisaje" title="Cambiar fondo" onClick={()=>{const next=(current+1)%10;setIndex(next);onChange?.(next);}}><Mountain size={18} strokeWidth={1.5} aria-hidden="true"/></button></>;
};

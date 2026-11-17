import React,{useState,useEffect,useRef}from'react';
import{BarChart3,ClipboardList,CalendarDays,Package,Users,Type,LayoutTemplate,Images,LayoutGrid,StickyNote,Settings,Search,Menu,X,ChevronDown}from'lucide-react';
export const ADMIN_SECTIONS=[
 {id:'DASHBOARD',label:'Resumen',description:'Lo que necesita atención en el taller.',group:'Operación',icon:BarChart3},
 {id:'ORDERS',label:'Pedidos',description:'Diseños, seguimiento, entrega y pago de cada pedido.',group:'Operación',icon:ClipboardList},
 {id:'CALENDAR',label:'Calendario',description:'Entregas y capacidad del taller.',group:'Operación',icon:CalendarDays},
 {id:'CLIENTS',label:'Clientes',description:'Contactos e historial de pedidos.',group:'Operación',icon:Users},
 {id:'INVENTORY',label:'Inventario',description:'Productos, precios y existencias.',group:'Catálogo',icon:Package},
 {id:'FONTS',label:'Fuentes',description:'Tipografías disponibles para personalizar.',group:'Catálogo',icon:Type},
 {id:'TEMPLATES',label:'Plantillas',description:'Diseños reutilizables para el personalizador.',group:'Catálogo',icon:LayoutTemplate},
 {id:'GALERIA',label:'Imágenes',description:'Logos e imágenes del personalizador.',group:'Catálogo',icon:Images},
 {id:'CONTENT',label:'Contenido',description:'Banners, promociones y contenido de la tienda.',group:'Tienda',icon:LayoutGrid},
 {id:'SETTINGS',label:'Ajustes',description:'Marca, mensajes y configuración del negocio.',group:'Tienda',icon:Settings},
 {id:'NOTES',label:'Notas privadas',description:'Apuntes internos. No se muestran a clientes.',group:'Tienda',icon:StickyNote},
]as const;
export function AdminNavigation({active,onChange,onAssistant,open:controlledOpen,onOpenChange,actions=[]}:{active:string;onChange:(id:string)=>void;onAssistant?:()=>void;open?:boolean;onOpenChange?:(v:boolean)=>void;actions?:{label:string;onClick:()=>void}[]}){
 const[localOpen,setLocalOpen]=useState(false);const open=controlledOpen??localOpen;const setOpen=(v:boolean)=>{setLocalOpen(v);onOpenChange?.(v);};const panel=useRef<HTMLElement>(null);
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement;panel.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setOpen(false);}if(e.key==='Tab'){const buttons=[...panel.current!.querySelectorAll<HTMLButtonElement>('button')].filter(e=>e.getClientRects().length>0);const a=buttons[0],z=buttons.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();z?.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a?.focus();}}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};},[open]);
 return <>
 {open&&<div className="admin-navigation-scrim" onClick={()=>setOpen(false)}/>}
 <aside ref={panel} id="admin-navigation" className={'admin-navigation '+(open?'is-open':'')} aria-label="Secciones de administración" {...(open?{role:'dialog','aria-modal':true}:{})}>
 <div className="admin-navigation-heading"><span><b>LM</b> Administración</span><button aria-label="Cerrar navegación" onClick={()=>setOpen(false)}><X size={20}/></button></div>
 {['Operación','Catálogo','Tienda'].map(group=><div className="admin-navigation-group" key={group}><p>{group}</p>{ADMIN_SECTIONS.filter(s=>s.group===group).map(item=><button key={item.id} aria-current={active===item.id?'page':undefined} onClick={()=>{onChange(item.id);setOpen(false);}}><item.icon size={18}/><span>{item.label}</span></button>)}</div>)}
 {onAssistant&&<button className="admin-rab-link" onClick={()=>{onAssistant();setOpen(false);}}><Search size={18}/><span>Consultar con RAB</span></button>}
 {!!actions.length&&<div className="admin-account-actions">{actions.map(action=><button key={action.label} onClick={()=>{action.onClick();setOpen(false);}}>{action.label}</button>)}</div>}
 </aside></>;
}

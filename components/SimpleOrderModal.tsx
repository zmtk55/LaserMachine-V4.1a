import{productionFont,checkFontFile}from'../utils/fontProvenance';
import {productPreviewImage,productColorHex,productPreviewLabel} from '../utils/productColorPreview';
import {previewImageScale,previewInk} from '../utils/designPreview';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { X, MessageCircle, PenTool, Type, Zap, Loader2 } from 'lucide-react';
import { Product, FontOption, PricingConfig, OrderItem, StoreConfig } from '../types';
import { computeOrderPrice } from '../services/orderPricing';
import { computeSimpleFit, simplePreviewFontPx, EDITOR_TEXT_BASE_PX, SimpleFit } from '../services/simpleFit';

const formatMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);

interface SimpleOrderModalProps {
  product: Product;
  fonts: FontOption[];
  pricing: PricingConfig;
  fontId: number;
  text: string;
  storeConfig: StoreConfig;
  onAddToCart: (item: OrderItem) => void;
  onOpenFullEditor: (draft:OrderItem) => void;
  onChangeFont: () => void;
  onClose: () => void;
}

/**
 * Ruta sencilla (intención del dueño, 10-nov): elegir fuente + escribir + verlo, sin editor.
 * Reutiliza EXACTAMENTE el render del personalizador (misma clase cssFamily, misma posición
 * por defecto frontDesign {x:50,y:40,scale:1,rotate:0}) para que lo que el cliente ve y acepta
 * sea lo que se guarda en el pedido. Sin composición inventada: sólo el texto tarifado.
 */
export const SimpleOrderModal: React.FC<SimpleOrderModalProps> = ({
  product, fonts, pricing, fontId, text, storeConfig, onAddToCart, onOpenFullEditor, onChangeFont, onClose
}) => {
  const dialogRef=useRef<HTMLDivElement>(null);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const focusable=()=>Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')??[]).sort((a,b)=>a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
    focusable()[0]?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();closeRef.current();return;}
      if(event.key!=='Tab')return;
      const items=focusable(),first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};
  },[]);
  const font = fonts.find(f => f.id === fontId);
  const [colorName, setColorName] = useState(product.colors?.[0]?.name || '');
  // El cliente puede traer su propio termo (petición del dueño 10-nov: "muchas veces ellos
  // traen su propio termo"). Misma semántica que el personalizador: isClientItem = servicio
  // de grabado sobre pieza del cliente, precio base $0 + grabado tarifado, sin stock ni color
  // de catálogo (el RPC ya lo valida así). No se inventan recargos.
  const [ownItem, setOwnItem] = useState(true);
  const [ownBrand, setOwnBrand] = useState('OTRO');
  const [ownColor, setOwnColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imageFailed,setImageFailed]=useState(false);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState<SimpleFit>({ scale: 1, tooLong: false });
  const [boxW, setBoxW] = useState(0);
  const [fontsTick, setFontsTick] = useState(0);

  // Re-medir cuando las fuentes web terminan de cargar: medir con la fuente de
  // respaldo calcula un ancho menor que el real y el ajuste quedaría corto.
  useEffect(() => {
    let live = true;
    const bump = () => live && setFontsTick(t => t + 1);
    document.fonts?.ready?.then(bump);
    const t1 = setTimeout(bump, 400);
    const t2 = setTimeout(bump, 1200);
    window.addEventListener('resize', bump);
    return () => { live = false; clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', bump); };
  }, []);

  // Ancho del cuadro de preview: sólo se usa para el TAMAÑO EN PANTALLA del texto
  // (proporcional a la imagen). NUNCA entra al cálculo del scale guardado: la misma
  // combinación texto+fuente produce el mismo pedido en 320px, 390px o escritorio.
  useLayoutEffect(() => {
    const box = previewBoxRef.current;
    if (!box) return;
    const update = () => setBoxW(box.clientWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Ajuste en unidades normalizadas del stage del editor (services/simpleFit.ts): se mide
  // el texto a 48px fijos (medición sin viewport) y el scale resultante se guarda tal cual
  // en frontDesignState.scale: lo que el cliente ve es lo que se ordena.
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || !text.trim()) { setFit({ scale: 1, tooLong: false }); return; }
    setFit(computeSimpleFit(el.getBoundingClientRect().width));
  }, [text, fontId, imgLoaded, fontsTick]);

  const colorObj = (product.colors || []).find(c => c.name === colorName);
  const image = productPreviewImage(product,colorName);
  useEffect(()=>{setImgLoaded(false);setImageFailed(false);},[image]);
  const inventoryUnconfirmed = !ownItem && (product.colors || []).length === 0;
  const stock = colorObj?.stock ?? 0;
  const isOutOfStock = !ownItem && !inventoryUnconfirmed && stock <= 0;
  const isUnavailable = inventoryUnconfirmed || isOutOfStock;

  // Misma llamada de precio que el editor y el RPC: genérico $350 con nombre incluido (017);
  // termo propio = $0 pieza + $100 grabado de nombre (tarifa base), sin obligar la compra.
  const unitPrice = useMemo(() => computeOrderPrice(product, {
    frontText: true, frontText2: false, frontLogos: 0,
    backText: false, backText2: false, backLogos: 0,
  }, pricing, ownItem), [product, pricing, ownItem]);

  const whatsapp = (storeConfig?.whatsapp || '').replace(/\D/g, '');
  const inquiryMessage = ownItem
    ? `Hola, quiero grabar mi termo con "${text}" y tengo una duda.`
    : `Hola, quiero pedir ${product.name} con "${text}" y tengo una duda.`;

  const createDraft = ():OrderItem => ({
      id: Date.now().toString(),
      productId: product.id,
      colorName: ownItem ? `${ownBrand}${ownColor.trim() ? ' ' + ownColor.trim() : ''}` : colorName,
      frontText: text,
      frontFontId: fontId,
      frontFontName: font?.name || 'Default',
      frontDesignState: { x: 50, y: 40, scale: Math.round(fit.scale * 100) / 100, rotate: 0 },
      frontLogos: [],
      backText: '',
      backFontId: fontId,
      backDesignState: { x: 50, y: 40, scale: 1, rotate: 0 },
      backLogos: [],
      isClientItem: ownItem,
      clientItemBrand: ownItem ? ownBrand : undefined,
      clientItemColor: ownItem ? ownColor.trim() : undefined,
      quantity,
      unitPrice:unitPrice??0,
      totalPrice: (unitPrice??0) * quantity,
      notes: '',
  });

  // A font load may finish after the customer edits, leaves, or receives a new catalogue.
  // Only the latest add for the still-visible inputs may commit.
  const addRevision=useRef(0);
  useEffect(()=>{addRevision.current++;return()=>{addRevision.current++;};},[product,fonts,pricing,fontId,text,colorName,ownItem,ownBrand,ownColor,quantity,fit.scale,fit.tooLong,onAddToCart]);
  const handleAdd = async () => {
    const attempt=++addRevision.current;
    const isCurrent=()=>attempt===addRevision.current;
    if(!productionFont(font)){alert('Esta tipografía no tiene un archivo confirmado del taller. Conserva tu diseño como borrador en el personalizador.');return;}
    try{await checkFontFile(font.fileData!);}catch{if(isCurrent())alert('No se pudo cargar la tipografía. No se agregó al pedido.');return;}
    if(!isCurrent())return;
    if (fit.tooLong) { alert('Ese texto es muy largo para el grabado. Escríbelo más corto o usa Personalizar a detalle.'); return; }
    if (!ownItem && inventoryUnconfirmed) { alert('La disponibilidad de este producto está por confirmar con el taller.'); return; }
    if (!ownItem && isOutOfStock) { alert('Lo sentimos, este color se encuentra agotado.'); return; }
    if (unitPrice === null) return;
    onAddToCart(createDraft());
  };

  return (
    <div className="lm-simple-order fixed inset-0 z-[180] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Pedido sencillo">
      <div ref={dialogRef} className="bg-white dark:bg-[#09090b] w-full max-w-md rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[92dvh] overflow-y-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-tight">{ownItem?'Grabado en tu termo':product.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition-colors" aria-label="Cerrar"><X size={16} /></button>
          </div>

          {/* Compra el termo o trae el suyo: el dueño acepta cada solicitud y muchos clientes traen pieza propia */}
          <div className="mb-3">
            <div className="flex gap-2">
              <button onClick={() => setOwnItem(true)} aria-pressed={ownItem} className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-black uppercase border transition-all ${ownItem ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}>Traigo mi termo</button>
              <button onClick={() => setOwnItem(false)} aria-pressed={!ownItem} className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-black uppercase border transition-all ${!ownItem ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}>Compro el termo</button>
            </div>
          </div>

          {/* Preview: mismo render que el personalizador (posición y clase de fuente idénticas) */}
          <div ref={previewBoxRef} className="lm-simple-preview relative aspect-[5/6] bg-zinc-50 dark:bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center mb-4">
            {productPreviewLabel(product,colorName)&&<span className="absolute bottom-2 left-2 right-2 z-20 text-[10px] bg-black/75 text-white p-1 rounded">{productPreviewLabel(product,colorName)}</span>}
            {!imgLoaded && !imageFailed && <Loader2 className="animate-spin text-zinc-400 w-6 h-6 absolute" />}
            {imageFailed?<p role="alert" className="p-4 text-center text-sm">Foto no disponible. Cierra la vista y vuelve a intentarlo.</p>:<img src={image} onLoad={() => setImgLoaded(true)} onError={()=>{setImageFailed(true);setImgLoaded(true);}} alt={productPreviewLabel(product,colorName)||product.name} style={{transform:`scale(${previewImageScale(product.illustrativeImage)})`}} className={`w-full h-full object-contain transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />}
            {/* Medición fija a 48px (base del editor): oculta, sin viewport, alimenta computeSimpleFit */}
            <span ref={measureRef} aria-hidden="true" className={`${font?.cssFamily || ''} whitespace-nowrap font-bold`} style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'none', fontSize: EDITOR_TEXT_BASE_PX }}>{text}</span>
            {/* Texto inválido NO se simula sobre la silueta: se muestra completo fuera del preview, en el aviso */}
            {!imageFailed && !fit.tooLong && boxW > 0 && text.trim() && (
              <div className="absolute" style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}>
                <span className={`${font?.cssFamily || ''} whitespace-nowrap font-bold text-zinc-900 dark:text-zinc-100`} style={{ fontSize: simplePreviewFontPx(boxW, fit.scale),display:'block',lineHeight:1,color:previewInk(productColorHex(product,colorName)), textShadow: '0 1px 2px rgba(255,255,255,.35)' }}>{text}</span>
              </div>
            )}
            {product.illustrativeImage && !productPreviewLabel(product,colorName) && (
              <span className="absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-widest bg-zinc-950/80 text-white px-2 py-1 rounded-md">Foto YETI de referencia</span>
            )}
          </div>

          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-zinc-500 flex items-center gap-1.5"><Type size={13} className="text-amber-500" /> Letra seleccionada</span>
            <button onClick={onChangeFont} className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 underline hover:text-black dark:hover:text-white">Cambiar fuente o texto</button>
          </div>

          {ownItem ? (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Tu termo</p>
              <div className="lm-simple-own-fields flex gap-2">
                <select value={ownBrand} onChange={(e) => setOwnBrand(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-[11px] font-bold uppercase outline-none focus:border-amber-500 dark:text-white" aria-label="Marca de tu termo">
                  <option value="YETI">YETI</option>
                  <option value="STANLEY">STANLEY</option>
                  <option value="HYDROFLASK">HYDROFLASK</option>
                  <option value="GENERICO">GENÉRICO</option>
                  <option value="OTRO">Sin especificar</option>
                </select>
                <input value={ownColor} onChange={(e) => setOwnColor(e.target.value)} placeholder="Color / detalle" className="min-w-0 flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-[11px] font-bold uppercase outline-none focus:border-amber-500 dark:text-white" aria-label="Color o descripción de tu termo" />
              </div>
            </div>
          ) : (product.colors || []).length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(c => (
                  <button key={c.id || c.name} onClick={() => setColorName(c.name)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${colorName === c.name ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}>{c.name}</button>
                ))}
              </div>
            </div>
          )}

          <div className="lm-simple-quantity flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Cantidad</p>
              <div className="flex items-center gap-2">
                <button aria-label="Reducir cantidad" disabled={quantity<=1} onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-11 h-11 rounded-full disabled:opacity-40 bg-zinc-100 dark:bg-zinc-800 font-black text-zinc-600 dark:text-zinc-300">-</button>
                <span className="font-black text-sm w-5 text-center text-zinc-900 dark:text-white">{quantity}</span>
                <button aria-label="Aumentar cantidad" disabled={quantity>=20} onClick={() => setQuantity(q => Math.min(20, q + 1))} className="w-11 h-11 rounded-full disabled:opacity-40 bg-zinc-100 dark:bg-zinc-800 font-black text-zinc-600 dark:text-zinc-300">+</button>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-xl text-zinc-900 dark:text-white">{unitPrice === null ? 'A cotizar' : formatMXN(unitPrice * quantity)}</p>
              {ownItem
                ? <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase">Sólo grabado sobre tu termo</p>
                : product.engravingIncluded && unitPrice !== null && <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase">Grabado de nombre incluido</p>}
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
            Sin cobro en línea. El taller confirma tu solicitud; pagas en el taller o por transferencia.
          </p>

          <div className="space-y-2">
            {fit.tooLong && (
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 text-center break-words">"{text}" no cabe en el área de grabado: escríbelo más corto o personaliza a detalle.</p>
            )}
            <button onClick={handleAdd} disabled={isUnavailable || unitPrice === null || fit.tooLong || imageFailed} className={`w-full font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${isUnavailable || unitPrice === null || fit.tooLong || imageFailed ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300 text-black'}`}>
              <Zap size={16} /> {imageFailed?'Vista previa no disponible':fit.tooLong ? 'Texto muy largo' : inventoryUnconfirmed ? 'Disponibilidad por confirmar' : isOutOfStock ? 'Agotado' : 'Agregar al pedido'}
            </button>
            <button onClick={()=>onOpenFullEditor(createDraft())} className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px] font-black uppercase text-zinc-600 dark:text-zinc-300 hover:border-amber-500 transition-all flex items-center justify-center gap-2">
              <PenTool size={13} /> Personalizar a detalle (opcional)
            </button>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(inquiryMessage)}`} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2">
                <MessageCircle size={13} /> ¿Dudas? Escríbenos por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import {DesktopFrostBackground} from './DesktopFrostBackground';
import{catalogFontId}from'../utils/fontId';
import{useModalFocus}from'../utils/useModalFocus';
import{productionFont,checkFontFile}from'../utils/fontProvenance';
import{TechnicalPreview}from'./TechnicalPreview';
import {alphaBounds} from '../utils/alphaBounds';
import {rightAngleRotation,rightAngleDesign,rightAngleLogos} from '../utils/rightAngleRotation';
import {REFERENCE_COLORS,productPreviewImage,productColorHex,referencePhotoColor,productPreviewLabel} from '../utils/productColorPreview';
import {EngravingText} from './EngravingText';
import {previewImageScale,previewInk} from '../utils/designPreview';
import {listDesigns,saveDesign,restoreDesign,deleteDesign,SavedDesign} from '../services/designHistory';
import { computeOrderPrice } from '../services/orderPricing';
import {useUserCloudState} from '../services/useUserCloudState';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { removeBackground } from '../utils/imageUtils';
import { 
  ArrowLeft, Type, Image as ImageIcon, RotateCcw, 
  Check, X, ChevronRight, ChevronLeft, Trash2, Wand2, Loader2,
  Maximize, RefreshCw,
  ChevronUp, ChevronDown, Upload, Settings, TextCursor, Images, Package, Camera, Aperture, AlertOctagon, Save, Zap, Scissors,
  LayoutTemplate, Heart, ZoomIn, ZoomOut, Crown, MoreHorizontal
} from 'lucide-react';
import { Product, FontOption, PricingConfig, OrderItem, DesignState, LogoItem, ColorPreset, FontCategory, BrandingAsset, StoreConfig } from '../types';
import { VintageRollInput } from './VintageRollInput';
import { ImageGallery } from './ImageGallery';
import { DesignTemplates } from './DesignTemplates';
import { MonogramLibrary } from './MonogramLibrary';
import PhotoFrameEditor from './PhotoFrameEditor';

interface ProductVisualizerProps {
  product: Product;
  historyOwner?: string;
  desktopBackground?:number;
  onDesktopBackground?:(value:number)=>void;
  historyEnabled?: boolean;
  products?: Product[]; 
  fonts: FontOption[];
  pricing: PricingConfig;
  availableColors: ColorPreset[];
  initialFontId?: number;
  initialState?: OrderItem | null;
  galleryAssets: BrandingAsset[]; 
  onBack: (draft?: OrderItem) => void;
  onSave: (config: any, goToCart: boolean) => void;
  onGoToCart: (draft?: OrderItem) => void;
  onSwitchProduct: (product: Product, draft?:OrderItem) => void;
  isDarkMode: boolean;
  storeConfig: StoreConfig;
}

type ActiveTool = 'TEXT1' | 'TEXT2' | 'IMAGES' | 'MAGIC' | 'LAYERS' | 'SETTINGS' | null;

const STAGE_WIDTH = 500;
const STAGE_HEIGHT = 600;

export const ProductVisualizer: React.FC<ProductVisualizerProps> = ({
  product,desktopBackground,onDesktopBackground, historyOwner='standalone', historyEnabled=true, products = [], fonts, pricing, availableColors, initialFontId, initialState, galleryAssets, onBack, onSave, onGoToCart, onSwitchProduct, isDarkMode, storeConfig
}) => {
  // --- STATE ---
  const [savedDesigns,setSavedDesigns]=useState<SavedDesign[]>([]);
  const [historyStatus,setHistoryStatus]=useState('');
  const [canvasWarning,setCanvasWarning]=useState('');
  const [historyBusy,setHistoryBusy]=useState(false);
  const historyEpoch=useRef(0),historyOperation=useRef(0);
  useEffect(()=>{
    const epoch=++historyEpoch.current,operation=++historyOperation.current;
    setSavedDesigns([]);setHistoryStatus('');setHistoryBusy(false);setStripNote('');
    if(historyEnabled)listDesigns().then(rows=>{if(epoch===historyEpoch.current&&operation===historyOperation.current)setSavedDesigns(rows);}).catch(()=>{if(epoch===historyEpoch.current&&operation===historyOperation.current)setHistoryStatus('Inicia sesión para tu historial privado');});
    return()=>{historyEpoch.current++;historyOperation.current++;};
  },[historyOwner,historyEnabled,product,fonts]);
  const beginHistory=()=>{
    const epoch=historyEpoch.current,operation=++historyOperation.current;
    return()=>historyEnabled&&epoch===historyEpoch.current&&operation===historyOperation.current;
  };
  const [selectedColor, setSelectedColor] = useState(initialState?.colorName || product.colors[0]?.name || (product.illustrativeImage?'NEGRO':''));
  const [view, setView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [quantity, setQuantity] = useState(initialState?.quantity || 1);
  const [isClientItem, setIsClientItem] = useState(initialState?.isClientItem || false);
  const [stripNote, setStripNote] = useState('');
  const [showTariffDetails, setShowTariffDetails] = useState(false);
  const [showProductDetails,setShowProductDetails]=useState(false);
  const reviewPanelRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!showProductDetails)return;
    const previous=document.activeElement as HTMLElement|null;
    const panel=reviewPanelRef.current;
    const focusable=():HTMLElement[]=>panel?[...panel.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')] as HTMLElement[]:[];
    focusable()[0]?.focus();
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setShowProductDetails(false);}if(e.key==='Tab'){const items=focusable(),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);previous?.focus();};
  },[showProductDetails]);
  
  const [clientItemBrand, setClientItemBrand] = useState(initialState?.clientItemBrand || 'OTRO');
  const [clientItemColor, setClientItemColor] = useState(initialState?.clientItemColor || '');
  const [userUploadedImage, setUserUploadedImage] = useState<string | null>(initialState?.customBackgroundImage || null);
  const [originalUserPhoto, setOriginalUserPhoto] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [logoFromProductPhoto,setLogoFromProductPhoto]=useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [favorites,setFavorites,favoritesStatus] = useUserCloudState<(DesignState & {id:string})[]>('favorites',[]);
    const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  // No generative provider is configured. Local white/black filters remain available.
  const formatMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);
const SHOW_AI_BG_REMOVAL = false;
  // --- AI BACKGROUND REMOVAL ---
  const handleRemoveBackground = async () => {
      if (!selectedLogoId) return;
      setIsRemovingBackground(true);
      try {
          const logo = (view === 'FRONT' ? frontLogos : backLogos).find(l => l.id === selectedLogoId);
          if (!logo) return;
          const newUrl = await removeBackground(logo.url);
          const list = view === 'FRONT' ? frontLogos : backLogos;
          const setList = view === 'FRONT' ? setFrontLogos : setBackLogos;
          setList(list.map(l => l.id === selectedLogoId ? { ...l, url: newUrl } : l));
      } catch (error) {
          console.error("Background removal failed:", error);
          alert(error instanceof Error && error.message ? error.message : "No se pudo remover el fondo. La imagen original se conserva.");
      } finally {
          setIsRemovingBackground(false);
      }
  };
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const defaultFontId = fonts.find(productionFont)?.id??999; 

  // Front Data
  const [frontText, setFrontText] = useState(initialState?.frontText || '');
  const [frontText2, setFrontText2] = useState(initialState?.frontText2 || '');
  const [frontFontId, setFrontFontId] = useState(catalogFontId(fonts,initialState?.frontFontId ?? initialFontId,defaultFontId));
  const [frontFontId2, setFrontFontId2] = useState(catalogFontId(fonts,initialState?.frontFontId2,defaultFontId));
  const [frontDesign, setFrontDesign] = useState<DesignState>(rightAngleDesign(initialState?.frontDesignState || { x: 50, y: 40, scale: 1, rotate: 0 }));
  const [frontDesign2, setFrontDesign2] = useState<DesignState>(rightAngleDesign(initialState?.frontDesignState2 || { x: 50, y: 60, scale: 1, rotate: 0 }));
  const [frontLogos, setFrontLogos] = useState<LogoItem[]>(rightAngleLogos(initialState?.frontLogos || []));

  // Back Data
  const [backText, setBackText] = useState(initialState?.backText || '');
  const [backText2, setBackText2] = useState(initialState?.backText2 || '');
  const [backFontId, setBackFontId] = useState(catalogFontId(fonts,initialState?.backFontId,defaultFontId));
  const [backFontId2, setBackFontId2] = useState(catalogFontId(fonts,initialState?.backFontId2,defaultFontId));
  const [backDesign, setBackDesign] = useState<DesignState>(rightAngleDesign(initialState?.backDesignState || { x: 50, y: 40, scale: 1, rotate: 0 }));
  const [backDesign2, setBackDesign2] = useState<DesignState>(rightAngleDesign(initialState?.backDesignState2 || { x: 50, y: 60, scale: 1, rotate: 0 }));
  const [backLogos, setBackLogos] = useState<LogoItem[]>(rightAngleLogos(initialState?.backLogos || []));

  // Control State
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [moreToolsOpen,setMoreToolsOpen]=useState(false);
  const moreToolsRef=useRef<HTMLDivElement>(null);
  const activeToolPanelRef=useRef<HTMLDivElement>(null);
  useModalFocus(!!activeTool,activeToolPanelRef,()=>setActiveTool(null));
  const moreToolsTrigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!moreToolsOpen)return;
    moreToolsRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setMoreToolsOpen(false);moreToolsTrigger.current?.focus();}};
    const outside=(event:PointerEvent)=>{if(!(event.target instanceof Node))return;if(!moreToolsRef.current?.contains(event.target)&&!moreToolsTrigger.current?.contains(event.target))setMoreToolsOpen(false);};
    document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);
    return()=>{document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);};
  },[moreToolsOpen]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
    const [showMonograms, setShowMonograms] = useState(false);
  
  const monogramDialog=useRef<HTMLDivElement>(null),photoDialog=useRef<HTMLDivElement>(null),cameraDialog=useRef<HTMLDivElement>(null),fontDialog=useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const productPhotoInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoOptions,setShowPhotoOptions]=useState(false);
  const [showLiveCamera,setShowLiveCamera]=useState(false);
  const [cameraStarting,setCameraStarting]=useState(false);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const liveStreamRef = useRef<MediaStream|null>(null);
  const cameraRequest=useRef(0);
  useEffect(()=>()=>{cameraRequest.current++;liveStreamRef.current?.getTracks().forEach(t=>t.stop());liveStreamRef.current=null;},[]);
  const [photoError,setPhotoError]=useState('');
  const [hapticsEnabled,setHapticsEnabled]=useState(true);
  const editorOpenedAt=useRef(0);
  const tapMemory=useRef({id:'',at:0});
  const gesture=useRef<{id:string,x:number,y:number,moved:boolean,timer?:ReturnType<typeof setTimeout>}|null>(null);
  const hapticsSupported=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
  const haptic=()=>{if(hapticsEnabled&&hapticsSupported){try{navigator.vibrate(40);}catch{}}};
  const editElement=(id:string)=>{setInteraction(null);editorOpenedAt.current=Date.now();setSelectedElementId(id);setActiveTool(id==='text1'?'TEXT1':id==='text2'?'TEXT2':'MAGIC');haptic();};
  useEffect(()=>{if(activeTool==='TEXT1'||activeTool==='TEXT2'){const input=document.querySelector<HTMLInputElement>('.lm-toolsheet input[placeholder="Escribe..."]');input?.focus();}},[activeTool]);
  useEffect(()=>()=>{if(gesture.current?.timer)clearTimeout(gesture.current.timer);},[]);
  const endElementGesture=(e:React.PointerEvent,id:string)=>{
    const g=gesture.current;if(g?.timer)clearTimeout(g.timer);
    if(g&&!g.moved&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<10){const now=Date.now();if(tapMemory.current.id===id&&now-tapMemory.current.at<340){tapMemory.current={id:'',at:0};editElement(id);}else{tapMemory.current={id,at:now};haptic();}}
    setInteraction(null);
    gesture.current=null;
  };

  const colorContainerRef = useRef<HTMLDivElement>(null);
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);
  const [stageScale, setStageScale] = useState(1);

  // --- FONT MODAL STATE ---
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [fontModalTarget, setFontModalTarget] = useState<'text1' | 'text2'>('text1');
  const [fontCategory, setFontCategory] = useState<FontCategory | 'TODAS'>('TODAS');

  // --- INTERACTION STATE ---
  const [interaction, setInteraction] = useState<{
      type: 'MOVE' | 'ROTATE' | 'SCALE',
      startX: number,
      startY: number,
      initialState: DesignState
  } | null>(null);

  // Navigation Logic
  const handlePrevProduct = () => {
    if (!products || products.length === 0) return;
    const idx = products.findIndex(p => p.id === product.id);
    const prev = idx > 0 ? products[idx - 1] : products[products.length - 1];
    if (prev) onSwitchProduct(prev,navigationDraft());
  };

  const handleNextProduct = () => {
    if (!products || products.length === 0) return;
    const idx = products.findIndex(p => p.id === product.id);
    const next = idx < products.length - 1 ? products[idx + 1] : products[0];
    if (next) onSwitchProduct(next,navigationDraft());
  };

  const viewportRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const viewport=window.visualViewport;
    const sync=()=>{if(viewportRef.current&&(window.innerWidth<768||(window.innerWidth<1024&&window.innerHeight<520))){viewportRef.current.style.setProperty('--lm-viewport-height',`${viewport?.height??window.innerHeight}px`);viewportRef.current.style.setProperty('--lm-viewport-top',`${viewport?.offsetTop??0}px`);}};
    sync();viewport?.addEventListener('resize',sync);viewport?.addEventListener('scroll',sync);window.addEventListener('resize',sync);
    return()=>{viewport?.removeEventListener('resize',sync);viewport?.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);};
  },[]);
  useEffect(()=>{setSelectedElementId(null);setActiveTool(null);},[view]);
  // --- SCALE LOGIC ---
  useEffect(() => {
      const updateScale = () => {
          if (!containerWrapperRef.current) return;
          const { clientWidth,clientHeight } = containerWrapperRef.current;
          if (clientWidth === 0) return;
          const scaleW = Math.min(clientWidth / STAGE_WIDTH,clientHeight / STAGE_HEIGHT);
          setStageScale(scaleW); 
      };
      
      updateScale();
      const resizeObserver = new ResizeObserver(() => updateScale());
      if (containerWrapperRef.current) resizeObserver.observe(containerWrapperRef.current);
      window.addEventListener('resize', updateScale);
      return () => {
          window.removeEventListener('resize', updateScale);
          resizeObserver.disconnect();
      };
  }, []);

  // --- IMAGE LOADING ---
  const currentColorObj = product.colors.find(c => c.name === selectedColor);
  const currentImage = productPreviewImage(product,selectedColor,userUploadedImage);
  const showColors = !userUploadedImage;
  const currentStock = currentColorObj?.stock || 0;
  // colors vacío = inventario aún no confirmado por el taller: no es un conteo físico en cero
  const inventoryUnconfirmed = !isClientItem && (product.colors || []).length === 0;
  const isOutOfStock = !isClientItem && !inventoryUnconfirmed && currentStock <= 0;
  const isUnavailable = isOutOfStock || inventoryUnconfirmed;

  useEffect(() => {
      setIsImageLoaded(false);
      if (mainImageRef.current && mainImageRef.current.complete) setIsImageLoaded(true);
  }, [currentImage]);

  const colorOptions = useMemo(() => {
      const source = isClientItem ? (availableColors?.length?availableColors:REFERENCE_COLORS) : (product.colors.length?product.colors:REFERENCE_COLORS);
      return source.filter((c, index, self) => index === self.findIndex((t) => t.name === c.name));
  }, [isClientItem, availableColors, product.colors]);

  const clientItemLabel = isClientItem ? 'Producto Propio' : 'Producto Catálogo';

  // Tono de grabado según el color del producto: marca clara sobre recubrimiento oscuro, oscura sobre claro
  const engravingTone = previewInk(userUploadedImage?colorOptions.find(c=>c.name===selectedColor)?.hex:productColorHex(product,selectedColor));
  const referenceColor=!userUploadedImage&&!isClientItem?referencePhotoColor(product,selectedColor):undefined;

  // null = combinación sin tarifa publicada: se cotiza, no se cobra un inventado
  const calculatePrice = (): number | null => computeOrderPrice(product, {
      frontText: !!frontText, frontText2: !!frontText2, frontLogos: frontLogos.length,
      backText: !!backText, backText2: !!backText2, backLogos: backLogos.length,
  }, pricing, isClientItem);

  const getDesignState = (id: string) => {
      if (id === 'text1') return view === 'FRONT' ? frontDesign : backDesign;
      if (id === 'text2') return view === 'FRONT' ? frontDesign2 : backDesign2;
      return (view === 'FRONT' ? frontLogos : backLogos).find(l => l.id === id)?.state || { x: 50, y: 50, scale: 1, rotate: 0 };
  };

  const setDesignState = (id: string, newState: DesignState) => {
      newState=rightAngleDesign(newState);
      if (id === 'text1') {
          if (view === 'FRONT') setFrontDesign(newState); else setBackDesign(newState);
      } else if (id === 'text2') {
          if (view === 'FRONT') setFrontDesign2(newState); else setBackDesign2(newState);
      } else {
          const list = view === 'FRONT' ? frontLogos : backLogos;
          const setList = view === 'FRONT' ? setFrontLogos : setBackLogos;
          setList(list.map(l => l.id === id ? { ...l, state: newState } : l));
      }
  };

  // --- POINTER EVENTS FOR DRAG/DROP ---
  useEffect(() => {
      const handlePointerMove = (e: PointerEvent) => {
          if (!interaction || !selectedElementId) return;
          if(gesture.current&&Math.hypot(e.clientX-gesture.current.x,e.clientY-gesture.current.y)>9){gesture.current.moved=true;if(gesture.current.timer)clearTimeout(gesture.current.timer);}
          e.preventDefault();

          const rect = document.getElementById('virtual-stage')?.getBoundingClientRect();
          if(!rect) return;

          const currentX = e.clientX - rect.left;
          const currentY = e.clientY - rect.top;
          
          const currentXPct = (currentX / rect.width) * 100;
          const currentYPct = (currentY / rect.height) * 100;

          if (interaction.type === 'MOVE') {
              const startXPct = ((interaction.startX - rect.left) / rect.width) * 100;
              const startYPct = ((interaction.startY - rect.top) / rect.height) * 100;
              const deltaX = currentXPct - startXPct;
              const deltaY = currentYPct - startYPct;
              setDesignState(selectedElementId, {
                  ...interaction.initialState,
                  x: Math.min(100, Math.max(0, interaction.initialState.x + deltaX)),
                  y: Math.min(100, Math.max(0, interaction.initialState.y + deltaY))
              });
          } else if (interaction.type === 'ROTATE') {
              const centerX = (interaction.initialState.x / 100) * rect.width;
              const centerY = (interaction.initialState.y / 100) * rect.height;
              const startAngle = Math.atan2(interaction.startY - rect.top - centerY, interaction.startX - rect.left - centerX);
              const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);
              const rotationDelta = (currentAngle - startAngle) * (180 / Math.PI);
              const newRotate = rightAngleRotation(interaction.initialState.rotate + rotationDelta);
              setDesignState(selectedElementId, { ...interaction.initialState, rotate: newRotate });
          } else if (interaction.type === 'SCALE') {
              const centerX = (interaction.initialState.x / 100) * rect.width;
              const centerY = (interaction.initialState.y / 100) * rect.height;
              const startDist = Math.hypot(interaction.startX - rect.left - centerX, interaction.startY - rect.top - centerY);
              const currentDist = Math.hypot(currentX - centerX, currentY - centerY);
              const scaleFactor = startDist > 0 ? currentDist / startDist : 1;
              const newScale = Math.max(0.2, Math.min(5, interaction.initialState.scale * scaleFactor));
              setDesignState(selectedElementId, { ...interaction.initialState, scale: newScale });
          }
      };
      const handlePointerUp = () => { setInteraction(null); };
      if (interaction) {
          window.addEventListener('pointermove', handlePointerMove);
          window.addEventListener('pointerup', handlePointerUp);
          window.addEventListener('pointercancel', handlePointerUp);
      }
      return () => {
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          window.removeEventListener('pointercancel', handlePointerUp);
      };
  }, [interaction, selectedElementId, view]);

  const startInteraction = (e: React.PointerEvent, type: 'MOVE' | 'ROTATE' | 'SCALE', id: string) => {
      e.stopPropagation(); e.preventDefault();
      if(gesture.current?.timer)clearTimeout(gesture.current.timer);
      if(type==='MOVE')gesture.current={id,x:e.clientX,y:e.clientY,moved:false,timer:setTimeout(()=>{if(gesture.current&&!gesture.current.moved){gesture.current.moved=true;setInteraction(null);editElement(id);}},550)};
      setSelectedElementId(id);
      if (window.innerWidth >= 768 && window.innerHeight >= 520) {
          if (id.includes('text')) setActiveTool(id === 'text1' ? 'TEXT1' : 'TEXT2');
      }
      setInteraction({ type, startX: e.clientX, startY: e.clientY, initialState: getDesignState(id) });
  };

  // --- PREPARACION AUTOMATICA AL CARGAR: quita fondo liso por inundacion
  // desde el borde y muestra el diseno en tono aluminio. Conserva originalUrl; "Restaurar Original" lo recupera.
  const ALU_COLOR = { r: 198, g: 198, b: 206 };
  const applyAluminumTone = (d: Uint8ClampedArray, n: number, bgMode: 'white' | 'black' | null) => {
      let dark = 0, total = 0;
      for (let p = 0; p < n; p++) {
          if (d[p * 4 + 3] >= 128) {
              total++;
              if ((d[p * 4] + d[p * 4 + 1] + d[p * 4 + 2]) / 3 < 150) dark++;
          }
      }
      if (!total) return;
      const fDark = dark / total;
      // placa dominante con contraste interior -> grabar solo el contraste (opcion B de Julian);
      // una sola clase -> grabar todo; sin dominante -> grabar lo que contrasta con el fondo quitado
      let mode: 'all' | 'dark' | 'light';
      if (fDark > 0.97 || fDark < 0.03) mode = 'all';
      else if (fDark >= 0.7) mode = 'light';
      else if (fDark <= 0.3) mode = 'dark';
      else mode = bgMode === 'black' ? 'light' : 'dark';
      for (let p = 0; p < n; p++) {
          if (d[p * 4 + 3] < 128) continue;
          const lum = (d[p * 4] + d[p * 4 + 1] + d[p * 4 + 2]) / 3;
          const engrave = mode === 'all' || (mode === 'dark' && lum < 150) || (mode === 'light' && lum >= 150);
          if (engrave) {
              d[p * 4] = ALU_COLOR.r; d[p * 4 + 1] = ALU_COLOR.g; d[p * 4 + 2] = ALU_COLOR.b;
          } else {
              d[p * 4 + 3] = 0;
          }
      }
  };
  const autoPrepareEngraving = async (dataUrl: string): Promise<{ url: string; note: 'ok' | 'sin-cambio' }> => {
      try {
          const img = new Image();
          img.src = dataUrl;
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
          const MAX = 1600;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return { url: dataUrl, note: 'sin-cambio' };
          ctx.drawImage(img, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const d = imageData.data;
          const n = w * h;
          const borderIdx: number[] = [];
          for (let x = 0; x < w; x++) { borderIdx.push(x, (h - 1) * w + x); }
          for (let y = 1; y < h - 1; y++) { borderIdx.push(y * w, y * w + w - 1); }
          let borderOpaque = 0, borderLumSum = 0;
          for (const p of borderIdx) {
              const a = d[p * 4 + 3];
              if (a >= 128) { borderOpaque++; borderLumSum += (d[p * 4] + d[p * 4 + 1] + d[p * 4 + 2]) / 3; }
          }
          if (borderOpaque < borderIdx.length * 0.5) {
              // ya viene sin fondo: solo pasar los trazos a tono aluminio
              applyAluminumTone(d, n, null);
              ctx.putImageData(imageData, 0, 0);
              return { url: canvas.toDataURL(), note: 'ok' };
          }
          const borderMean = borderLumSum / Math.max(1, borderOpaque);
          let bgMode: 'white' | 'black' | null = null;
          if (borderMean > 200) bgMode = 'white'; else if (borderMean < 50) bgMode = 'black';
          if (!bgMode) return { url: dataUrl, note: 'sin-cambio' };
          const cand = new Uint8Array(n);
          for (let p = 0; p < n; p++) {
              if (d[p * 4 + 3] < 128) continue;
              const r = d[p * 4], g = d[p * 4 + 1], b = d[p * 4 + 2];
              if (bgMode === 'white' ? (r > 200 && g > 200 && b > 200) : (r < 50 && g < 50 && b < 50)) cand[p] = 1;
          }
          const killed = new Uint8Array(n);
          const queue = new Int32Array(n);
          let qh = 0, qt = 0;
          for (const p of borderIdx) { if (cand[p] && !killed[p]) { killed[p] = 1; queue[qt++] = p; } }
          while (qh < qt) {
              const p = queue[qh++];
              const px = p % w;
              const neighbors = [p - w, p + w];
              if (px > 0) neighbors.push(p - 1);
              if (px < w - 1) neighbors.push(p + 1);
              for (const q of neighbors) {
                  if (q >= 0 && q < n && cand[q] && !killed[q]) { killed[q] = 1; queue[qt++] = q; }
              }
          }
          let remain = 0;
          for (let p = 0; p < n; p++) { if (d[p * 4 + 3] >= 128 && !killed[p]) remain++; }
          // guarda: si quedaria vacio, conservar la imagen original
          if (remain < n * 0.0005) return { url: dataUrl, note: 'sin-cambio' };
          for (let p = 0; p < n; p++) { if (killed[p]) d[p * 4 + 3] = 0; }
          applyAluminumTone(d, n, bgMode);
          ctx.putImageData(imageData, 0, 0);
          const bounds=alphaBounds(d,w,h);
          if(bounds){const tight=document.createElement('canvas');tight.width=bounds.width;tight.height=bounds.height;const output=tight.getContext('2d');if(output){output.drawImage(canvas,bounds.x,bounds.y,bounds.width,bounds.height,0,0,bounds.width,bounds.height);return {url:tight.toDataURL('image/png'),note:'ok'};}}
          return { url: canvas.toDataURL(), note: 'ok' };
      } catch (err) {
          console.error('autoPrepareEngraving fallo, se conserva la imagen original:', err);
          return { url: dataUrl, note: 'sin-cambio' };
      }
  };

  // --- ASSET HANDLING ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(!file.type.startsWith('image/')||file.size>5_000_000){setStripNote('Usa una imagen de hasta 5 MB.');e.target.value='';return;}
      const reader = new FileReader();
      reader.onload = (ev) => {
          setPendingLogo(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          if(!file.type.startsWith('image/')){setPhotoError('Elige una imagen válida.');return;}
          if(file.size>20*1024*1024){setPhotoError('La foto supera 20 MB. Elige una más pequeña.');return;}
          reader.onload = (ev) => {setPendingPhoto(ev.target?.result as string);setShowPhotoOptions(false);setPhotoError('');haptic();};
          reader.onerror=()=>setPhotoError('No se pudo leer la foto. Vuelve a elegirla.');
          reader.readAsDataURL(file);
          e.target.value='';
      }
  };

  const triggerCamera = () => {setPhotoError('');setShowPhotoOptions(true);};

  const stopLiveCamera = () => {cameraRequest.current++;liveStreamRef.current?.getTracks().forEach(t=>t.stop());liveStreamRef.current=null;setShowLiveCamera(false);setCameraStarting(false);};
  useModalFocus(showMonograms,monogramDialog,()=>setShowMonograms(false));
  useModalFocus(showPhotoOptions&&!showLiveCamera,photoDialog,()=>setShowPhotoOptions(false));
  useModalFocus(showLiveCamera,cameraDialog,stopLiveCamera);
  useModalFocus(isFontModalOpen,fontDialog,()=>setIsFontModalOpen(false));
  const openLiveCamera = async () => {
      setPhotoError('');
      if(!navigator.mediaDevices?.getUserMedia){cameraInputRef.current?.click();return;}
      const request=++cameraRequest.current;
      setShowLiveCamera(true);setCameraStarting(true);
      try{
          const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
          if(request!==cameraRequest.current){stream.getTracks().forEach(t=>t.stop());return;}
          liveStreamRef.current = stream;
          if(liveVideoRef.current){liveVideoRef.current.srcObject=stream;try{await liveVideoRef.current.play();}catch{}}
      }catch{
          if(request!==cameraRequest.current)return;
          stopLiveCamera();
          setPhotoError('No se pudo abrir la cámara. Revisa el permiso del navegador o usa Elegir foto del teléfono.');
      }
      setCameraStarting(false);
  };
  const captureLivePhoto = () => {
      const v=liveVideoRef.current;
      if(!v||!v.videoWidth){setPhotoError('La cámara aún no está lista. Espera un momento.');return;}
      const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
      const ctx=c.getContext('2d');if(!ctx){setPhotoError('No se pudo capturar la foto.');return;}
      ctx.drawImage(v,0,0);
      const data=c.toDataURL('image/jpeg',0.9);
      setPendingPhoto(data);stopLiveCamera();setShowPhotoOptions(false);setPhotoError('');haptic();
  };

  const addPreparedLogo = async (img: string, original: string=img) => {
      const id = Date.now().toString();
      setIsProcessing(true);
      const prepared = await autoPrepareEngraving(img);
      setIsProcessing(false);
      if (prepared.note === 'sin-cambio') {
          alert('No se detecto un fondo liso para quitar; tu imagen se conserva como la subiste.');
      }
      const newLogo: LogoItem = {
          id: id,
          url: prepared.url,
          originalUrl: original,
          state: { x: 50, y: 50, scale: 0.6, rotate: 0 }
      };
      if (view === 'FRONT') setFrontLogos(prev => [...prev, newLogo]);
      else setBackLogos(prev => [...prev, newLogo]);
      setSelectedElementId(newLogo.id);
      setActiveTool(null);
  };

  const addLogoToCanvas = (url: string) => {
      const id = Date.now().toString();
      const newLogo: LogoItem = { 
          id: id, 
          url: url, 
          originalUrl: url, 
          state: { x: 50, y: 50, scale: 0.6, rotate: 0 } 
      };
      if (view === 'FRONT') setFrontLogos(prev => [...prev, newLogo]); 
      else setBackLogos(prev => [...prev, newLogo]);
      
      setSelectedElementId(newLogo.id);
      setActiveTool(null); 
  };

  const deleteLogo = (id: string) => {
      if(view === 'FRONT') setFrontLogos(frontLogos.filter(l => l.id !== id)); else setBackLogos(backLogos.filter(l => l.id !== id));
      if(selectedElementId === id) setSelectedElementId(null);
  };

  // --- IMAGE PROCESSING FUNCTIONS ---
  const processImage = async (logoId: string, filterType: 'REMOVE_WHITE' | 'REMOVE_BLACK' | 'MAKE_WHITE_REMOVE_BLACK') => {
      const list = view === 'FRONT' ? frontLogos : backLogos;
      const logo = list.find(l => l.id === logoId);
      if (!logo) return;

      setIsProcessing(true);

      try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = logo.originalUrl || logo.url; 
          
          await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error("No context");

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              if (filterType === 'REMOVE_WHITE') {
                  if (r > 200 && g > 200 && b > 200) data[i + 3] = 0;
              } else if (filterType === 'REMOVE_BLACK') {
                  if (r < 50 && g < 50 && b < 50) data[i + 3] = 0;
              } else if (filterType === 'MAKE_WHITE_REMOVE_BLACK') {
                  if (r < 50 && g < 50 && b < 50) {
                      data[i + 3] = 0;
                  } else {
                      data[i] = 255;
                      data[i + 1] = 255;
                      data[i + 2] = 255;
                  }
              }
          }
          
          ctx.putImageData(imageData, 0, 0);
          const newUrl = canvas.toDataURL();
          
          const update = (prev: LogoItem[]) => prev.map(l => l.id === logoId ? { ...l, url: newUrl } : l);
          if (view === 'FRONT') setFrontLogos(update); else setBackLogos(update);

      } catch (err) {
          console.error(err);
      } finally {
          setIsProcessing(false);
      }
  };

  const resetImage = (logoId: string) => {
      const update = (prev: LogoItem[]) => prev.map(l => l.id === logoId ? { ...l, url: l.originalUrl || l.url } : l);
      if (view === 'FRONT') setFrontLogos(update); else setBackLogos(update);
  };

  useEffect(()=>{setCanvasWarning('');setStripNote('');},[frontText,frontText2,backText,backText2,frontDesign,frontDesign2,backDesign,backDesign2,frontLogos,backLogos,frontFontId,frontFontId2,backFontId,backFontId2]);

  const textFonts=[[frontText,frontFontId],[frontText2,frontFontId2],[backText,backFontId],[backText2,backFontId2]] as const;
  const missingTextFont=textFonts.some(([text,id])=>text.trim()&&!productionFont(fonts.find(f=>f.id===id)));
  // Retire pending font checks when their design, catalogue, callback or route is replaced.
  const addRevision=useRef(0);
  useEffect(()=>{addRevision.current++;return()=>{addRevision.current++;};},[product,fonts,pricing,onSave,selectedColor,frontText,frontText2,frontFontId,frontFontId2,frontDesign,frontDesign2,frontLogos,backText,backText2,backFontId,backFontId2,backDesign,backDesign2,backLogos,quantity,isClientItem,clientItemBrand,clientItemColor,userUploadedImage]);
  // Navigation only: keep unsaved work in the parent, without a cloud write.
  const navigationOwner=useRef(historyOwner);
  const navigationDraft=():OrderItem|undefined=>navigationOwner.current!==historyOwner?undefined:({
    ...initialState,id:initialState?.id||'',productId:product.id,colorName:selectedColor,
    frontText,frontText2,frontFontId,frontFontId2,frontFontName:fonts.find(f=>f.id===frontFontId)?.name||'',frontDesignState:frontDesign,frontDesignState2:frontDesign2,frontLogos,
    backText,backText2,backFontId,backFontId2,backFontName:fonts.find(f=>f.id===backFontId)?.name||'',backDesignState:backDesign,backDesignState2:backDesign2,backLogos,
    quantity,unitPrice:calculatePrice()??0,totalPrice:(calculatePrice()??0)*quantity,
    notes:initialState?.notes||'',isClientItem,clientItemBrand,clientItemColor,customBackgroundImage:userUploadedImage
  });
  const handleSaveClick = async (goToCart: boolean) => {
      const attempt=++addRevision.current;
      const isCurrent=()=>attempt===addRevision.current;
      if(missingTextFont){setStripNote('Tipografía sin archivo del taller. Puedes guardar este diseño como borrador; no se agrega al pedido.');return;}
      try{for(const id of new Set(textFonts.filter(([t])=>t.trim()).map(([,id])=>id)))await checkFontFile(fonts.find(f=>f.id===id)!.fileData!);}catch{if(isCurrent())setCanvasWarning('La tipografía no pudo cargarse. Conserva el diseño como borrador; no se agregó al pedido.');return;}
      if(!isCurrent())return;
      if (inventoryUnconfirmed) { alert("La disponibilidad de este producto está por confirmar con el taller."); return; }
      if (isOutOfStock) { alert("Lo sentimos, este color se encuentra agotado."); return; }
      const overflowSides:string[]=[];
      for(const probe of document.querySelectorAll<HTMLElement>('[data-bounds-stage]')) {
          const area=probe.getBoundingClientRect();
          if([...probe.querySelectorAll<HTMLElement>('[data-bounds-item]')].some(el=>{const b=el.getBoundingClientRect();return b.left<area.left-1||b.right>area.right+1||b.top<area.top-1||b.bottom>area.bottom+1;})) overflowSides.push(probe.dataset.boundsStage==='FRONT'?'frente':'posterior');
      }
      if(overflowSides.length){setCanvasWarning('Hay contenido fuera del lienzo en '+overflowSides.join(' y ')+'. Reduce el tamaño o centra los elementos antes de agregar. Puedes guardar el diseño completo como borrador desde Ajustes.');return;}
      const orderPrice = calculatePrice();
      if (orderPrice === null) { const saved=await saveCurrentDesign();if(saved)setStripNote('Borrador guardado. Esta combinación no tiene precio publicado todavía: el taller lo confirma antes de cobrar.'); return; }
      setCanvasWarning('');
      onSave({
          productId: product.id, color: selectedColor,
          frontText, frontText2, frontFontId, frontFontId2, frontDesign, frontDesign2, frontLogos,
          backText, backText2, backFontId, backFontId2, backDesign, backDesign2, backLogos,
          quantity, priceTotal: orderPrice,
          isClientItem, clientItemBrand, clientItemColor,
          customBackgroundImage: userUploadedImage
      }, goToCart);
  };

  const saveCurrentDesign = async () => {
    if(!historyEnabled)return false;
    const isCurrent=beginHistory(),designRevision=addRevision.current;
    setHistoryBusy(true);setHistoryStatus('Guardando diseño y originales privados');
    try {
      const fontIds=[frontFontId,frontFontId2,backFontId,backFontId2];
      await saveDesign((frontText||backText||product.name||'Diseño').slice(0,100),{
        version:1,productId:product.id,selectedColor,view,quantity,isClientItem,clientItemBrand,clientItemColor,
        customBackgroundImage:userUploadedImage,frontText,frontText2,frontFontId,frontFontId2,frontDesign,frontDesign2,frontLogos,
        backText,backText2,backFontId,backFontId2,backDesign,backDesign2,backLogos,
        fontSnapshot:fonts.filter(f=>fontIds.includes(f.id))
      },isCurrent);
      if(!isCurrent())return false;
      const rows=await listDesigns();if(!isCurrent())return false;
      setSavedDesigns(rows);setHistoryStatus('Diseño guardado en Supabase');
      if(designRevision!==addRevision.current)return false;
      setStripNote('Borrador guardado en tu historial privado.');return true;
    }catch(error){if(isCurrent()){const message=error instanceof Error?error.message:'No guardado';setHistoryStatus(message);setStripNote('No se guardó el borrador. '+message);}return false;}finally{if(isCurrent())setHistoryBusy(false);}
  };
  const reuseDesign = async (row:SavedDesign) => {
    if(!historyEnabled)return;
    const isCurrent=beginHistory(),designRevision=addRevision.current;
    const canRestore=()=>isCurrent()&&designRevision===addRevision.current;
    setHistoryBusy(true);
    try {
      const d=await restoreDesign(row,canRestore);
      if(!canRestore())return;
      if(d.productId!==product.id)throw Error('Abre el producto original para reutilizar este diseño');
      // Never silently replace an engraving font after a catalog edit.
      for(const old of d.fontSnapshot??[]){const live=fonts.find(f=>String(f.id)===String(old.id));if(!live||live.cssFamily!==old.cssFamily||live.fileData!==old.fileData)throw Error('La fuente original cambió. Revisión de fuente requerida antes de reutilizar');}
      setSelectedColor(d.selectedColor);setView(d.view);setQuantity(d.quantity);setIsClientItem(d.isClientItem);setClientItemBrand(d.clientItemBrand);setClientItemColor(d.clientItemColor);setUserUploadedImage(d.customBackgroundImage);
      setFrontText(d.frontText);setFrontText2(d.frontText2);setFrontFontId(catalogFontId(fonts,d.frontFontId,defaultFontId));setFrontFontId2(catalogFontId(fonts,d.frontFontId2,defaultFontId));setFrontDesign(rightAngleDesign(d.frontDesign));setFrontDesign2(rightAngleDesign(d.frontDesign2));setFrontLogos(rightAngleLogos(d.frontLogos));
      setBackText(d.backText);setBackText2(d.backText2);setBackFontId(catalogFontId(fonts,d.backFontId,defaultFontId));setBackFontId2(catalogFontId(fonts,d.backFontId2,defaultFontId));setBackDesign(rightAngleDesign(d.backDesign));setBackDesign2(rightAngleDesign(d.backDesign2));setBackLogos(rightAngleLogos(d.backLogos));setSelectedElementId(null);
      setHistoryStatus('Diseño original recuperado de Supabase');
    }catch(error){if(canRestore())setHistoryStatus(error instanceof Error?error.message:'No se pudo recuperar');}finally{if(isCurrent())setHistoryBusy(false);}
  };

  const removeSavedDesign=async(row:SavedDesign)=>{
    if(!historyEnabled)return;
    if(!confirm(`¿Eliminar el borrador "${row.name}" de tu historial? No se puede deshacer.`))return;
    const isCurrent=beginHistory();setHistoryBusy(true);
    try{await deleteDesign(row.id);if(!isCurrent())return;const rows=await listDesigns();if(!isCurrent())return;setSavedDesigns(rows);setHistoryStatus('Diseño eliminado del historial');}
    catch{if(isCurrent())setHistoryStatus('No se pudo eliminar');}finally{if(isCurrent())setHistoryBusy(false);}
  };

  const scrollColors = (direction: 'up' | 'down') => {
    if (colorContainerRef.current) colorContainerRef.current.scrollBy({ top: direction === 'up' ? -150 : 150, behavior: 'smooth' });
  };

  const handleDeleteSelected = () => {
      if (!selectedElementId) return;
      if (selectedElementId === 'text1') { if (view === 'FRONT') setFrontText(''); else setBackText(''); setSelectedElementId(null); }
      else if (selectedElementId === 'text2') { if (view === 'FRONT') setFrontText2(''); else setBackText2(''); setSelectedElementId(null); }
      else deleteLogo(selectedElementId);
  };

  const handleResetSelected = () => {
      if (!selectedElementId) return;
      setDesignState(selectedElementId, { ...getDesignState(selectedElementId), x: 50, y: 50, rotate: 0 });
  };

  const handleSaveToFavorites = () => {
      const currentDesign = getDesignState(selectedElementId);
      if (!currentDesign) return;
      const newFavorites = [...favorites, { ...currentDesign, id: Date.now().toString() }];
      setFavorites(newFavorites);

  };

  const handleLoadFromFavorites = (fav: DesignState) => {
      if (!selectedElementId) return;
      setDesignState(selectedElementId, { ...fav });
  };

  const handleRemoveFavorite = (id: string) => {
      const newFavorites = favorites.filter(f => f.id !== id);
      setFavorites(newFavorites);

  };

  const openFontModal = (target: 'text1' | 'text2') => { setFontModalTarget(target); setSelectedElementId(target); setIsFontModalOpen(true); };
  const handleFontSelect = (fontId: number) => {
      if (view === 'FRONT') { if (fontModalTarget === 'text1') setFrontFontId(fontId); else setFrontFontId2(fontId); }
      else { if (fontModalTarget === 'text1') setBackFontId(fontId); else setBackFontId2(fontId); }
      setIsFontModalOpen(false);
  };
  
  const getCurrentFontId = (target: 'text1' | 'text2') => {
      if (view === 'FRONT') return target === 'text1' ? frontFontId : frontFontId2;
      return target === 'text1' ? backFontId : backFontId2;
  };

  const fontCategories=['TODAS',...new Set(fonts.flatMap(f=>f.categories?.length?f.categories:[f.category||'BASICAS']))];
  const filteredFonts = fonts.filter(productionFont).filter(f=>fontCategory==='TODAS'||(f.categories?.length?f.categories:[f.category||'BASICAS']).includes(fontCategory as any));
  
  const renderInteractiveElement = (id: string, content: React.ReactNode, design: DesignState) => {
      const isSelected = selectedElementId === id;
      // Derived from current state, never from the previous DOM frame. CSS zoom is part of the canvas scale.
      const zoom=product.illustrativeImage&&!userUploadedImage?(window.innerWidth<1024&&window.innerHeight<=520?1.6:window.innerWidth<768?2.1:window.innerWidth>=1024?(window.innerHeight<=760?1.9:1.55):1):1;
      const renderedScale=stageScale*zoom;
      const totalScale = design.scale * renderedScale;
      const handleScale = totalScale > 0 ? 1 / totalScale : 1; 
      const inverseScale = 1 / design.scale; 

      return (
          <div data-design-element={id} role="button" tabIndex={0} aria-label={id==='text1'?'Texto1 del diseño':id==='text2'?'Texto2 del diseño':'Imagen del diseño'} aria-pressed={isSelected} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();editElement(id);}if(e.key===' '){e.preventDefault();setSelectedElementId(id);haptic();}}} onPointerUp={e=>{e.preventDefault();e.stopPropagation();endElementGesture(e,id);}} onPointerCancel={()=>{if(gesture.current?.timer)clearTimeout(gesture.current.timer);gesture.current=null;}} className={`absolute origin-center select-none touch-none group ${isSelected ? 'z-50' : 'z-10'}`} style={{ left: `${design.x}%`, top: `${design.y}%`, transform: `translate(-50%, -50%) rotate(${design.rotate}deg) scale(${design.scale})`, cursor: isSelected ? 'move' : 'pointer' }} onPointerDown={(e) => startInteraction(e, 'MOVE', id)}>
              <div className={`relative flex flex-col items-center transition-transform duration-75 ${isSelected ? '' : 'active:scale-95'}`}>
                  {content}
                  {!isSelected && <div className="absolute -inset-4 border border-zinc-400/40 border-dashed rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ borderWidth: `${1.5 * inverseScale}px` }}></div>}
                  {isSelected && (
                      <div className="absolute -inset-6 border-2 border-dashed border-yellow-400 rounded-xl pointer-events-none animate-in fade-in zoom-in-95 duration-200" style={{ borderWidth: `${2 * inverseScale}px` }}>
                          <button type="button" aria-label={id.includes('text')?'Eliminar este texto':'Eliminar este monograma o imagen'} className="lm-design-handle absolute -top-6 -right-6 w-10 h-10 bg-zinc-950 text-white border border-white/70 rounded-full shadow-lg pointer-events-auto flex items-center justify-center z-30" style={{transform:`scale(${handleScale})`}} onPointerDown={e=>{e.preventDefault();e.stopPropagation();}} onPointerUp={e=>{e.preventDefault();e.stopPropagation();}} onClick={e=>{e.preventDefault();e.stopPropagation();handleDeleteSelected();setActiveTool(null);}}><X size={20}/></button>
                          <div className="lm-design-handle absolute -top-16 left-1/2 -translate-x-1/2 w-12 h-12 bg-yellow-400 rounded-full shadow-xl flex items-center justify-center cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform z-20 hover:bg-yellow-300" style={{ transform: `translateX(-50%) scale(${handleScale})` }} role="button" tabIndex={0} aria-label="Rotar en giros de 90 grados" onKeyDown={e=>{if(['Enter',' ','ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();e.stopPropagation();setDesignState(id,{...getDesignState(id),rotate:getDesignState(id).rotate+(e.key==='ArrowLeft'?-90:90)});}}} onPointerDown={(e) => startInteraction(e, 'ROTATE', id)}>
                              <RefreshCw size={20} className="text-black"/>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 bg-yellow-400 pointer-events-none"></div>
                          </div>
                          <div className="lm-design-handle absolute -bottom-6 -right-6 w-10 h-10 bg-white dark:bg-zinc-900 border-4 border-yellow-400 rounded-full shadow-lg cursor-nwse-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform flex items-center justify-center z-20 hover:border-yellow-300" style={{ transform: `scale(${handleScale})` }} role="button" aria-label="Arrastrar para cambiar tamaño" onPointerDown={(e) => startInteraction(e, 'SCALE', id)}>
                              <Maximize size={16} className="text-yellow-600"/>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const toggleTool = (tool: ActiveTool) => {
      if (activeTool === tool) setActiveTool(null);
      else {
          setActiveTool(tool);
          if (tool === 'TEXT1') setSelectedElementId('text1');
          if (tool === 'TEXT2') setSelectedElementId('text2');
      }
  };

  // Measure both faces without inventing a physical engraving area from a product photo.
  const boundsProbe=(side:'FRONT'|'BACK')=>{
    const front=side==='FRONT';
    const item=(key:string,state:DesignState,content:React.ReactNode)=><div key={key} data-bounds-item style={{position:'absolute',display:'flex',flexDirection:'column',alignItems:'center',width:'max-content',left:state.x+'%',top:state.y+'%',transform:`translate(-50%, -50%) rotate(${state.rotate}deg) scale(${state.scale})`}}>{content}</div>;
    return <div key={side} data-bounds-stage={side} aria-hidden="true" style={{position:'fixed',left:-20000,top:-20000,width:500,height:600,visibility:'hidden',pointerEvents:'none'}}>
      {(front?frontText:backText)&&item('text1',front?frontDesign:backDesign,<EngravingText text={(front?frontText:backText)||''} fontCss={fonts.find(f=>f.id===(front?frontFontId:backFontId))?.cssFamily} baseSize={48} lineHeight={(front?frontDesign:backDesign).textLineHeight} lineSizes={(front?frontDesign:backDesign).textLineSizes}/>)}
      {(front?frontText2:backText2)&&item('text2',front?frontDesign2:backDesign2,<EngravingText text={(front?frontText2:backText2)||''} fontCss={fonts.find(f=>f.id===(front?frontFontId2:backFontId2))?.cssFamily} lineHeight={(front?frontDesign2:backDesign2).textLineHeight} lineSizes={(front?frontDesign2:backDesign2).textLineSizes}/>)}
      {(front?frontLogos:backLogos).map(logo=>item(logo.id,logo.state,<img src={logo.url} style={{width:160,height:'auto'}} />))}
    </div>;
  };

  const selectedLogoId = selectedElementId && selectedElementId !== 'text1' && selectedElementId !== 'text2' ? selectedElementId : null;

  return (
    <div ref={viewportRef} onClickCapture={e=>{if((e.target as HTMLElement).closest('button'))haptic();}} className="lm-customizer lm-ui flex flex-col h-screen bg-white dark:bg-zinc-950 font-sans overflow-hidden">
        {/* GLOBAL FILE INPUT FOR LOGOS (Standard) */}
        <input aria-label="Subir imagen para grabar" type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload}/>
        <input aria-label="Tomar foto del producto" type="file" ref={cameraInputRef} hidden accept="image/*" capture="environment" onChange={handleCameraUpload}/>

        <input aria-label="Elegir foto del producto" type="file" ref={productPhotoInputRef} hidden accept="image/*" onChange={handleCameraUpload}/>
        {/* TOP BAR */}
        <header className="h-20 md:h-24 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl z-30 shrink-0 relative">
            <button aria-label="Volver al catálogo" onClick={()=>onBack(navigationDraft())} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors active:scale-95"><ArrowLeft size={24}/></button>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                 <h2 className={`text-xl md:text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white ${storeConfig.logoFont || 'nike-title'}`} style={{ fontFamily: storeConfig.logoFont ? undefined : 'Plus Jakarta Sans, sans-serif' }}>
                     {storeConfig.businessName}
                 </h2>
            </div>
            <button aria-label="Ver carrito" onClick={()=>onGoToCart(navigationDraft())} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full relative transition-colors active:scale-95"><Zap size={24} fill="currentColor"/></button>
        </header>

        {/* MAIN SPLIT */}
        <div className="lm-customizer-main flex-1 flex overflow-hidden relative">
            
            {/* CANVAS AREA WRAPPER */}
            <div className="lm-design-workspace flex-1 relative bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center p-0 overflow-hidden touch-none">
                <DesktopFrostBackground index={desktopBackground} onChange={onDesktopBackground}/>
                <div className="lm-canvas-grid absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #808080 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
                
                {/* COLOR: catalogue choices, or an explicit request when none are confirmed. */}
                {/* FLOATING LEFT: COLORS */}
                {showColors && colorOptions.length > 0 && (
                    <div aria-label="Color del termo" className="lm-colorrail absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-1 md:p-3 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl transition-all">
                        <span className="lm-color-label">Color</span><button aria-label="Ver colores anteriores" onClick={() => scrollColors('up')} className="p-1 md:p-2 text-zinc-400 hover:text-black dark:hover:text-white"><ChevronUp size={18}/></button>
                        <div ref={colorContainerRef} className="flex flex-col gap-2 md:gap-4 items-center max-h-[40vh] overflow-y-auto no-scrollbar px-1 py-1 w-full"> 
                            {(colorOptions || []).map((c: any) => (
                                <button key={c.id || c.name} aria-label={`Color ${c.name}`} aria-pressed={selectedColor===c.name} onClick={() => setSelectedColor(c.name)} className={`w-6 h-6 md:w-8 md:h-8 rounded-full shadow-lg transition-all duration-300 relative shrink-0 ${selectedColor === c.name ? 'ring-1 ring-offset-1 ring-yellow-400 scale-110 z-10 ring-offset-white dark:ring-offset-zinc-950' : 'hover:scale-110 hover:shadow-xl hover:z-10'}`} style={{backgroundColor: c.hex}} title={c.name}>
                                    {selectedColor === c.name && <Check size={12} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md invert mix-blend-difference"/>}
                                </button>
                            ))}
                        </div>
                        <button aria-label="Ver más colores" onClick={() => scrollColors('down')} className="p-1 md:p-2 text-zinc-400 hover:text-black dark:hover:text-white"><ChevronDown size={18}/></button>
                    </div>
                )}

                {/* RIGHT SIDE CONTROLS */}
                <div className="lm-toolrail absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4 pointer-events-none">
                    <div className="pointer-events-auto relative md:hidden">
                        <button data-tool-label="Termo" aria-label="Foto de producto propio" onClick={triggerCamera}  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300 ${userUploadedImage ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-500' : isClientItem ? 'bg-yellow-400 border-yellow-200 text-black hover:scale-110 animate-pulse ring-4 ring-yellow-400/30' : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 cursor-not-allowed grayscale'}`}>
                            {userUploadedImage ? <RefreshCw size={24}/> : <Aperture size={24}/>}
                        </button>
                    </div>
                    <div role="group" aria-label="Herramientas del personalizador" className="lm-toolbuttons lm-tool-primary pointer-events-auto">
                        <button data-tool-label="Texto 1" aria-label="Texto 1" aria-pressed={activeTool === 'TEXT1'} onClick={() => toggleTool('TEXT1')} className={`relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'TEXT1' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}><Type size={20} className="md:w-6 md:h-6" /><span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-zinc-700 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-zinc-900">1</span></button>
                        <button data-tool-label="Texto 2" aria-label="Texto 2" aria-pressed={activeTool === 'TEXT2'} onClick={() => toggleTool('TEXT2')} className={`relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'TEXT2' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}><Type size={16} className="md:w-5 md:h-5"/><span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-zinc-700 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-zinc-900">2</span></button>
                        <button data-tool-label="Diseños" aria-label="Imágenes" aria-pressed={activeTool === 'IMAGES'} onClick={() => toggleTool('IMAGES')} className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'IMAGES' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}><Images size={20} className="md:w-6 md:h-6" /></button>
                        <button data-tool-label="Plantillas" aria-label="Plantillas" onClick={() => setShowTemplates(true)} className="relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 hover:bg-zinc-800 text-white" title="Plantillas"><LayoutTemplate size={20} className="md:w-6 md:h-6" /></button>
                        <button ref={moreToolsTrigger} data-tool-label="Más" aria-label="Más herramientas" aria-expanded={moreToolsOpen} aria-controls="lm-more-tools" onClick={()=>setMoreToolsOpen(value=>!value)}><MoreHorizontal size={20}/></button>
                    </div>
                    {moreToolsOpen&&<div id="lm-more-tools" ref={moreToolsRef} className="lm-more-tools pointer-events-auto" role="region" aria-label="Más herramientas">
                        <div className="lm-more-heading"><h3>Herramientas</h3><button aria-label="Cerrar más herramientas" onClick={()=>{setMoreToolsOpen(false);moreToolsTrigger.current?.focus();}}><X size={18}/></button></div>
                        <div className="lm-more-actions" onClickCapture={event=>{if((event.target as HTMLElement).closest('button:not(:disabled)'))moreToolsTrigger.current?.focus();}} onClick={event=>{if((event.target as HTMLElement).closest('button:not(:disabled)'))setMoreToolsOpen(false);}}>
                            <button data-tool-label="Termo" aria-label="Foto de producto propio" onClick={triggerCamera}  className="p-2 md:p-3 disabled:opacity-40"><Camera size={20}/><span className="lm-more-copy"><strong>Termo</strong><small>Foto de tu producto</small></span></button>
                            <button data-tool-label="Monograma" aria-label="Monogramas y emblemas" onClick={() => setShowMonograms(true)} className="relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 hover:bg-zinc-800 text-white" title="Monogramas y emblemas"><Crown size={20} className="md:w-6 md:h-6" /><span className="lm-more-copy"><strong>Monogramas</strong><small>Iniciales y emblemas</small></span></button>
                            <button data-tool-label="Filtros" aria-label="Editar imagen" title={selectedLogoId?'Editar la imagen seleccionada':'Selecciona una imagen para usar los filtros'} aria-pressed={activeTool === 'MAGIC'} onClick={() => toggleTool('MAGIC')} disabled={!selectedLogoId} className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'MAGIC' ? 'bg-yellow-400 text-black shadow-lg scale-110' : selectedLogoId ? 'hover:bg-zinc-800 text-white' : 'text-zinc-600 cursor-not-allowed opacity-50'}`}><Wand2 size={20} className="md:w-6 md:h-6" /><span className="lm-more-copy"><strong>Filtros</strong><small>{selectedLogoId?'Editar imagen seleccionada':'Primero selecciona una imagen'}</small></span></button>
                            <button data-tool-label="Eliminar" aria-label="Eliminar elemento seleccionado" title={selectedElementId?'Eliminar elemento seleccionado':'Selecciona texto o imagen para eliminar'} onClick={handleDeleteSelected} disabled={!selectedElementId} className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${selectedElementId ? 'text-red-500 hover:bg-red-500/20' : 'text-zinc-600 cursor-not-allowed'}`}><Trash2 size={18} className="md:w-5 md:h-5" /><span className="lm-more-copy"><strong>Eliminar</strong><small>{selectedElementId?'Quitar elemento seleccionado':'Primero selecciona texto o imagen'}</small></span></button>
                            <button data-tool-label="Ajustes" aria-label="Ajustes del diseño" aria-pressed={activeTool === 'SETTINGS'} onClick={() => toggleTool('SETTINGS')} className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'SETTINGS' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}><Settings size={18} className="md:w-6 md:h-6" /><span className="lm-more-copy"><strong>Ajustes</strong><small>Tamaño y posición</small></span></button>
                        </div>
                    </div>}
                </div>

                {/* --- SLIDE-UP PANELS --- */}
                {activeTool && (
                    <>
                        <div className="absolute inset-0 bg-black/40 z-40 md:hidden" onClick={() => {if(Date.now()-editorOpenedAt.current>400)setActiveTool(null);}}></div>
                        <div ref={activeToolPanelRef} role="dialog" aria-modal="true" aria-label="Editar diseño" className={`lm-toolsheet z-[100] bg-white dark:bg-zinc-900 shadow-2xl fixed bottom-0 left-0 right-0 w-full max-h-[40vh] md:max-h-[60vh] rounded-t-[2rem] md:absolute md:right-32 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:w-96 md:h-auto md:rounded-[2rem] md:left-auto flex flex-col animate-in slide-in-from-bottom-10 duration-300 border border-zinc-200 dark:border-zinc-800 overflow-hidden`}>
                            <div className="md:hidden w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />
                            <div className="flex justify-between items-center px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                                <h3 className="font-sans font-black uppercase text-zinc-900 dark:text-white tracking-widest text-[10px] flex items-center gap-2">
                                    {(activeTool === 'TEXT1' || activeTool === 'TEXT2') && <><TextCursor size={14}/> Editar Texto</>}
                                    {activeTool === 'IMAGES' && <><Images size={14}/> Galería de Logos</>}
                                    {activeTool === 'MAGIC' && <><Wand2 size={14}/> Edición Imagen</>}
                                    {activeTool === 'SETTINGS' && <><Settings size={14}/> Configuración</>}
                                </h3>
                                <button aria-label="Listo, cerrar herramienta" onClick={() => setActiveTool(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full hover:scale-110 transition-transform shadow-sm"><Check size={14} /></button>
                            </div>
                            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-zinc-900">
                                {(activeTool === 'TEXT1' || activeTool === 'TEXT2') && (
                                    <div className="space-y-3">
                                        {activeTool==='TEXT2'&&(view==='FRONT'?frontText2:backText2).includes('\n')?<textarea aria-label="Texto de varias líneas" value={view==='FRONT'?frontText2:backText2} onChange={e=>view==='FRONT'?setFrontText2(e.target.value):setBackText2(e.target.value)} className="w-full bg-zinc-900 border border-zinc-600 rounded-xl p-3" rows={3}/>:<VintageRollInput 
                                            label={activeTool === 'TEXT1' ? 'TEXTO A' : 'TEXTO B'}
                                            value={view === 'FRONT' ? (activeTool === 'TEXT1' ? frontText : frontText2) : (activeTool === 'TEXT1' ? backText : backText2)}
                                            onChange={e => { 
                                                const val = e.target.value; 
                                                if(view === 'FRONT') { if(activeTool === 'TEXT1') setFrontText(val); else setFrontText2(val); } else { if(activeTool === 'TEXT1') setBackText(val); else setBackText2(val); }
                                            }}
                                            placeholder="Escribe..."
                                            onActionClick={() => openFontModal(activeTool === 'TEXT1' ? 'text1' : 'text2')}
                                            actionIcon={<Type size={20} />}
                                            actionLabel="FUENTE"
                                        />}
                                        <div className="flex justify-end mt-2">
                                            <button onClick={handleResetSelected} className="text-[9px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 uppercase tracking-wider"><RotateCcw size={10}/> Resetear Posición</button>
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'IMAGES' && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                            Elige un logo o icono y se agregará directo al termo.
                                        </p>
                                        {galleryAssets.length===0&&<p className="text-xs text-zinc-400">Aún no hay logos en la galería. Puedes subir tu imagen.</p>}
                                        <ImageGallery 
                                            galleryAssets={galleryAssets}
                                            onSelectImage={(url) => {addLogoToCanvas(url);setActiveTool(null);}}
                                            onUploadImage={(file) => {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const result = ev.target?.result as string;
                                                    setPendingLogo(result);setActiveTool(null);
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                )}
                                {activeTool === 'MAGIC' && selectedLogoId && (
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm relative">
                                        {(isProcessing || isRemovingBackground) && <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 z-20 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-zinc-900 dark:text-white" size={24}/></div>}
                                        <span className="text-[9px] font-black uppercase text-zinc-900 dark:text-white tracking-widest block mb-2">Filtros</span>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <button onClick={() => processImage(selectedLogoId, 'REMOVE_WHITE')} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-white dark:bg-zinc-900 shadow-sm transition-all group"><Scissors size={16} className="text-zinc-600 dark:text-zinc-400"/><span className="text-[7px] font-bold uppercase text-center leading-tight text-zinc-500">Quitar Blanco</span></button>
                                            <button onClick={() => processImage(selectedLogoId, 'MAKE_WHITE_REMOVE_BLACK')} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-black shadow-sm transition-all group"><Wand2 size={16} className="text-white"/><span className="text-[7px] font-bold uppercase text-center leading-tight text-white">Blanco Puro</span></button>
                                            <button onClick={() => processImage(selectedLogoId, 'REMOVE_BLACK')} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-100 dark:bg-zinc-800 shadow-sm transition-all group"><Scissors size={16} className="text-zinc-600 dark:text-zinc-300"/><span className="text-[7px] font-bold uppercase text-center leading-tight text-zinc-500">Quitar Negro</span></button>
                                            <button onClick={() => resetImage(selectedLogoId)} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-yellow-200 dark:border-yellow-900 hover:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-sm transition-all group"><RotateCcw size={16} className="text-yellow-600 dark:text-yellow-500"/><span className="text-[7px] font-bold uppercase text-center leading-tight text-yellow-600 dark:text-yellow-500">Restaurar Original</span></button>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {SHOW_AI_BG_REMOVAL && (
                                            <button onClick={handleRemoveBackground} disabled={isRemovingBackground} className="w-full py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900/50 flex items-center justify-center gap-2 text-[9px] font-bold uppercase transition-all">
                                                {isRemovingBackground ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} Remover Fondo IA
                                            </button>
                                            )}
                                            <button onClick={() => deleteLogo(selectedLogoId)} className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900/50 flex items-center justify-center gap-2 text-[9px] font-bold uppercase"><Trash2 size={12}/> Eliminar Imagen</button>
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'SETTINGS' && (
                                    <div className="bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-3">
{selectedElementId ? (
                                            <>
                                                {/* ZOOM & ROTATION CONTROLS */}
                                                <div className="border-b border-zinc-200 dark:border-zinc-700 pb-3">
                                                    <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-white"><ZoomIn size={14}/><span className="text-[10px] font-black uppercase tracking-widest">Tamaño y rotación</span></div>
                                                    
                                                    {/* Scale Slider */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-[8px] font-bold text-zinc-500 uppercase">Tamaño</label>
                                                            <span className="text-[8px] font-black text-yellow-600">{Math.round((getDesignState(selectedElementId)?.scale || 1) * 100)}%</span>
                                                        </div>
                                                        <input 
                                                            type="range" aria-label="Escala del elemento"
                                                            min="0.3" 
                                                            max="3" 
                                                            step="0.1" 
                                                            value={getDesignState(selectedElementId)?.scale || 1}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                setDesignState(selectedElementId, { ...getDesignState(selectedElementId)!, scale: val });
                                                            }}
                                                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                                        />
                                                        <div className="flex justify-between text-[7px] text-zinc-400 mt-0.5">
                                                            <span>30%</span>
                                                            <span>300%</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Rotation Slider */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-[8px] font-bold text-zinc-500 uppercase">Rotación · giros de 90°</label>
                                                            <span className="text-[8px] font-black text-yellow-600">{getDesignState(selectedElementId)?.rotate || 0}°</span>
                                                        </div>
                                                        <input 
                                                            type="range" aria-label="Rotación del elemento"
                                                            min="-180" 
                                                            max="180" 
                                                            step="90" 
                                                            value={getDesignState(selectedElementId)?.rotate || 0}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                setDesignState(selectedElementId, { ...getDesignState(selectedElementId)!, rotate: val });
                                                            }}
                                                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                                        />
                                                        <div className="flex justify-between text-[7px] text-zinc-400 mt-0.5">
                                                            <span>-180°</span>
                                                            <span>180°</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Quick Actions */}
                                                    <div className="flex gap-1">
                                                        <button onClick={handleResetSelected} className="flex-1 py-1.5 px-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg text-[8px] font-bold uppercase text-zinc-600 dark:text-zinc-300 transition-colors"><RotateCcw size={10} className="inline mr-1"/>Centrar</button>
                                                        <button onClick={handleSaveToFavorites} className="flex-1 py-1.5 px-2 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/30 rounded-lg text-[8px] font-bold uppercase text-yellow-600 transition-colors"><Heart size={10} className="inline mr-1"/>Favorito</button>
                                                    </div>
                                                </div>
                                                
                                                <p role="status" className="text-[9px] text-zinc-500">Favoritos: {favoritesStatus}</p>
                                                {/* FAVORITES SECTION */}
                                                {favorites.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-white"><Heart size={14}/><span className="text-[10px] font-black uppercase tracking-widest">Mis Favoritos ({favorites.length})</span></div>
                                                        <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
                                                            {favorites.map((fav) => (
                                                                <div key={fav.id} className="relative group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 cursor-pointer hover:border-yellow-400 transition-colors" onClick={() => handleLoadFromFavorites(fav)}>
                                                                    <div className="text-[7px] text-center">
                                                                        <div className="text-yellow-500 font-black">{Math.round((fav.scale || 1) * 100)}%</div>
                                                                        <div className="text-zinc-400">{fav.rotate || 0}°</div>
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(fav.id!); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={8}/></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {isClientItem ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 mb-1 text-zinc-900 dark:text-white"><Package size={14}/><span className="text-[10px] font-black uppercase tracking-widest">Personalizando tu termo</span></div>
                                                        <div><label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Marca</label><select value={clientItemBrand} onChange={(e) => setClientItemBrand(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-zinc-400 dark:text-white"><option value="OTRO">Sin especificar</option><option value="YETI">YETI</option><option value="STANLEY">STANLEY</option><option value="HYDROFLASK">HYDROFLASK</option><option value="GENERICO">GENÉRICO</option></select></div>
                                                        <div><label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Color (Descripción)</label><input value={clientItemColor} onChange={(e) => setClientItemColor(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-zinc-400 dark:text-white" placeholder="EJ. NEGRO MATE"/></div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4"><p className="text-[10px] text-zinc-800 dark:text-zinc-200 font-bold">Selecciona texto o imagen para ajustar tamaño y rotación</p><p className="text-[9px] text-zinc-500 mt-1">Toca cualquier texto o imagen en el termo</p></div>
                                                )}
                                            </>
                                        )}
                                        <details className="lm-design-history border-t border-zinc-700 pt-2"><summary className="text-xs cursor-pointer py-2">Historial y respuesta táctil</summary><div className="pt-2">
 <p className="text-xs mb-3">Toca para seleccionar; doble toque o mantén pulsado para editar. Arrastra para mover. También puedes usar las herramientas.</p>
                                            <button aria-pressed={hapticsSupported?hapticsEnabled:false} disabled={!hapticsSupported} onClick={()=>setHapticsEnabled(v=>!v)} className="border border-zinc-500 rounded-xl px-3 py-2 mb-3">Respuesta háptica: {hapticsSupported?(hapticsEnabled?'activada':'desactivada'):'no disponible en este navegador'}</button>
                                            <p className="text-xs text-zinc-500 mb-3">Sólo si el navegador y el teléfono permiten vibración.</p>
                                            <button disabled={historyBusy} onClick={saveCurrentDesign} className="lm-history-save disabled:opacity-50">Guardar diseño completo</button>
 <p role="status" className="lm-history-status">{historyStatus}</p>
 <div className="lm-history-list overflow-y-auto mt-1">
 {savedDesigns.map(row=><div key={row.id} className="lm-history-row"><button disabled={historyBusy} onClick={()=>reuseDesign(row)} className="lm-history-reuse">Reutilizar: {row.name}</button><button className="lm-history-delete" aria-label={'Eliminar diseño '+row.name} disabled={historyBusy} onClick={()=>removeSavedDesign(row)}>Eliminar</button></div>)}
 </div>
</div></details>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* PRODUCT INFO (NOW TOP LEFT) */}
                <div className="lm-desktop-product-info absolute top-6 left-20 z-20 hidden lg:flex flex-col items-start gap-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl min-w-[280px] max-w-[320px]">
                    <div className="text-left">
                        {referenceColor&&<p className="text-[10px] text-zinc-500 mb-2">{productPreviewLabel(product,selectedColor,userUploadedImage)}</p>}
                        <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white drop-shadow-sm select-none leading-tight mb-2">{product.name}</h3>
                        <span className="text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/30">{isClientItem ? 'SERVICIO PROPIO' : inventoryUnconfirmed?'CATÁLOGO · POR CONFIRMAR':'PRODUCTO CATÁLOGO'}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full text-xs">
                        <div className="flex justify-between items-center font-semibold text-zinc-600 dark:text-zinc-300 border-b border-zinc-200/50 dark:border-zinc-700/50 pb-1.5"><span className="text-zinc-400">{referenceColor?'Color solicitado:':'Color:'}</span><span className="font-bold text-zinc-900 dark:text-white">{selectedColor}</span></div>
                        <div className="flex justify-between items-center font-semibold text-zinc-600 dark:text-zinc-300 border-b border-zinc-200/50 dark:border-zinc-700/50 pb-1.5"><span className="text-zinc-400">Disponibilidad:</span><span className={`uppercase font-black ${isClientItem ? 'text-blue-500' : inventoryUnconfirmed ? 'text-zinc-400' : isOutOfStock ? 'text-red-500' : !product.availabilityOnly && currentStock < 5 ? 'text-amber-500' : 'text-emerald-500'}`}>{isClientItem ? 'N/A (Servicio)' : inventoryUnconfirmed ? 'POR CONFIRMAR' : isOutOfStock ? 'AGOTADO' : product.availabilityOnly ? 'Disponible' : currentStock < 5 ? `¡Últimas ${currentStock}!` : `${currentStock} Disponibles`}</span></div>
                        <div className="flex justify-between items-center font-semibold text-zinc-600 dark:text-zinc-300 border-b border-zinc-200/50 dark:border-zinc-700/50 pb-1.5"><span className="text-zinc-400">Precio Base:</span><span className="font-bold text-zinc-900 dark:text-white">{formatMXN(isClientItem ? 0 : product.price)}</span></div>
                        <div className="flex justify-between items-center font-semibold text-zinc-600 dark:text-zinc-300"><span className="text-zinc-400">+ Grabado:</span><span className="font-bold text-amber-500">{(()=>{const p=calculatePrice();if(p===null)return 'A cotizar';const d=p-(isClientItem?0:product.price);return product.engravingIncluded&&!isClientItem&&d===0?'Incluido':formatMXN(d);})()}</span></div>
                    </div>
                </div>

                {/* VIEW SWITCHER */}
                <div className="lm-view-switcher absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/50 shadow-xl flex gap-1">
                        <button aria-pressed={view==='FRONT'} onClick={() => setView('FRONT')} className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${view === 'FRONT' ? 'bg-yellow-400 text-black shadow-md' : 'text-zinc-500 hover:text-black dark:text-zinc-400'}`}>Frente</button>
                        <button aria-pressed={view==='BACK'} onClick={() => setView('BACK')} className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${view === 'BACK' ? 'bg-yellow-400 text-black shadow-md' : 'text-zinc-500 hover:text-black dark:text-zinc-400'}`}>Posterior</button>
                    </div>
                    <button aria-label="Producto y precio" onClick={()=>setShowProductDetails(true)} className="lm-product-details-trigger flex items-center gap-1 px-3 py-1 text-zinc-400 text-xs"><Package size={15}/><span>{isClientItem?'Propio':'Producto'}</span><ChevronDown size={13}/></button>
                </div>

                {/* NAVIGATION ARROWS - FIXED Z-INDEX AND POSITION */}
                {products && products.length > 1 && (
                    <>
                        <button 
                            aria-label="Producto anterior" onClick={handlePrevProduct} 
                            className="lm-desktop-product-arrow absolute top-1/2 left-4 z-[100] -translate-y-1/2 p-4 bg-white/10 hover:bg-white/30 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white border border-black/10 dark:border-white/10 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 group shadow-lg pointer-events-auto"
                        >
                            <ChevronLeft size={32} className="md:w-12 md:h-12 group-hover:-translate-x-1 transition-transform stroke-[1.5]"/>
                        </button>
                        
                        <button 
                            aria-label="Producto siguiente" onClick={handleNextProduct} 
                            className="lm-desktop-product-arrow absolute top-1/2 right-24 md:right-40 z-[100] -translate-y-1/2 p-4 bg-white/10 hover:bg-white/30 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white border border-black/10 dark:border-white/10 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 group shadow-lg pointer-events-auto"
                        >
                            <ChevronRight size={32} className="md:w-12 md:h-12 group-hover:translate-x-1 transition-transform stroke-[1.5]"/>
                        </button>
                    </>
                )}

                {/* --- VIRTUAL STAGE CONTAINER --- */}
                {/* Fixed Aspect Ratio Container to enforce 'Standard' size */}
                <div className="lm-stage-wrapper relative h-full w-full flex items-center justify-center select-none touch-none p-4 md:p-8 z-10">
                    <div ref={containerWrapperRef} className="lm-product-stage relative aspect-[5/6] h-full max-h-[85vh] w-auto max-w-full bg-white dark:bg-zinc-950 shadow-2xl rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800" onPointerDown={() => setSelectedElementId(null)}>
                        {isOutOfStock && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-red-600/90 text-white px-8 py-4 rounded-2xl backdrop-blur-sm shadow-2xl transform -rotate-12 border-2 border-white"><span className="text-4xl font-black uppercase tracking-widest flex items-center gap-3"><AlertOctagon size={32}/> Agotado</span></div>}

                        
                        {/* Loading Overlay */}
                        {!isImageLoaded && !isOutOfStock && !(isClientItem && !userUploadedImage) && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300">
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-xl">
                                    <Loader2 className="animate-spin text-yellow-400 w-8 h-8"/>
                                </div>
                            </div>
                        )}

                        {/* The Scaled Stage: 500x600 px */}
                        <div 
                            id="virtual-stage" data-illustrative={product.illustrativeImage&&!userUploadedImage?'true':undefined}
                            style={{
                                width: `${STAGE_WIDTH}px`,
                                height: `${STAGE_HEIGHT}px`,
                                transform: `scale(${stageScale})`,
                                transformOrigin: 'center center',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: `-${STAGE_HEIGHT/2}px`,
                                marginLeft: `-${STAGE_WIDTH/2}px`,
                            }}
                            className="relative flex items-center justify-center transition-transform duration-75 ease-out"
                        >
                            <img
                                ref={mainImageRef}
                                alt={userUploadedImage?'Foto de tu producto':isClientItem?'Termo de referencia para colocar el diseño':product.illustrativeImage?`Foto de referencia YETI Rambler 30oz ${referenceColor||'NEGRO'}`:product.name}
                                style={{transform:`scale(${previewImageScale(product.illustrativeImage,userUploadedImage)})`}}
                                src={currentImage}
                                onLoad={() => setIsImageLoaded(true)}
                                className={`lm-product-photo ${userUploadedImage ? 'lm-user-photo' : ''} w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] pointer-events-none select-none transition-all duration-700 ease-in-out relative z-10 ${isOutOfStock ? 'grayscale opacity-50' : ''} ${isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                            />
                            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                                <div className="absolute inset-0 pointer-events-auto">
                                    {(view === 'FRONT' ? frontText : backText) && renderInteractiveElement('text1', 
                                        <EngravingText text={view==='FRONT'?frontText:backText} fontCss={fonts.find(f=>f.id===(view==='FRONT'?frontFontId:backFontId))?.cssFamily} baseSize={48} color={engravingTone} lineHeight={(view==='FRONT'?frontDesign:backDesign).textLineHeight} lineSizes={(view==='FRONT'?frontDesign:backDesign).textLineSizes}/>, 
                                        view === 'FRONT' ? frontDesign : backDesign
                                    )}
                                    {(view === 'FRONT' ? frontText2 : backText2) && renderInteractiveElement('text2',
                                        <EngravingText text={view==='FRONT'?frontText2:backText2} fontCss={fonts.find(f=>f.id===(view==='FRONT'?frontFontId2:backFontId2))?.cssFamily} color={engravingTone} lineHeight={(view==='FRONT'?frontDesign2:backDesign2).textLineHeight} lineSizes={(view==='FRONT'?frontDesign2:backDesign2).textLineSizes}/>,view==='FRONT'?frontDesign2:backDesign2)}
                                    {(view === 'FRONT' ? frontLogos : backLogos).map(logo => (
                                        <React.Fragment key={logo.id}>
                                            {renderInteractiveElement(logo.id, <div className="relative"><img src={logo.url} style={{ width: '160px' }} className="h-auto pointer-events-none drop-shadow-sm transition-all duration-300" /></div>, logo.state)}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lm-stage-caption">{isClientItem&&!userUploadedImage&&<span>Termo de referencia · No incluido</span>}{userUploadedImage&&<button className="lm-photo-purpose" onClick={triggerCamera}>Foto del termo · ¿Era un logo?</button>}{referenceColor&&<span>{productPreviewLabel(product,selectedColor,userUploadedImage)}</span>}</div>
        {boundsProbe('FRONT')}{boundsProbe('BACK')}
        {/* Editing and order review are separate decisions on a phone. */}
            <button aria-label="Revisar diseño" onClick={()=>setShowProductDetails(true)} className="lm-review-action"><span><strong>{calculatePrice()===null?'A cotizar':formatMXN(calculatePrice()!*quantity)}</strong><small>{quantity} {quantity===1?'termo':'termos'}{isClientItem&&calculatePrice()===0?' · sin grabado':''}{inventoryUnconfirmed?' · Stock por confirmar':''}</small></span><span>Revisar diseño <ChevronRight size={18}/></span></button>
        {/* BOTTOM BAR */}
            <div className="lm-customizer-actions lm-desktop-order-actions absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-1.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-6 md:w-auto justify-between md:justify-start scale-100 origin-bottom">
                <div className="lm-quantity-group flex flex-col bg-zinc-100 dark:bg-zinc-900 px-2 py-1.5 rounded-lg"><span className="lm-quantity-label text-[10px] text-zinc-400 text-center">Cantidad</span><div className="flex items-center">
                     <button aria-label="Reducir cantidad de termos" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-md text-zinc-500 hover:text-black font-bold shadow-sm active:scale-90 transition-transform text-xs" disabled={isUnavailable}>-</button>
                     <span className="font-black text-sm min-w-[16px] text-center">{quantity}</span>
                     <button aria-label="Aumentar cantidad de termos" onClick={() => setQuantity(quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-md text-zinc-500 hover:text-black font-bold shadow-sm active:scale-90 transition-transform text-xs" disabled={isUnavailable}>+</button>
                </div></div>
                <div className="lm-price-summary lg:hidden px-2 text-center">
                    <span className="lm-total-label block text-[8px] font-black uppercase tracking-widest text-zinc-400">Total</span>
                    <span className="font-black text-sm text-zinc-900 dark:text-white">{(()=>{const p=calculatePrice();return p===null?'A cotizar':formatMXN(p*quantity);})()}</span>
                <span className="lm-mobile-stock">{inventoryUnconfirmed?'Stock por confirmar':isOutOfStock?'Agotado':`${quantity} ${quantity===1?'pieza':'piezas'}`}</span></div>
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>
                <button onClick={()=>void saveCurrentDesign()} disabled={historyBusy} aria-label="Guardar borrador" className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors active:scale-90 flex flex-col items-center gap-1" title="Guardar Borrador"><Save size={18}/><span className="lm-save-label text-[9px]">Guardar</span></button>
                <button aria-label="Revisar diseño en escritorio" onClick={()=>setShowProductDetails(true)} className="lm-primary flex-1 md:flex-none px-6 md:px-8 py-2 font-black uppercase text-[10px] tracking-[0.2em] rounded-lg shadow-lg flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black"><span>Revisar diseño</span><ChevronRight size={16}/></button>
            </div>
        </div>
            <div className={`lm-canvas-notice ${canvasWarning||stripNote?'lm-feedback-notice':'lm-tariff-notice'}`} role={canvasWarning?'alert':'note'}>
          {canvasWarning||(stripNote||(calculatePrice()===null
            ? 'Combinación sin precio publicado: guárdala como borrador y el taller confirma antes de cobrar.'
            : (isClientItem&&calculatePrice()===0 ? 'La foto es sólo referencia. Añade texto o un diseño para calcular el grabado.' : product.engravingIncluded&&!isClientItem
              ? <>Incluye nombre al frente · Un logo o monograma al reverso +{formatMXN(pricing.extraSidePrice)} · Texto al reverso y otras combinaciones: a cotizar. <button className="lm-notice-action" onClick={()=>setShowTariffDetails(v=>!v)}>{showTariffDetails?'Menos':'Detalles'}</button>{showTariffDetails && <span className="lm-notice-details">{product.illustrativeImage?'Foto YETI 30oz de referencia, no del producto de catálogo. ':''}La zona de grabado es orientativa; el taller confirma ubicación y precio antes de cobrar.</span>}</>
              : (product.illustrativeImage&&!isClientItem?'Foto YETI 30oz de referencia, no del producto de catálogo. La zona de grabado es orientativa y el taller la confirma.':'Vista orientativa: el taller confirma la zona de grabado.'))))}
        </div>

        {showProductDetails&&<div className="lm-customizer-modal fixed inset-0 z-[260] bg-black/70 flex items-end md:items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Producto, precio y disponibilidad">
          <div ref={reviewPanelRef} className="lm-review-sheet w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto text-zinc-100">
            <div className="lm-review-heading flex justify-between items-center gap-3"><h3 className="font-bold text-lg">Revisar diseño</h3><button aria-label="Cerrar producto y precio" onClick={()=>setShowProductDetails(false)}><X size={24}/></button></div>
            <p className="font-bold">{isClientItem?'Tu producto para grabar':product.name}</p>
            {missingTextFont&&<p role="status" className="lm-font-missing">Tipografía de referencia, sin archivo del taller. Conserva el diseño como borrador; no está listo para fabricar.</p>}
            <div className="lm-review-previews">{(['FRONT','BACK'] as const).map(side=><div key={side}><TechnicalPreview compact referenceLabel={productPreviewLabel(product,selectedColor,userUploadedImage)} imageUrl={currentImage} imageScale={previewImageScale(product.illustrativeImage,userUploadedImage)} inkColor={engravingTone} text={side==='FRONT'?frontText:backText} text2={side==='FRONT'?frontText2:backText2} fontName={fonts.find(f=>f.id===(side==='FRONT'?frontFontId:backFontId))?.name} fontCss={fonts.find(f=>f.id===(side==='FRONT'?frontFontId:backFontId))?.cssFamily||''} font2Css={fonts.find(f=>f.id===(side==='FRONT'?frontFontId2:backFontId2))?.cssFamily} logos={side==='FRONT'?frontLogos:backLogos} designState={side==='FRONT'?frontDesign:backDesign} designState2={side==='FRONT'?frontDesign2:backDesign2} sideLabel={side==='FRONT'?'Frente':'Posterior'}/></div>)}</div>
            <button aria-pressed={isClientItem} onClick={()=>setIsClientItem(!isClientItem)} className="lm-own-product-toggle border border-zinc-700 rounded-xl p-3 text-left flex justify-between gap-4"><span>{isClientItem?'Usar producto de catálogo':'Llevo mi propio producto'}<small className="block text-zinc-400 mt-1">{isClientItem?'Volver al precio y disponibilidad del catálogo':`Grabado de nombre: ${formatMXN(pricing.baseEngravingPrice)}`}</small></span><RefreshCw size={20}/></button>
            <div className="lm-review-quantity flex items-center justify-between"><span className="text-sm">Cantidad de termos</span><div className="flex items-center gap-4"><button aria-label="Reducir cantidad en revisión" onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button><span>{quantity}</span><button aria-label="Aumentar cantidad en revisión" onClick={()=>setQuantity(quantity+1)}>+</button></div></div>
            <dl className="text-sm space-y-3"><div className="flex justify-between gap-4"><dt className="text-zinc-400">Color</dt><dd>{selectedColor||'Sin elegir'}{inventoryUnconfirmed&&selectedColor?' · solicitado':''}</dd></div><div className="flex justify-between gap-4"><dt className="text-zinc-400">Disponibilidad</dt><dd>{isClientItem?'Producto propio':inventoryUnconfirmed?'Por confirmar con el taller':isOutOfStock?'Agotado':product.availabilityOnly?'Disponible':`${currentStock} disponibles`}</dd></div><div className="flex justify-between gap-4"><dt className="text-zinc-400">Total · {quantity} {quantity===1?'pieza':'piezas'}</dt><dd>{calculatePrice()===null?'A cotizar':formatMXN(calculatePrice()!*quantity)}</dd></div></dl>
            <p className="text-sm text-zinc-300">{product.engravingIncluded&&!isClientItem?'Incluye nombre al frente. Un logo o monograma al reverso +'+formatMXN(pricing.extraSidePrice)+'. Texto al reverso y otras combinaciones: a cotizar.':isClientItem?`Nombre al frente ${formatMXN(pricing.baseEngravingPrice)}. El total cambia según el diseño; no incluye comprar un termo.`:'El taller confirma el precio de esta combinación antes de cobrar.'}</p>
            {referenceColor&&<p className="text-sm text-zinc-400">Foto real de un YETI Rambler 30oz como referencia. No es el termo genérico de 20oz seleccionado ni confirma marca, capacidad o existencias.</p>}
            {inventoryUnconfirmed&&<p className="text-xs text-zinc-400">Guardar tu diseño no hace un pedido.</p>}
            <div className="flex gap-2 pt-2"><button aria-label="Guardar diseño revisado" disabled={historyBusy} onClick={async()=>{if(await saveCurrentDesign())setShowProductDetails(false);}} className={`lm-reviewed-save flex-1 p-3 rounded-lg font-bold flex items-center justify-center gap-2 ${isUnavailable?'bg-yellow-400 text-black':'border border-zinc-600'}`}><Save size={18}/>Guardar diseño</button>{!inventoryUnconfirmed&&<button disabled={isOutOfStock||missingTextFont} onClick={()=>{setShowProductDetails(false);handleSaveClick(true);}} className="lm-review-submit flex-1 p-3 rounded-lg bg-yellow-400 text-black disabled:bg-zinc-800 disabled:text-zinc-500 font-bold">{missingTextFont?'Tipografía pendiente':isOutOfStock?'Agotado':calculatePrice()===null?'Guardar borrador':'Agregar'}</button>}</div>
          </div>
        </div>}
        {showPhotoOptions&&<div ref={photoDialog} className="lm-customizer-modal lm-photo-modal fixed inset-0 z-[260] bg-black/70 flex items-end md:items-center justify-center p-3" role="dialog" aria-modal="true" data-tool-label="Termo" aria-label="Foto de producto propio">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-5 flex flex-col gap-3 overflow-y-auto">
            <div className="flex justify-between items-center gap-3"><h3 className="font-bold text-lg">Foto del termo o diseño</h3><button aria-label="Cerrar foto de producto" onClick={()=>setShowPhotoOptions(false)}><X size={24}/></button></div>
            <p className="text-sm">La foto del termo sirve de referencia. Un logo, dibujo o fotografía para grabar va en Diseños, como una capa pequeña y ajustable encima del termo.</p>
            <button className="bg-yellow-400 text-black rounded-xl font-bold p-3" onClick={openLiveCamera}>Tomar foto de mi termo</button>
            <button className="border border-zinc-500 rounded-xl p-3" onClick={()=>productPhotoInputRef.current?.click()}>Elegir foto de mi termo</button>
            <button className="border border-zinc-500 rounded-xl p-3 font-semibold" onClick={()=>{setShowPhotoOptions(false);setActiveTool('IMAGES');fileInputRef.current?.click();}}>Subir un diseño para grabar</button>
            {userUploadedImage&&<button className="border border-amber-500 rounded-xl p-3 text-left" disabled={isProcessing} onClick={async()=>{const source=originalUserPhoto||userUploadedImage;setShowPhotoOptions(false);setLogoFromProductPhoto(true);setPendingLogo(source);}}>La imagen cargada es un diseño: colocarla sobre el termo</button>}
            <p className="text-xs text-zinc-500">Tomar foto abre la cámara trasera aquí mismo (el navegador pide permiso la primera vez). Si no la permite, usa Elegir foto del teléfono.</p>
            {photoError&&<p role="alert" className="text-red-500">{photoError}</p>}
            {userUploadedImage&&<button className="border border-zinc-500 rounded-xl p-3" onClick={()=>{setPendingPhoto(originalUserPhoto||userUploadedImage);setShowPhotoOptions(false);}}>Ajustar encuadre de la foto</button>}
            {userUploadedImage&&<button className="border border-zinc-500 rounded-xl p-3" onClick={()=>{setUserUploadedImage(null);setOriginalUserPhoto(null);setShowPhotoOptions(false);}}>Quitar foto de fondo</button>}
          </div>
        </div>}
        {pendingLogo&&<PhotoFrameEditor
          imageSrc={pendingLogo}
          aspectW={1}
          aspectH={1}
          exportPng
          title="Ajusta tu imagen"
          onApply={async(cropped)=>{setPendingLogo(null);await addPreparedLogo(cropped,pendingLogo);if(logoFromProductPhoto){setUserUploadedImage(null);setOriginalUserPhoto(null);setLogoFromProductPhoto(false);setStripNote('La imagen ahora es un diseño para grabar. Ajusta su tamaño y posición.');}}}
          onUseOriginal={async()=>{const img=pendingLogo;setPendingLogo(null);await addPreparedLogo(img);if(logoFromProductPhoto){setUserUploadedImage(null);setOriginalUserPhoto(null);setLogoFromProductPhoto(false);setStripNote('La imagen ahora es un diseño para grabar. Ajusta su tamaño y posición.');}}}
          onCancel={()=>{setPendingLogo(null);setLogoFromProductPhoto(false);}}
        />}
        {pendingPhoto&&<PhotoFrameEditor
          imageSrc={pendingPhoto}
          onApply={(cropped)=>{setOriginalUserPhoto(pendingPhoto);setUserUploadedImage(cropped);setIsClientItem(true);setPendingPhoto(null);setPhotoError('');haptic();}}
          onUseOriginal={()=>{setOriginalUserPhoto(pendingPhoto);setUserUploadedImage(pendingPhoto);setIsClientItem(true);setPendingPhoto(null);setPhotoError('');haptic();}}
          onCancel={()=>setPendingPhoto(null)}
        />}
        {showLiveCamera&&<div ref={cameraDialog} className="lm-customizer-modal lm-live-camera fixed inset-0 z-[270] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Cámara para foto de producto">
          <div className="flex justify-between items-center p-3 text-white"><h3 className="font-bold">Tomar foto del producto</h3><button aria-label="Cerrar cámara" onClick={stopLiveCamera} className="p-2"><X size={24}/></button></div>
          <div className="flex-1 min-h-0 flex items-center justify-center bg-black relative">
            <video ref={liveVideoRef} autoPlay playsInline muted className="max-h-full max-w-full object-contain"/>
            {cameraStarting&&<p className="absolute inset-x-0 top-4 text-white text-sm px-6 text-center">Abriendo la cámara… acepta el permiso si tu navegador lo pide.</p>}
          </div>
          <div className="p-4 flex justify-center bg-black">
            <button className="bg-yellow-400 text-black rounded-full font-bold px-10 py-4 text-base" onClick={captureLivePhoto}>Capturar</button>
          </div>
        </div>}
        {/* FONT MODAL */}
        {isFontModalOpen && (
            <div ref={fontDialog} role="dialog" aria-modal="true" aria-label="Tipografía" className="lm-customizer-modal fixed inset-0 z-[200] flex flex-col justify-end md:justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFontModalOpen(false)}></div>
                <div className="bg-white dark:bg-zinc-950 z-10 w-full md:w-[800px] md:h-[600px] md:mx-auto md:rounded-3xl rounded-t-[2.5rem] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden max-h-[85vh]">
                    <div className="md:hidden w-16 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-4 mb-2 shrink-0" />
                    <div className="h-20 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 md:px-8 shrink-0">
                        <h2 className="text-3xl font-sans font-bold uppercase text-zinc-900 dark:text-white tracking-wide">Tipografía</h2>
                        <button aria-label="Cerrar fuentes" onClick={() => setIsFontModalOpen(false)} className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 transition-colors"><X size={24}/></button>
                    </div>
                    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 overflow-x-auto no-scrollbar shrink-0 flex gap-3">
                        {fontCategories.map(cat => (
                            <button key={cat} onClick={() => setFontCategory(cat as any)} className={`px-5 py-2.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${fontCategory === cat ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-zinc-50 dark:bg-black">
                        {!fonts.some(productionFont)&&<p className="lm-font-missing mb-4">Las tipografías del taller aún no están cargadas. Los diseños anteriores conservan sus referencias. Puedes seguir preparando un borrador.</p>}<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {filteredFonts.map(f => {
                                const isSelected = getCurrentFontId(fontModalTarget) === f.id;
                                const txt = (view === 'FRONT' ? (fontModalTarget === 'text1' ? frontText : frontText2) : (fontModalTarget === 'text1' ? backText : backText2)) || 'Muestra';
                                return (
                                    <button key={f.id} onClick={() => handleFontSelect(f.id)} className={`h-24 md:h-32 rounded-2xl flex flex-col items-center justify-center p-3 border-2 transition-all ${isSelected ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400'}`}>
                                        <span className={`${f.cssFamily} text-3xl md:text-4xl break-words text-center line-clamp-2`}>{txt}</span>
                                        <span className="text-[9px] font-bold text-zinc-400 mt-3 uppercase tracking-wider">{f.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TEMPLATES MODAL */}
        {showTemplates && (
            <DesignTemplates
                templates={storeConfig.designTemplates}
                onSelectTemplate={async (template) => {
                    const lines=template.texts.map((line,i)=>typeof line==='string'?{content:line,fontFamily:'',yPosition:40+i*20,size:1}:line);
                    if(!lines.length)return;
                    const fontId=(name:string)=>{const aliases:Record<string,string>={'playfair display':'font-serif1','anton':'font-industrial','plus jakarta sans':'font-google','permanent marker':'font-script1'};return fonts.find(f=>f.name.toLowerCase()===name.toLowerCase()||f.cssFamily?.toLowerCase()===name.toLowerCase()||f.cssFamily===aliases[name.toLowerCase()])?.id||initialFontId||defaultFontId;};
                    await document.fonts?.ready;
                    const first=lines[0],rest=lines.slice(1);
                    const measured=(content:string,id:number,size:number)=>{const el=document.createElement('span');el.className=(fonts.find(f=>f.id===id)?.cssFamily||'')+' font-bold whitespace-pre';el.style.cssText=`position:fixed;visibility:hidden;font-size:${size}px`;el.textContent=content;document.body.appendChild(el);const w=el.getBoundingClientRect().width;el.remove();return w;};
                    const fit1=Math.min(first.size??1,120/Math.max(1,measured(first.content,fontId(first.fontFamily),48)));
                    const fit2=Math.min(1,...rest.map(l=>120/Math.max(1,measured(l.content,fontId(rest[0]?.fontFamily||''),32*(l.size??1)))));
                    const ys=lines.map(l=>l.yPosition??50),minY=Math.min(...ys),spanY=Math.max(...ys)-minY,spread=Math.min(1,25/Math.max(1,spanY)),origin=Math.min(65-spanY*spread,Math.max(40,minY));
                    const safeY=(y:number)=>product.illustrativeImage?origin+(y-minY)*spread:y;
                    const d1={x:first.xPosition??50,y:safeY(first.yPosition??40),scale:fit1,rotate:rightAngleRotation(first.rotation??0)};
                    const d2:DesignState={x:rest[0]?.xPosition??50,y:rest.length?rest.reduce((sum,l)=>sum+safeY(l.yPosition??60),0)/rest.length:60,scale:fit2,rotate:rightAngleRotation(rest[0]?.rotation??0)};
                    if(rest.length>1){d2.textLineHeight=Math.abs(safeY(rest[1].yPosition??70)-safeY(rest[0].yPosition??50))*6/fit2;d2.textLineSizes=rest.map(l=>l.size??1);}else d2.scale=fit2*(rest[0]?.size??1);
                    if(view==='FRONT'){setFrontText(first.content);setFrontFontId(fontId(first.fontFamily));setFrontDesign(d1);setFrontText2(rest.map(l=>l.content).join('\n'));setFrontFontId2(fontId(rest[0]?.fontFamily||''));setFrontDesign2(d2);}
                    else{setBackText(first.content);setBackFontId(fontId(first.fontFamily));setBackDesign(d1);setBackText2(rest.map(l=>l.content).join('\n'));setBackFontId2(fontId(rest[0]?.fontFamily||''));setBackDesign2(d2);}
                    setShowTemplates(false);
                }}
                onClose={() => setShowTemplates(false)}
            />
        )}

        {/* MONOGRAMS MODAL */}
        {showMonograms && (
            <div ref={monogramDialog} role="dialog" aria-modal="true" aria-label="Monogramas y emblemas" className="lm-customizer-modal fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <MonogramLibrary fonts={fonts}
                        onSelectMonogram={(monogram) => {
                            const svg=monogram.svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ').replaceAll('currentColor','#c4c9cf');
                            addLogoToCanvas('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));
                            setActiveTool(null);
                            setShowMonograms(false);
                        }}

                    />
                    <button
                        aria-label="Cerrar monogramas" onClick={() => setShowMonograms(false)}
                        className="absolute top-4 right-4 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

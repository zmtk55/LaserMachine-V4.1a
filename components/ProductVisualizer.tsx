
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { removeBackground } from '../utils/imageUtils';
import { 
  ArrowLeft, Type, Image as ImageIcon, RotateCcw, 
  Check, X, ChevronRight, ChevronLeft, Trash2, Wand2, Loader2,
  Maximize, RefreshCw,
  ChevronUp, ChevronDown, Upload, Settings, TextCursor, Images, Package, Camera, Aperture, AlertOctagon, Save, Zap, Scissors,
  LayoutTemplate, Heart, ZoomIn, ZoomOut
} from 'lucide-react';
import { Product, FontOption, PricingConfig, OrderItem, DesignState, LogoItem, ColorPreset, FontCategory, BrandingAsset, StoreConfig } from '../types';
import { VintageRollInput } from './VintageRollInput';
import { ImageGallery } from './ImageGallery';
import { DesignTemplates } from './DesignTemplates';
import { MonogramLibrary } from './MonogramLibrary';

interface ProductVisualizerProps {
  product: Product;
  products?: Product[]; 
  fonts: FontOption[];
  pricing: PricingConfig;
  availableColors: ColorPreset[];
  initialFontId?: number;
  initialState?: OrderItem | null;
  galleryAssets: BrandingAsset[]; 
  onBack: () => void;
  onSave: (config: any, goToCart: boolean) => void;
  onGoToCart: () => void;
  onSwitchProduct: (product: Product) => void;
  isDarkMode: boolean;
  storeConfig: StoreConfig;
}

type ActiveTool = 'TEXT1' | 'TEXT2' | 'IMAGES' | 'MAGIC' | 'LAYERS' | 'SETTINGS' | null;

const STAGE_WIDTH = 500;
const STAGE_HEIGHT = 600;

export const ProductVisualizer: React.FC<ProductVisualizerProps> = ({
  product, products = [], fonts, pricing, availableColors, initialFontId, initialState, galleryAssets, onBack, onSave, onGoToCart, onSwitchProduct, isDarkMode, storeConfig
}) => {
  // --- STATE ---
  const [selectedColor, setSelectedColor] = useState(initialState?.colorName || product.colors[0]?.name || '');
  const [view, setView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [quantity, setQuantity] = useState(initialState?.quantity || 1);
  const [isClientItem, setIsClientItem] = useState(initialState?.isClientItem || false);
  const [clientItemBrand, setClientItemBrand] = useState(initialState?.clientItemBrand || 'YETI');
  const [clientItemColor, setClientItemColor] = useState(initialState?.clientItemColor || '');
  const [userUploadedImage, setUserUploadedImage] = useState<string | null>(initialState?.customBackgroundImage || null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [favorites, setFavorites] = useState<DesignState[]>(() => {
        try {
            const saved = localStorage.getItem('lm_design_favorites');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [isRemovingBackground, setIsRemovingBackground] = useState(false);
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
          alert("No se pudo remover el fondo. Asegúrate de tener conexión a internet.");
      } finally {
          setIsRemovingBackground(false);
      }
  };
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showCameraHint, setShowCameraHint] = useState(false);
  
  const defaultFontId = 999; 

  // Front Data
  const [frontText, setFrontText] = useState(initialState?.frontText || '');
  const [frontText2, setFrontText2] = useState(initialState?.frontText2 || '');
  const [frontFontId, setFrontFontId] = useState(initialState?.frontFontId || initialFontId || defaultFontId);
  const [frontFontId2, setFrontFontId2] = useState(initialState?.frontFontId2 || defaultFontId);
  const [frontDesign, setFrontDesign] = useState<DesignState>(initialState?.frontDesignState || { x: 50, y: 40, scale: 1, rotate: 0 });
  const [frontDesign2, setFrontDesign2] = useState<DesignState>(initialState?.frontDesignState2 || { x: 50, y: 60, scale: 1, rotate: 0 });
  const [frontLogos, setFrontLogos] = useState<LogoItem[]>(initialState?.frontLogos || []);

  // Back Data
  const [backText, setBackText] = useState(initialState?.backText || '');
  const [backText2, setBackText2] = useState(initialState?.backText2 || '');
  const [backFontId, setBackFontId] = useState(initialState?.backFontId || defaultFontId);
  const [backFontId2, setBackFontId2] = useState(initialState?.backFontId2 || defaultFontId);
  const [backDesign, setBackDesign] = useState<DesignState>(initialState?.backDesignState || { x: 50, y: 40, scale: 1, rotate: 0 });
  const [backDesign2, setBackDesign2] = useState<DesignState>(initialState?.backDesignState2 || { x: 50, y: 60, scale: 1, rotate: 0 });
  const [backLogos, setBackLogos] = useState<LogoItem[]>(initialState?.backLogos || []);

  // Control State
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
    const [showMonograms, setShowMonograms] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
    if (prev) onSwitchProduct(prev);
  };

  const handleNextProduct = () => {
    if (!products || products.length === 0) return;
    const idx = products.findIndex(p => p.id === product.id);
    const next = idx < products.length - 1 ? products[idx + 1] : products[0];
    if (next) onSwitchProduct(next);
  };

  // --- SCALE LOGIC ---
  useEffect(() => {
      const updateScale = () => {
          if (!containerWrapperRef.current) return;
          const { clientWidth } = containerWrapperRef.current;
          if (clientWidth === 0) return;
          const scaleW = clientWidth / STAGE_WIDTH;
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

  // --- EFFECT: CAMERA HINT TIMEOUT ---
  useEffect(() => {
      if (isClientItem && !userUploadedImage) {
          setShowCameraHint(true);
          const timer = setTimeout(() => setShowCameraHint(false), 3000);
          return () => clearTimeout(timer);
      } else {
          setShowCameraHint(false);
      }
  }, [isClientItem, userUploadedImage]);

  // --- IMAGE LOADING ---
  const currentColorObj = product.colors.find(c => c.name === selectedColor);
  const currentImage = userUploadedImage ? userUploadedImage : (currentColorObj?.imageUrl || product.imageUrl);
  const showColors = !userUploadedImage;
  const currentStock = currentColorObj?.stock || 0;
  const isOutOfStock = !isClientItem && currentStock <= 0;

  useEffect(() => {
      setIsImageLoaded(false);
      if (mainImageRef.current && mainImageRef.current.complete) setIsImageLoaded(true);
  }, [currentImage]);

  const colorOptions = useMemo(() => {
      const source = isClientItem ? (availableColors || []) : (product.colors || []);
      return source.filter((c, index, self) => index === self.findIndex((t) => t.name === c.name));
  }, [isClientItem, availableColors, product.colors]);

  const clientItemLabel = isClientItem ? 'Producto Propio' : 'Producto Catálogo';

  const calculatePrice = () => {
      let total = isClientItem ? 0 : product.price;
      if (frontText || frontText2 || frontLogos.length > 0) total += pricing.baseEngravingPrice;
      if (backText || backText2 || backLogos.length > 0) total += pricing.extraSidePrice;
      total += (frontLogos.length + backLogos.length) * pricing.logoSurcharge;
      return total;
  };

  const getDesignState = (id: string) => {
      if (id === 'text1') return view === 'FRONT' ? frontDesign : backDesign;
      if (id === 'text2') return view === 'FRONT' ? frontDesign2 : backDesign2;
      return (view === 'FRONT' ? frontLogos : backLogos).find(l => l.id === id)?.state || { x: 50, y: 50, scale: 1, rotate: 0 };
  };

  const setDesignState = (id: string, newState: DesignState) => {
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
              let newRotate = Math.round(interaction.initialState.rotate + rotationDelta);
              if (Math.abs(newRotate % 90) < 5) newRotate = Math.round(newRotate / 90) * 90;
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
      setSelectedElementId(id);
      if (window.innerWidth >= 768) {
          if (id.includes('text')) setActiveTool(id === 'text1' ? 'TEXT1' : 'TEXT2');
      }
      setInteraction({ type, startX: e.clientX, startY: e.clientY, initialState: getDesignState(id) });
  };

  // --- ASSET HANDLING ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
          const id = Date.now().toString();
          const result = ev.target?.result as string;
          const newLogo: LogoItem = { 
              id: id, 
              url: result, 
              originalUrl: result, 
              state: { x: 50, y: 50, scale: 1, rotate: 0 } 
          };
          if (view === 'FRONT') setFrontLogos(prev => [...prev, newLogo]); 
          else setBackLogos(prev => [...prev, newLogo]);
          
          setSelectedElementId(newLogo.id);
          setActiveTool('IMAGES'); 
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => setUserUploadedImage(ev.target?.result as string);
          reader.readAsDataURL(file);
      }
  };

  const triggerCamera = () => cameraInputRef.current?.click();

  const addLogoToCanvas = (url: string) => {
      const id = Date.now().toString();
      const newLogo: LogoItem = { 
          id: id, 
          url: url, 
          originalUrl: url, 
          state: { x: 50, y: 50, scale: 1, rotate: 0 } 
      };
      if (view === 'FRONT') setFrontLogos(prev => [...prev, newLogo]); 
      else setBackLogos(prev => [...prev, newLogo]);
      
      setSelectedElementId(newLogo.id);
      setActiveTool('IMAGES'); 
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

  const handleSaveClick = (goToCart: boolean) => {
      if (isOutOfStock) { alert("Lo sentimos, este color se encuentra agotado."); return; }
      onSave({
          productId: product.id, color: selectedColor,
          frontText, frontText2, frontFontId, frontFontId2, frontDesign, frontDesign2, frontLogos,
          backText, backText2, backFontId, backFontId2, backDesign, backDesign2, backLogos,
          quantity, priceTotal: calculatePrice(),
          isClientItem, clientItemBrand, clientItemColor,
          customBackgroundImage: userUploadedImage
      }, goToCart);
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
      setDesignState(selectedElementId, { x: 50, y: 50, scale: 1, rotate: 0 });
  };

  const handleSaveToFavorites = () => {
      const currentDesign = getDesignState(selectedElementId);
      if (!currentDesign) return;
      const newFavorites = [...favorites, { ...currentDesign, id: Date.now().toString() }];
      setFavorites(newFavorites);
      localStorage.setItem('lm_design_favorites', JSON.stringify(newFavorites));
  };

  const handleLoadFromFavorites = (fav: DesignState) => {
      if (!selectedElementId) return;
      setDesignState(selectedElementId, { x: fav.x, y: fav.y, scale: fav.scale, rotate: fav.rotate });
  };

  const handleRemoveFavorite = (id: string) => {
      const newFavorites = favorites.filter(f => f.id !== id);
      setFavorites(newFavorites);
      localStorage.setItem('lm_design_favorites', JSON.stringify(newFavorites));
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

  const filteredFonts = fontCategory === 'TODAS' ? fonts : fonts.filter(f => (f.category || 'BASICAS') === fontCategory);
  
  const renderInteractiveElement = (id: string, content: React.ReactNode, design: DesignState) => {
      const isSelected = selectedElementId === id;
      const totalScale = design.scale * (stageScale || 1);
      const handleScale = totalScale > 0 ? 1 / totalScale : 1; 
      const inverseScale = 1 / design.scale; 

      return (
          <div className={`absolute origin-center select-none touch-none group ${isSelected ? 'z-50' : 'z-10'}`} style={{ left: `${design.x}%`, top: `${design.y}%`, transform: `translate(-50%, -50%) rotate(${design.rotate}deg) scale(${design.scale})`, cursor: isSelected ? 'move' : 'pointer' }} onPointerDown={(e) => startInteraction(e, 'MOVE', id)}>
              <div className={`relative transition-transform duration-75 ${isSelected ? '' : 'active:scale-95'}`}>
                  {content}
                  {!isSelected && <div className="absolute -inset-4 border border-zinc-400/40 border-dashed rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ borderWidth: `${1.5 * inverseScale}px` }}></div>}
                  {isSelected && (
                      <div className="absolute -inset-6 border-2 border-dashed border-yellow-400 rounded-xl pointer-events-none animate-in fade-in zoom-in-95 duration-200" style={{ borderWidth: `${2 * inverseScale}px` }}>
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-12 h-12 bg-yellow-400 rounded-full shadow-xl flex items-center justify-center cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform z-20 hover:bg-yellow-300" style={{ transform: `translateX(-50%) scale(${handleScale})` }} onPointerDown={(e) => startInteraction(e, 'ROTATE', id)}>
                              <RefreshCw size={20} className="text-black"/>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 bg-yellow-400"></div>
                          </div>
                          <div className="absolute -bottom-6 -right-6 w-10 h-10 bg-white dark:bg-zinc-900 border-4 border-yellow-400 rounded-full shadow-lg cursor-nwse-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform flex items-center justify-center z-20 hover:border-yellow-300" style={{ transform: `scale(${handleScale})` }} onPointerDown={(e) => startInteraction(e, 'SCALE', id)}>
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

  const selectedLogoId = selectedElementId && selectedElementId !== 'text1' && selectedElementId !== 'text2' ? selectedElementId : null;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 font-sans overflow-hidden">
        {/* GLOBAL FILE INPUT FOR LOGOS (Standard) */}
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload}/>
        <input type="file" ref={cameraInputRef} hidden accept="image/*" capture="environment" onChange={handleCameraUpload}/>

        {/* TOP BAR */}
        <header className="h-20 md:h-24 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl z-30 shrink-0 relative">
            <button onClick={onBack} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors active:scale-95"><ArrowLeft size={24}/></button>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                 <h2 className={`text-xl md:text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white ${storeConfig.logoFont || 'nike-title'}`} style={{ fontFamily: storeConfig.logoFont ? undefined : 'Plus Jakarta Sans, sans-serif' }}>
                     {storeConfig.businessName}
                 </h2>
            </div>
            <button onClick={onGoToCart} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full relative transition-colors active:scale-95"><Zap size={24} fill="currentColor"/></button>
        </header>

        {/* MAIN SPLIT */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* CANVAS AREA WRAPPER */}
            <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center p-0 overflow-hidden touch-none">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #808080 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
                
                {/* FLOATING LEFT: COLORS */}
                {showColors && (
                    <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-1 md:p-3 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl transition-all">
                        <button onClick={() => scrollColors('up')} className="p-1 md:p-2 text-zinc-400 hover:text-black dark:hover:text-white"><ChevronUp size={18}/></button>
                        <div ref={colorContainerRef} className="flex flex-col gap-2 md:gap-4 items-center max-h-[40vh] overflow-y-auto no-scrollbar px-1 py-1 w-full"> 
                            {(colorOptions || []).map((c: any) => (
                                <button key={c.id || c.name} onClick={() => setSelectedColor(c.name)} className={`w-6 h-6 md:w-8 md:h-8 rounded-full shadow-lg transition-all duration-300 relative shrink-0 ${selectedColor === c.name ? 'ring-1 ring-offset-1 ring-yellow-400 scale-110 z-10 ring-offset-white dark:ring-offset-zinc-950' : 'hover:scale-110 hover:shadow-xl hover:z-10'}`} style={{backgroundColor: c.hex}} title={c.name}>
                                    {selectedColor === c.name && <Check size={12} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md invert mix-blend-difference"/>}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => scrollColors('down')} className="p-1 md:p-2 text-zinc-400 hover:text-black dark:hover:text-white"><ChevronDown size={18}/></button>
                    </div>
                )}

                {/* RIGHT SIDE CONTROLS */}
                <div className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4 pointer-events-none">
                    <div className="pointer-events-auto relative md:hidden">
                        <button onClick={triggerCamera} disabled={!isClientItem && !userUploadedImage} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300 ${userUploadedImage ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-500' : isClientItem ? 'bg-yellow-400 border-yellow-200 text-black hover:scale-110 animate-pulse ring-4 ring-yellow-400/30' : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 cursor-not-allowed grayscale'}`}>
                            {userUploadedImage ? <RefreshCw size={24}/> : <Aperture size={24}/>}
                        </button>
                        {showCameraHint && <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-black/80 text-white text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg whitespace-nowrap animate-in slide-in-from-right-2 shadow-lg">¡Toma tu foto aquí! &rarr;</div>}
                    </div>
                    <div className="pointer-events-auto flex flex-col items-center gap-3 md:gap-5 bg-zinc-950/95 backdrop-blur-md text-white p-2 md:p-4 rounded-2xl md:rounded-3xl shadow-2xl border border-zinc-800">
                        <button onClick={() => setShowTemplates(true)} className="relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:scale-110" title="Plantillas"><LayoutTemplate size={20} className="md:w-6 md:h-6" /></button>
                        <button onClick={() => setShowMonograms(true)} className="relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 hover:bg-zinc-800 text-white" title="Monogramas"><Type size={20} className="md:w-6 md:h-6" /></button>
                        <div className="w-8 h-px bg-zinc-800 my-0.5"></div>
                        <button onClick={() => toggleTool('TEXT1')} className={`relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'TEXT1' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}><Type size={20} className="md:w-6 md:h-6" /><span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-zinc-700 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-zinc-900">1</span></button>
                        <button onClick={() => toggleTool('TEXT2')} className={`relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'TEXT2' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}><Type size={16} className="md:w-5 md:h-5"/><span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-zinc-700 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-zinc-900">2</span></button>
                        <button onClick={() => toggleTool('IMAGES')} className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'IMAGES' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}><Images size={20} className="md:w-6 md:h-6" /></button>
                        <button onClick={() => toggleTool('MAGIC')} disabled={!selectedLogoId} className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'MAGIC' ? 'bg-yellow-400 text-black shadow-lg scale-110' : selectedLogoId ? 'hover:bg-zinc-800 text-white' : 'text-zinc-600 cursor-not-allowed opacity-50'}`}><Wand2 size={20} className="md:w-6 md:h-6" /></button>
                        <div className="w-8 h-px bg-zinc-800 my-0.5"></div>
                        <button onClick={handleDeleteSelected} disabled={!selectedElementId} className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${selectedElementId ? 'text-red-500 hover:bg-red-500/20' : 'text-zinc-600 cursor-not-allowed'}`}><Trash2 size={18} className="md:w-5 md:h-5" /></button>
                        <div className="w-8 h-px bg-zinc-800 my-0.5"></div>
                        <button onClick={() => toggleTool('SETTINGS')} className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${activeTool === 'SETTINGS' ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'hover:bg-zinc-800 text-white'}`}><Settings size={18} className="md:w-6 md:h-6" /></button>
                    </div>
                </div>

                {/* --- SLIDE-UP PANELS --- */}
                {activeTool && (
                    <>
                        <div className="absolute inset-0 bg-black/40 z-40 md:hidden" onClick={() => setActiveTool(null)}></div>
                        <div className={`z-[100] bg-white dark:bg-zinc-900 shadow-2xl fixed bottom-0 left-0 right-0 w-full max-h-[40vh] md:max-h-[60vh] rounded-t-[2rem] md:absolute md:right-32 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:w-96 md:h-auto md:rounded-[2rem] md:left-auto flex flex-col animate-in slide-in-from-bottom-10 duration-300 border border-zinc-200 dark:border-zinc-800 overflow-hidden`}>
                            <div className="md:hidden w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />
                            <div className="flex justify-between items-center px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                                <h3 className="font-sans font-black uppercase text-zinc-900 dark:text-white tracking-widest text-[10px] flex items-center gap-2">
                                    {(activeTool === 'TEXT1' || activeTool === 'TEXT2') && <><TextCursor size={14}/> Editar Texto</>}
                                    {activeTool === 'IMAGES' && <><Images size={14}/> Galería de Logos</>}
                                    {activeTool === 'MAGIC' && <><Wand2 size={14}/> Edición Imagen</>}
                                    {activeTool === 'SETTINGS' && <><Settings size={14}/> Configuración</>}
                                </h3>
                                <button onClick={() => setActiveTool(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full hover:scale-110 transition-transform shadow-sm"><Check size={14} /></button>
                            </div>
                            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-zinc-900">
                                {(activeTool === 'TEXT1' || activeTool === 'TEXT2') && (
                                    <div className="space-y-3">
                                        <VintageRollInput 
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
                                        />
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
                                        <ImageGallery 
                                            galleryAssets={galleryAssets}
                                            onSelectImage={(url) => addLogoToCanvas(url)}
                                            onUploadImage={(file) => {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const result = ev.target?.result as string;
                                                    addLogoToCanvas(result);
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
                                            <button onClick={handleRemoveBackground} disabled={isRemovingBackground} className="w-full py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center gap-2 text-[9px] font-bold uppercase transition-all">
                                                {isRemovingBackground ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} Remover Fondo IA
                                            </button>
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
                                                    <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-white"><ZoomIn size={14}/><span className="text-[10px] font-black uppercase tracking-widest">Zoom & Rotación</span></div>
                                                    
                                                    {/* Scale Slider */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-[8px] font-bold text-zinc-500 uppercase">Zoom</label>
                                                            <span className="text-[8px] font-black text-yellow-600">{Math.round((getDesignState(selectedElementId)?.scale || 1) * 100)}%</span>
                                                        </div>
                                                        <input 
                                                            type="range" 
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
                                                            <label className="text-[8px] font-bold text-zinc-500 uppercase">Rotación</label>
                                                            <span className="text-[8px] font-black text-yellow-600">{getDesignState(selectedElementId)?.rotate || 0}°</span>
                                                        </div>
                                                        <input 
                                                            type="range" 
                                                            min="-180" 
                                                            max="180" 
                                                            step="5" 
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
                                                        <button onClick={handleResetSelected} className="flex-1 py-1.5 px-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg text-[8px] font-bold uppercase text-zinc-600 dark:text-zinc-300 transition-colors"><RotateCcw size={10} className="inline mr-1"/>Reset</button>
                                                        <button onClick={handleSaveToFavorites} className="flex-1 py-1.5 px-2 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/30 rounded-lg text-[8px] font-bold uppercase text-yellow-600 transition-colors"><Heart size={10} className="inline mr-1"/>Guardar</button>
                                                    </div>
                                                </div>
                                                
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
                                                        <div><label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Marca</label><select value={clientItemBrand} onChange={(e) => setClientItemBrand(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-zinc-400 dark:text-white"><option value="YETI">YETI</option><option value="STANLEY">STANLEY</option><option value="HYDROFLASK">HYDROFLASK</option><option value="GENERICO">GENÉRICO</option></select></div>
                                                        <div><label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Color (Descripción)</label><input value={clientItemColor} onChange={(e) => setClientItemColor(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-zinc-400 dark:text-white" placeholder="EJ. NEGRO MATE"/></div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4"><p className="text-[10px] text-zinc-800 dark:text-zinc-200 font-bold">Selecciona un elemento para ajustar zoom y rotación</p><p className="text-[9px] text-zinc-500 mt-1">Toca cualquier texto o imagen en el termo</p></div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* PRODUCT INFO (NOW TOP LEFT) */}
                <div className="absolute top-6 left-20 z-20 hidden md:flex flex-col items-start gap-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl min-w-[280px] max-w-[320px]">
                    <div className="text-left">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white drop-shadow-sm select-none leading-tight mb-2">{product.name}</h3>
                        <span className="text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/30">{isClientItem ? 'SERVICIO PROPIO' : 'PRODUCTO STOCK'}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full text-xs">
                        <div className="flex justify-between items-center font-semibold text-zinc-600 dark:text-zinc-300 border-b border-zinc-200/50 dark:border-zinc-700/50 pb-1.5"><span className="text-zinc-400">Color:</span><span className="font-bold text-zinc-900 dark:text-white">{selectedColor}</span></div>
                        <div className="flex justify-between items-center font-semibold text-zinc-600 dark:text-zinc-300 border-b border-zinc-200/50 dark:border-zinc-700/50 pb-1.5"><span className="text-zinc-400">Disponibilidad:</span><span className={`uppercase font-black ${isClientItem ? 'text-blue-500' : isOutOfStock ? 'text-red-500' : currentStock < 5 ? 'text-amber-500' : 'text-emerald-500'}`}>{isClientItem ? 'N/A (Servicio)' : isOutOfStock ? 'AGOTADO' : currentStock < 5 ? `¡Últimas ${currentStock}!` : `${currentStock} Disponibles`}</span></div>
                        <div className="flex justify-between items-center font-semibold text-zinc-600 dark:text-zinc-300 border-b border-zinc-200/50 dark:border-zinc-700/50 pb-1.5"><span className="text-zinc-400">Precio Base:</span><span className="font-bold text-zinc-900 dark:text-white">${isClientItem ? 0 : product.price}</span></div>
                        <div className="flex justify-between items-center font-semibold text-zinc-600 dark:text-zinc-300"><span className="text-zinc-400">+ Grabado:</span><span className="font-bold text-amber-500">${calculatePrice() - (isClientItem ? 0 : product.price)}</span></div>
                    </div>
                </div>

                {/* VIEW SWITCHER */}
                <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/50 shadow-xl flex gap-1">
                        <button onClick={() => setView('FRONT')} className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${view === 'FRONT' ? 'bg-yellow-400 text-black shadow-md' : 'text-zinc-500 hover:text-black dark:text-zinc-400'}`}>Frente</button>
                        <button onClick={() => setView('BACK')} className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${view === 'BACK' ? 'bg-yellow-400 text-black shadow-md' : 'text-zinc-500 hover:text-black dark:text-zinc-400'}`}>Dorso</button>
                    </div>
                    <button onClick={() => setIsClientItem(!isClientItem)} className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border transition-all shadow-sm ${isClientItem ? 'bg-yellow-400/10 border-yellow-400 text-yellow-600 dark:text-yellow-400' : 'bg-white/50 dark:bg-black/50 border-white/20 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900'}`}><div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center transition-colors ${isClientItem ? 'bg-yellow-400 border-yellow-400' : 'border-zinc-400 dark:border-zinc-500'}`}>{isClientItem && <Check size={6} className="text-black" strokeWidth={4} />}</div><span className="text-[8px] font-black uppercase tracking-widest">{clientItemLabel}</span></button>
                </div>

                {/* NAVIGATION ARROWS - FIXED Z-INDEX AND POSITION */}
                {products && products.length > 1 && (
                    <>
                        <button 
                            onClick={handlePrevProduct} 
                            className="absolute top-1/2 left-4 z-[100] -translate-y-1/2 p-4 bg-white/10 hover:bg-white/30 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white border border-black/10 dark:border-white/10 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 group shadow-lg pointer-events-auto"
                        >
                            <ChevronLeft size={32} className="md:w-12 md:h-12 group-hover:-translate-x-1 transition-transform stroke-[1.5]"/>
                        </button>
                        
                        <button 
                            onClick={handleNextProduct} 
                            className="absolute top-1/2 right-24 md:right-40 z-[100] -translate-y-1/2 p-4 bg-white/10 hover:bg-white/30 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white border border-black/10 dark:border-white/10 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 group shadow-lg pointer-events-auto"
                        >
                            <ChevronRight size={32} className="md:w-12 md:h-12 group-hover:translate-x-1 transition-transform stroke-[1.5]"/>
                        </button>
                    </>
                )}

                {/* --- VIRTUAL STAGE CONTAINER --- */}
                {/* Fixed Aspect Ratio Container to enforce 'Standard' size */}
                <div className="relative h-full w-full flex items-center justify-center select-none touch-none p-4 md:p-8 z-10">
                    <div ref={containerWrapperRef} className="relative aspect-[5/6] h-full max-h-[85vh] w-auto max-w-full bg-white dark:bg-zinc-950 shadow-2xl rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800" onPointerDown={() => setSelectedElementId(null)}>
                        {isOutOfStock && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-red-600/90 text-white px-8 py-4 rounded-2xl backdrop-blur-sm shadow-2xl transform -rotate-12 border-2 border-white"><span className="text-4xl font-black uppercase tracking-widest flex items-center gap-3"><AlertOctagon size={32}/> Agotado</span></div>}
                        
                        {/* Loading Overlay */}
                        {!isImageLoaded && !isOutOfStock && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300">
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-xl">
                                    <Loader2 className="animate-spin text-yellow-400 w-8 h-8"/>
                                </div>
                            </div>
                        )}

                        {/* The Scaled Stage: 500x600 px */}
                        <div 
                            id="virtual-stage"
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
                                src={currentImage} 
                                onLoad={() => setIsImageLoaded(true)}
                                className={`w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] pointer-events-none select-none transition-all duration-700 ease-in-out relative z-10 ${view === 'BACK' ? 'scale-x-[-1]' : ''} ${isOutOfStock ? 'grayscale opacity-50' : ''} ${isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                            />
                            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                                <div className="absolute inset-0 pointer-events-auto">
                                    {(view === 'FRONT' ? frontText : backText) && renderInteractiveElement('text1', 
                                        <span 
                                            style={{ fontSize: '48px' }}
                                            className={`${fonts.find(f => f.id === (view === 'FRONT' ? frontFontId : backFontId))?.cssFamily} text-[#6b7280] whitespace-nowrap font-bold`}
                                        >
                                            {view === 'FRONT' ? frontText : backText}
                                        </span>, 
                                        view === 'FRONT' ? frontDesign : backDesign
                                    )}
                                    {(view === 'FRONT' ? frontText2 : backText2) && renderInteractiveElement('text2', 
                                        <span 
                                            style={{ fontSize: '32px' }}
                                            className={`${fonts.find(f => f.id === (view === 'FRONT' ? frontFontId2 : backFontId2))?.cssFamily} text-[#6b7280] whitespace-nowrap font-bold`}
                                        >
                                            {view === 'FRONT' ? frontText2 : backText2}
                                        </span>, 
                                        view === 'FRONT' ? frontDesign2 : backDesign2
                                    )}
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

            {/* BOTTOM BAR */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-1.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-6 w-[90%] md:w-auto justify-between md:justify-start scale-100 origin-bottom">
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2 py-1.5 rounded-lg">
                     <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-md text-zinc-500 hover:text-black font-bold shadow-sm active:scale-90 transition-transform text-xs" disabled={isOutOfStock}>-</button>
                     <span className="font-black text-sm min-w-[16px] text-center">{quantity}</span>
                     <button onClick={() => setQuantity(quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-md text-zinc-500 hover:text-black font-bold shadow-sm active:scale-90 transition-transform text-xs" disabled={isOutOfStock}>+</button>
                </div>
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>
                <button onClick={() => handleSaveClick(false)} className="p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors active:scale-90" title="Guardar Borrador"><Save size={18}/></button>
                <button onClick={() => handleSaveClick(true)} disabled={isOutOfStock} className={`flex-1 md:flex-none px-6 md:px-8 py-2 font-black uppercase text-[10px] tracking-[0.2em] rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${isOutOfStock ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300 text-black'}`}><span className="hidden md:inline">{isOutOfStock ? 'Agotado' : 'Agregar'}</span> <Zap size={16} fill={isOutOfStock ? 'none' : 'black'}/></button>
            </div>
        </div>

        {/* FONT MODAL */}
        {isFontModalOpen && (
            <div className="fixed inset-0 z-[200] flex flex-col justify-end md:justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFontModalOpen(false)}></div>
                <div className="bg-white dark:bg-zinc-950 z-10 w-full md:w-[800px] md:h-[600px] md:mx-auto md:rounded-3xl rounded-t-[2.5rem] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden max-h-[85vh]">
                    <div className="md:hidden w-16 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-4 mb-2 shrink-0" />
                    <div className="h-20 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 md:px-8 shrink-0">
                        <h2 className="text-3xl font-sans font-bold uppercase text-zinc-900 dark:text-white tracking-wide">Tipografía</h2>
                        <button onClick={() => setIsFontModalOpen(false)} className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 transition-colors"><X size={24}/></button>
                    </div>
                    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 overflow-x-auto no-scrollbar shrink-0 flex gap-3">
                        {(['TODAS', 'BASICAS', 'DEPORTE', 'CURSIVA', 'FONTS 2026', 'KIDS'] as const).map(cat => (
                            <button key={cat} onClick={() => setFontCategory(cat as any)} className={`px-5 py-2.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${fontCategory === cat ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-zinc-50 dark:bg-black">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {filteredFonts.map(f => {
                                const isSelected = getCurrentFontId(fontModalTarget) === f.id;
                                const txt = (view === 'FRONT' ? (fontModalTarget === 'text1' ? frontText : frontText2) : (fontModalTarget === 'text1' ? backText : backText2)) || 'Muestra';
                                return (
                                    <button key={f.id} onClick={() => handleFontSelect(f.id)} className={`h-36 md:h-44 rounded-3xl flex flex-col items-center justify-center p-3 border-2 transition-all ${isSelected ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400'}`}>
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
                onSelectTemplate={(template) => {
                    if (template.texts.length > 0) {
                        // Helper to find font ID by name
                        const getFontId = (fontName: string): number => {
                            const found = fonts.find(f => 
                                f.name.toLowerCase() === fontName.toLowerCase() || 
                                f.cssFamily?.toLowerCase() === fontName.toLowerCase()
                            );
                            return found?.id || initialFontId || 1;
                        };
                        
                        if (view === 'FRONT') {
                            // Apply first text
                            const text1 = template.texts[0];
                            const content1 = typeof text1 === 'string' ? text1 : text1.content;
                            const fontName1 = typeof text1 === 'string' ? 'Bebas Neue' : (text1.fontFamily || 'Bebas Neue');
                            
                            setFrontText(content1);
                            setFrontFontId(getFontId(fontName1));
                            

                            
                            // Apply second text if exists
                            if (template.texts.length > 1) {
                                const text2 = template.texts[1];
                                const content2 = typeof text2 === 'string' ? text2 : text2.content;
                                const fontName2 = typeof text2 === 'string' ? 'Plus Jakarta Sans' : (text2.fontFamily || 'Plus Jakarta Sans');
                                
                                setFrontText2(content2);
                                setFrontFontId2(getFontId(fontName2));
                                

                            }
                            
                            // Apply positions if defined
                            if (typeof text1 !== 'string' && text1.yPosition !== undefined) {
                                setFrontDesign(prev => ({ ...prev, y: text1.yPosition || 40 }));
                            }
                            if (template.texts[1] && typeof template.texts[1] !== 'string' && template.texts[1].yPosition !== undefined) {
                                setFrontDesign2(prev => ({ ...prev, y: template.texts[1].yPosition || 65 }));
                            }
                        } else {
                            // Apply to back
                            const text1 = template.texts[0];
                            const content1 = typeof text1 === 'string' ? text1 : text1.content;
                            const fontName1 = typeof text1 === 'string' ? 'Bebas Neue' : (text1.fontFamily || 'Bebas Neue');
                            
                            setBackText(content1);
                            setBackFontId(getFontId(fontName1));
                            

                            
                            if (template.texts.length > 1) {
                                const text2 = template.texts[1];
                                const content2 = typeof text2 === 'string' ? text2 : text2.content;
                                const fontName2 = typeof text2 === 'string' ? 'Plus Jakarta Sans' : (text2.fontFamily || 'Plus Jakarta Sans');
                                
                                setBackText2(content2);
                                setBackFontId2(getFontId(fontName2));
                                

                            }
                        }
                    }
                    setShowTemplates(false);
                }}
                onClose={() => setShowTemplates(false)}
            />
        )}

        {/* MONOGRAMS MODAL */}
        {showMonograms && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <MonogramLibrary
                        onSelectMonogram={(monogram) => {
                            // Apply the monogram as text
                            if (view === 'FRONT') {
                                setFrontText(monogram.text);
                            } else {
                                setBackText(monogram.text);
                            }
                            setShowMonograms(false);
                        }}
                        onGenerateAI={async (prompt) => {
                            // This would integrate with AI service
                            // For now, return placeholder
                            console.log('AI prompt:', prompt);
                            return '';
                        }}
                    />
                    <button
                        onClick={() => setShowMonograms(false)}
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

import {EngravingText} from './EngravingText';

import React, { useState, useRef, useEffect } from 'react';
import { Ruler, Maximize2, X } from 'lucide-react';
import { DesignState, LogoItem } from '../types';

interface TechnicalPreviewProps {
  imageUrl: string | undefined;
  compact?:boolean;
  imageScale?:number;
  inkColor?:string;
  text: string;
  text2?: string;
  fontName: string | undefined;
  fontCss: string;
  fontId?: number | string;
  hideElementCounts?: boolean;
  font2Css?: string;
  logos: LogoItem[];
  designState: DesignState;
  designState2?: DesignState;
  sideLabel: string;
  referencePhoto?: boolean;
  referenceLabel?: string;
  allowExpand?: boolean;
}

// CONSTANTS MATCHING PRODUCT VISUALIZER
const STAGE_WIDTH = 500;
const STAGE_HEIGHT = 600;

export const TechnicalPreview: React.FC<TechnicalPreviewProps> = ({ 
  imageUrl, compact=false, imageScale=1.45,inkColor='#e4e4e7', text, text2, fontName, fontId, hideElementCounts=false, fontCss, font2Css, logos, designState, designState2, sideLabel, referencePhoto=false, referenceLabel, allowExpand=false
}) => {
  const [showGuides, setShowGuides] = useState(!compact);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Fallback defaults
  const safeDesign = designState || { x: 50, y: 50, scale: 1, rotate: 0 };
  const safeDesign2 = designState2 || { x: 50, y: 55, scale: 1, rotate: 0 };
  
  // Translation for display
  const displayLabel = sideLabel.toUpperCase().includes('FRENTE') || sideLabel.toUpperCase().includes('LADO A') ? 'FRENTE' : sideLabel.toUpperCase().includes('REVERSO') ? 'REVERSO' : 'POSTERIOR';
  const isBackView = sideLabel.toUpperCase().includes('DORSO') || sideLabel.toUpperCase().includes('POSTERIOR') || sideLabel.toUpperCase().includes('LADO B');

  // Auto-Scale Logic: Fit 500x600 into whatever space we have
  useEffect(() => {
      const updateScale = () => {
          if (!containerRef.current) return;
          const parentWidth = containerRef.current.clientWidth;
          
          // Since the container is forced to aspect 5:6, we can just derive scale from width
          // 500px width = scale 1.0
          const scale = parentWidth / STAGE_WIDTH;
          
          setScaleFactor(scale);
      };

      updateScale();
      window.addEventListener('resize', updateScale);
      const observer = new ResizeObserver(updateScale);
      if(containerRef.current) observer.observe(containerRef.current);

      return () => {
          window.removeEventListener('resize', updateScale);
          observer.disconnect();
      };
  }, []);

  return (
    <>
    <div className="group relative w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
       
       {/* HEADER */}
       <div className="h-10 shrink-0 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-2 bg-zinc-50/50 dark:bg-zinc-900/50">
           <div className="flex items-center gap-2 min-w-0">
               <div className={`w-2 h-2 rounded-full ${text || text2 || logos.length > 0 ? 'bg-green-500' : 'bg-zinc-300'}`}></div>
               <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{displayLabel}</span>
           </div>
           {!compact&&<button 
             onClick={() => setShowGuides(!showGuides)} 
             className={`p-1.5 rounded-md transition-colors ${showGuides ? 'bg-amber-500 text-white' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`} 
             title="Alternar Guías"
           >
             <Ruler size={12}/>
           </button>}
           {allowExpand&&<button
             onClick={() => setExpanded(true)}
             className="p-1.5 rounded-md transition-colors text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
             title="Ampliar vista"
             aria-label={`Ampliar vista ${displayLabel}`}
           >
             <Maximize2 size={12}/>
           </button>}
       </div>

       {/* PREVIEW AREA - SCALE-DOWN VIRTUAL CANVAS WITH FORCED ASPECT RATIO. overflow-clip: never a scroll container, canvas cannot be displaced. */}
       <div ref={containerRef} className="relative w-full aspect-[5/6] flex items-center justify-center p-0 bg-white dark:bg-black overflow-clip border-t border-zinc-100 dark:border-zinc-800">
           
           {/* Background Grid */}
           {showGuides && (
               <div className="absolute inset-0 pointer-events-none opacity-20 z-0" 
                    style={{ backgroundImage: 'radial-gradient(circle, #9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
               </div>
           )}

           {/* Center Guides */}
           {showGuides && (
               <>
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-red-500/20 z-0"></div>
                <div className="absolute left-0 right-0 top-1/2 h-px bg-red-500/20 z-0"></div>
               </>
           )}

           {(referencePhoto||referenceLabel) && (
               <span className="absolute bottom-2 left-2 z-20 text-[10px] font-black uppercase tracking-widest bg-zinc-950/80 text-white px-2 py-1 rounded-md pointer-events-none">{referenceLabel||'Foto de referencia'}</span>
           )}

           {/* THE VIRTUAL STAGE - EXACTLY 500x600 PIXELS. Absolute wrapper: the unscaled 500x600 layout box must not stretch the aspect-[5/6] container. */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div 
                style={{
                    width: `${STAGE_WIDTH}px`,
                    height: `${STAGE_HEIGHT}px`,
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'center center',
                    boxShadow: showGuides ? '0 0 0 1px rgba(245, 158, 11, 0.3)' : 'none'
                }}
                className="relative flex items-center justify-center select-none shrink-0"
           >
               {imageUrl ? (
                   <>
                        {/* 1. Base Image - Contains exactly like Visualizer */}
                        <img 
                            src={imageUrl} style={{transform:`scale(${imageScale})`}}
                            className={`lm-product-photo w-full h-full object-contain drop-shadow-xl pointer-events-none`} 
                            alt="Product Base"
                        />
                        
                        {/* 2. Overlay Container - Matches Visualizer Overlay Logic exactly */}
                        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                            <div className="absolute inset-0">
                                
                                {/* TEXT LINE 1 - Exact Size (48px) */}
                                {text && (
                                    <div 
                                        className="absolute origin-center whitespace-nowrap text-center flex flex-col items-center"
                                        style={{ 
                                            left: `${safeDesign.x}%`, 
                                            top: `${safeDesign.y}%`, 
                                            transform: `translate(-50%, -50%) rotate(${safeDesign.rotate}deg) scale(${safeDesign.scale})`,
                                        }}
                                    >
                                        <EngravingText text={text} fontCss={fontCss} baseSize={48} color={inkColor} lineHeight={safeDesign.textLineHeight} lineSizes={safeDesign.textLineSizes}/>
                                        {showGuides && <div className="absolute -inset-2 border border-blue-400/50"></div>}
                                    </div>
                                )}

                                {/* TEXT LINE 2 - Exact Size (32px) */}
                                {text2 && (
                                    <div 
                                        className="absolute origin-center whitespace-nowrap text-center flex flex-col items-center"
                                        style={{ 
                                            left: `${safeDesign2.x}%`, 
                                            top: `${safeDesign2.y}%`, 
                                            transform: `translate(-50%, -50%) rotate(${safeDesign2.rotate}deg) scale(${safeDesign2.scale})`,
                                        }}
                                    >
                                        <EngravingText text={text2} fontCss={font2Css||fontCss} color={inkColor} lineHeight={safeDesign2.textLineHeight} lineSizes={safeDesign2.textLineSizes}/>
                                        {showGuides && <div className="absolute -inset-2 border border-blue-400/50"></div>}
                                    </div>
                                )}

                                {/* LOGOS - Exact Width (160px) */}
                                {logos && logos.map((logo) => (
                                    <div 
                                        key={logo.id}
                                        className="absolute origin-center"
                                        style={{ 
                                            left: `${logo.state.x}%`, 
                                            top: `${logo.state.y}%`, 
                                            transform: `translate(-50%, -50%) rotate(${logo.state.rotate}deg) scale(${logo.state.scale})`
                                        }}
                                    >
                                        <img 
                                            src={logo.url} 
                                            style={{ width: '160px' }} // MATCHES VISUALIZER FIXED PX
                                            className="h-auto"
                                            alt="Logo Overlay"
                                        />
                                        {showGuides && <div className="absolute -inset-2 border border-blue-400/50"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                   </>
               ) : (
                   <div className="text-zinc-300 text-xs font-mono border-2 border-dashed border-zinc-200 p-4">NO IMAGE</div>
               )}
           </div>
           </div>
       </div>
       
       {/* FOOTER METADATA */}
       {!compact&&<div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono text-zinc-500 uppercase shrink-0">
           <div>
               <span className="block font-bold text-zinc-400">Tipografía</span>
               <span className="block font-black text-zinc-900 dark:text-white break-words leading-tight">{fontId != null ? `#${fontId}${fontName ? ' · ' + fontName : ''}` : fontName || '-'}</span>
           </div>
           {!hideElementCounts&&<div className="sm:text-right">
               <span className="block font-bold text-zinc-400">Elementos</span>
               <span>Textos: {(text ? 1 : 0) + (text2 ? 1 : 0)} · Imágenes: {logos.length}</span>
           </div>}
       </div>}
    </div>
    {allowExpand&&expanded&&(
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setExpanded(false)}>
        <div className="relative w-full" style={{maxWidth:'min(92vw, 480px)'}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setExpanded(false)} aria-label="Cerrar vista ampliada" className="absolute -top-11 right-0 p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={18}/>
          </button>
          <TechnicalPreview
            referenceLabel={referenceLabel} referencePhoto={referencePhoto} imageUrl={imageUrl} imageScale={imageScale} inkColor={inkColor}
            text={text} text2={text2} fontName={fontName} fontId={fontId} hideElementCounts={hideElementCounts} fontCss={fontCss} font2Css={font2Css}
            logos={logos} designState={designState} designState2={designState2}
            sideLabel={sideLabel}
          />
        </div>
      </div>
    )}
    </>
  );
};

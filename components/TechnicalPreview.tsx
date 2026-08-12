
import React, { useState, useRef, useEffect } from 'react';
import { Ruler } from 'lucide-react';
import { DesignState, LogoItem } from '../types';

interface TechnicalPreviewProps {
  imageUrl: string | undefined;
  text: string;
  text2?: string;
  fontName: string | undefined;
  fontCss: string;
  font2Css?: string;
  logos: LogoItem[];
  designState: DesignState;
  designState2?: DesignState;
  sideLabel: string;
}

// CONSTANTS MATCHING PRODUCT VISUALIZER
const STAGE_WIDTH = 500;
const STAGE_HEIGHT = 600;

export const TechnicalPreview: React.FC<TechnicalPreviewProps> = ({ 
  imageUrl, text, text2, fontName, fontCss, font2Css, logos, designState, designState2, sideLabel 
}) => {
  const [showGuides, setShowGuides] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Fallback defaults
  const safeDesign = designState || { x: 50, y: 50, scale: 1, rotate: 0 };
  const safeDesign2 = designState2 || { x: 50, y: 55, scale: 1, rotate: 0 };
  
  // Translation for display
  const displayLabel = sideLabel === 'FRENTE' || sideLabel === 'LADO A' ? 'FRENTE' : 'POSTERIOR';
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
    <div className="group relative w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
       
       {/* HEADER */}
       <div className="h-10 shrink-0 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-4 bg-zinc-50/50 dark:bg-zinc-900/50">
           <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${text || text2 || logos.length > 0 ? 'bg-green-500' : 'bg-zinc-300'}`}></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{displayLabel}</span>
           </div>
           <button 
             onClick={() => setShowGuides(!showGuides)} 
             className={`p-1.5 rounded-md transition-colors ${showGuides ? 'bg-amber-500 text-white' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`} 
             title="Alternar Guías"
           >
             <Ruler size={12}/>
           </button>
       </div>

       {/* PREVIEW AREA - SCALE-DOWN VIRTUAL CANVAS WITH FORCED ASPECT RATIO */}
       <div ref={containerRef} className="relative w-full aspect-[5/6] flex items-center justify-center p-0 bg-white dark:bg-black overflow-hidden border-t border-zinc-100 dark:border-zinc-800">
           
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

           {/* THE VIRTUAL STAGE - EXACTLY 500x600 PIXELS */}
           <div 
                style={{
                    width: `${STAGE_WIDTH}px`,
                    height: `${STAGE_HEIGHT}px`,
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'center center',
                    boxShadow: showGuides ? '0 0 0 1px rgba(245, 158, 11, 0.3)' : 'none'
                }}
                className="relative flex items-center justify-center select-none"
           >
               {imageUrl ? (
                   <>
                        {/* 1. Base Image - Contains exactly like Visualizer */}
                        <img 
                            src={imageUrl} 
                            className={`w-full h-full object-contain drop-shadow-xl pointer-events-none ${isBackView ? 'scale-x-[-1]' : ''}`} 
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
                                        <span 
                                            className={`select-none text-[#6b7280] ${fontCss} font-bold`}
                                            style={{ 
                                                fontSize: '48px', // MATCHES VISUALIZER FIXED PX
                                                lineHeight: '1',
                                                mixBlendMode: 'normal' 
                                            }}
                                        >
                                            {text}
                                        </span>
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
                                        <span 
                                            className={`select-none text-[#6b7280] ${font2Css || fontCss} font-bold`}
                                            style={{ 
                                                fontSize: '32px', // MATCHES VISUALIZER FIXED PX
                                                lineHeight: '1',
                                            }}
                                        >
                                            {text2}
                                        </span>
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
       
       {/* FOOTER METADATA */}
       <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-3 grid grid-cols-2 gap-2 text-[8px] font-mono text-zinc-500 uppercase shrink-0">
           <div>
               <span className="block font-bold text-zinc-400">Fuente L1</span>
               <span className="truncate block font-black text-zinc-900 dark:text-white">{fontName || '-'}</span>
           </div>
           <div className="text-right">
               <span className="block font-bold text-zinc-400">Elementos</span>
               <span>Txt:{text ? '1' : '0'}{text2 ? '+1' : ''} | Img:{logos.length}</span>
           </div>
       </div>
    </div>
  );
};

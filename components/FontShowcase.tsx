import React, { useState, useMemo } from 'react';
import { FontOption, FontCategory } from '../types';
import { Type, Plus, Minus, ArrowLeft } from 'lucide-react';

interface FontShowcaseProps {
  fonts: FontOption[];
  // fontSizePx: tamaño elegido en la galería; App lo pasa al personalizador
  // como escala inicial (ver App.tsx, flujo preSelectedFont).
  onSelectFont: (fontId: number, text: string, fontSizePx?: number) => void;
  onBack?: () => void;
}

// Etiquetas visibles en español neutro. El valor guardado en la fuente
// (FontCategory) no se cambia: 'FONTS 2026' y 'KIDS' siguen siendo los
// valores en constants.ts / lm_fonts_v10; aquí solo se traduce la etiqueta.
const CATEGORY_LABELS: Record<string, string> = {
  TODAS: 'Todas',
  BASICAS: 'Básicas',
  DEPORTE: 'Deporte',
  CURSIVA: 'Cursiva',
  'FONTS 2026': 'Tendencia',
  KIDS: 'Infantil',
};

const categoryLabel = (cat: string | undefined): string =>
  CATEGORY_LABELS[cat || 'BASICAS'] || cat || 'Básica';

export const FontShowcase: React.FC<FontShowcaseProps> = ({ fonts = [], onSelectFont, onBack }) => {
  const [previewText, setPreviewText] = useState('');
  const [activeCategory, setActiveCategory] = useState<FontCategory | 'TODAS'>('TODAS');
  const [globalFontSize, setGlobalFontSize] = useState(64); // Tamaño global en px

  const categories: (FontCategory | 'TODAS')[] = ['TODAS', 'BASICAS', 'DEPORTE', 'CURSIVA', 'FONTS 2026', 'KIDS'];

  const filteredFonts = useMemo(() => {
    let result = fonts;
    if (activeCategory !== 'TODAS') {
      result = result.filter(f => (f.category || 'BASICAS') === activeCategory);
    }
    return result;
  }, [fonts, activeCategory]);

  // Número de orden en la lista completa (1, 2, 3...), no el ID interno
  // legacy (999, 101, 105...), que tiene huecos y confunde. Los IDs no se
  // renumeran: los diseños guardados los referencian.
  const orderNumberOf = (fontId: number): number => {
    const idx = fonts.findIndex(f => f.id === fontId);
    return idx >= 0 ? idx + 1 : fontId;
  };

  // Elegir una fuente abre el personalizador con esa fuente y el tamaño
  // actual como escala inicial (lo resuelve App.tsx).
  const handleCardClick = (font: FontOption) => {
    onSelectFont(font.id, previewText, globalFontSize);
  };
  return (
    <div className="max-w-[95%] mx-auto px-6 md:px-10 py-8 bg-white dark:bg-zinc-950 min-h-screen">
      {/* Barra superior opcional con botón de regreso */}
      {onBack && (
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al catálogo
          </button>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Toca una fuente para usarla en el diseñador.
          </p>
        </div>
      )}

      {/* Header con controles globales */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="flex-1">
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat as any)} 
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-amber-500 text-white' : 'bg-zinc-200/20 dark:bg-zinc-800/30 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Global Font Size Slider - Mejorado */}
        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-bold text-zinc-500 uppercase whitespace-nowrap">Tamaño</span>
          <button 
            onClick={() => setGlobalFontSize(Math.max(20, globalFontSize - 4))}
            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center hover:border-amber-500 hover:text-amber-500 transition-all active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="range"
            min="20"
            max="120"
            step="2"
            value={globalFontSize}
            onChange={(e) => setGlobalFontSize(Number(e.target.value))}
            className="w-40 h-2 bg-zinc-300 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <button 
            onClick={() => setGlobalFontSize(Math.min(120, globalFontSize + 4))}
            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center hover:border-amber-500 hover:text-amber-500 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 w-12 text-center tabular-nums">{globalFontSize}px</span>
        </div>
      </div>

      {/* Preview Input */}
      <div className="mb-8">
        <div className="relative">
          <Type className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20}/>
          <input 
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="ESCRIBE AQUÍ PARA PROBAR TUS FUENTES..."
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 pl-16 rounded-2xl text-2xl font-bold uppercase text-zinc-900 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Font Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredFonts.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            No hay fuentes disponibles en esta categoría
          </div>
        )}
        {filteredFonts.map(font => {
          if (!font || !font.id) return null;
          // La vista previa usa la clase CSS de la fuente (index.css): es la
          // misma clase que usa el editor, no un mapa duplicado.
          const fontClass = font.cssFamily || '';
          
          return (
            <div
              key={font.id}
              className={`bg-white dark:bg-zinc-900 border-2 rounded-2xl overflow-hidden flex flex-col cursor-pointer group hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-zinc-200 dark:border-zinc-700 ${font.active === false ? 'opacity-40' : ''}`}
              onClick={() => handleCardClick(font)}
            >
              {/* Preview area */}
              <div className="flex-1 flex items-center justify-center px-4 py-6 min-h-[160px] bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 group-hover:from-yellow-50 group-hover:to-amber-50 dark:group-hover:from-zinc-800 dark:group-hover:to-zinc-900 transition-colors duration-300 overflow-hidden">
                <span 
                  className={`text-zinc-900 dark:text-white text-center leading-tight select-none group-hover:scale-105 transition-transform duration-300 break-words max-w-full ${fontClass}`}
                  style={{ 
                    fontSize: `${globalFontSize}px`,
                    lineHeight: '1.1'
                  }}
                >
                  {previewText || 'Aa'}
                </span>
              </div>

              {/* Footer */}
              <div className="border-t px-5 py-4 flex items-center justify-between gap-2 transition-colors duration-300 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 group-hover:bg-yellow-400 dark:group-hover:bg-yellow-400">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-lg text-xs font-black tabular-nums shadow-sm transition-colors duration-300 bg-yellow-400 text-black group-hover:bg-black group-hover:text-yellow-400">#{orderNumberOf(font.id)}</span>
                    <p className="font-bold text-xs uppercase tracking-wide truncate transition-colors duration-300 text-zinc-900 dark:text-white group-hover:text-black">{font.name || 'Fuente'}</p>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest mt-1 font-bold transition-colors duration-300 text-zinc-400 group-hover:text-black/70">{categoryLabel(font.category)}</p>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-black/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300 text-zinc-400 group-hover:text-black"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FontShowcase;

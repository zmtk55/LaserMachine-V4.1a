import React, { useState, useMemo } from 'react';
import { FontOption, FontCategory } from '../types';
import { Type, Plus, Minus, RotateCcw } from 'lucide-react';

interface FontShowcaseProps {
  fonts: FontOption[];
  onSelectFont: (fontId: number, text: string) => void;
}

export const FontShowcase: React.FC<FontShowcaseProps> = ({ fonts, onSelectFont }) => {
  const [previewText, setPreviewText] = useState('');
  const [activeCategory, setActiveCategory] = useState<FontCategory | 'TODAS'>('TODAS');
  const [globalFontSize, setGlobalFontSize] = useState(64); // Tamaño global en px
  const [selectedFontId, setSelectedFontId] = useState<number | null>(null); // Font con tamaño individual
  const [individualSizes, setIndividualSizes] = useState<Record<number, number>>({}); // Tamaños individuales

  const categories: (FontCategory | 'TODAS')[] = ['TODAS', 'BASICAS', 'DEPORTE', 'CURSIVA', 'FONTS 2026', 'KIDS'];

  const filteredFonts = useMemo(() => {
    let result = fonts;
    if (activeCategory !== 'TODAS') {
      result = result.filter(f => (f.category || 'BASICAS') === activeCategory);
    }
    return result;
  }, [fonts, activeCategory]);

  // Obtener tamaño para una fuente específica
  const getFontSize = (fontId: number): number => {
    if (individualSizes[fontId]) {
      return individualSizes[fontId];
    }
    return globalFontSize;
  };

  // Manejar click en card para seleccionar y ajustar
  const handleCardClick = (font: FontOption) => {
    if (selectedFontId === font.id) {
      // Si ya está seleccionada, deseleccionar
      setSelectedFontId(null);
    } else {
      // Seleccionar esta fuente
      setSelectedFontId(font.id);
    }
    onSelectFont(font.id, previewText);
  };

  // Ajustar tamaño individual de la fuente seleccionada
  const adjustSelectedFontSize = (delta: number) => {
    if (selectedFontId === null) return;
    
    setIndividualSizes(prev => ({
      ...prev,
      [selectedFontId]: Math.max(20, Math.min(120, (prev[selectedFontId] || globalFontSize) + delta))
    }));
  };

  // Resetear tamaños individuales
  const resetIndividualSizes = () => {
    setIndividualSizes({});
    setSelectedFontId(null);
  };

  return (
    <div className="max-w-[95%] mx-auto px-6 md:px-10 py-8">
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
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Global Font Size Slider */}
        <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-bold text-zinc-500 uppercase whitespace-nowrap">Tamaño Global</span>
          <button 
            onClick={() => setGlobalFontSize(Math.max(20, globalFontSize - 8))}
            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center hover:bg-amber-50 transition-colors"
          >
            <Minus className="w-4 h-4 text-zinc-600" />
          </button>
          <input
            type="range"
            min="20"
            max="120"
            step="4"
            value={globalFontSize}
            onChange={(e) => setGlobalFontSize(Number(e.target.value))}
            className="w-32 accent-amber-500"
          />
          <button 
            onClick={() => setGlobalFontSize(Math.min(120, globalFontSize + 8))}
            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center hover:bg-amber-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-zinc-600" />
          </button>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-12 text-center">{globalFontSize}px</span>
          {(Object.keys(individualSizes).length > 0 || selectedFontId) && (
            <button
              onClick={resetIndividualSizes}
              className="ml-2 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 transition-colors"
              title="Resetear tamaños individuales"
            >
              <RotateCcw className="w-4 h-4 text-zinc-600" />
            </button>
          )}
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

      {/* Selected Font Controls */}
      {selectedFontId && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Ajustando: {fonts.find(f => f.id === selectedFontId)?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => adjustSelectedFontSize(-8)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
            >
              <Minus className="w-5 h-5 text-amber-600" />
            </button>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400 w-16 text-center">
              {getFontSize(selectedFontId)}px
            </span>
            <button 
              onClick={() => adjustSelectedFontSize(8)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
            >
              <Plus className="w-5 h-5 text-amber-600" />
            </button>
          </div>
        </div>
      )}
      
      {/* Font Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredFonts.map(font => {
          const fontSize = getFontSize(font.id);
          const isSelected = selectedFontId === font.id;
          
          return (
            <div
              key={font.id}
              className={`bg-white dark:bg-zinc-900 border-2 rounded-2xl overflow-hidden flex flex-col cursor-pointer group hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${font.active === false ? 'opacity-40' : ''} ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-200 dark:border-zinc-700'}`}
              onClick={() => handleCardClick(font)}
            >
              {/* Preview area */}
              <div className="flex-1 flex items-center justify-center px-4 py-6 min-h-[160px] bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 group-hover:from-yellow-50 group-hover:to-amber-50 dark:group-hover:from-zinc-800 dark:group-hover:to-zinc-900 transition-colors duration-300 overflow-hidden">
                <span 
                  className={`${font.cssFamily} text-zinc-900 dark:text-white text-center leading-tight select-none group-hover:scale-105 transition-transform duration-300 break-words max-w-full`}
                  style={{ 
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.1'
                  }}
                >
                  {previewText || 'Aa'}
                </span>
              </div>

              {/* Footer */}
              <div className={`border-t px-5 py-4 flex items-center justify-between gap-2 transition-colors duration-300 ${isSelected ? 'bg-amber-400 border-amber-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 group-hover:bg-yellow-400 dark:group-hover:bg-yellow-400'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-lg text-xs font-black tabular-nums shadow-sm transition-colors duration-300 ${isSelected ? 'bg-black text-amber-400' : 'bg-yellow-400 text-black group-hover:bg-black group-hover:text-yellow-400'}`}>#{font.id}</span>
                    <p className={`font-bold text-xs uppercase tracking-wide truncate transition-colors duration-300 ${isSelected ? 'text-black' : 'text-zinc-900 dark:text-white group-hover:text-black'}`}>{font.name}</p>
                  </div>
                  <p className={`text-[10px] uppercase tracking-widest mt-1 font-bold transition-colors duration-300 ${isSelected ? 'text-black/70' : 'text-zinc-400 group-hover:text-black/70'}`}>{font.category || 'BÁSICA'}</p>
                </div>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isSelected ? 'bg-black/20' : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-black/20'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${isSelected ? 'text-black' : 'text-zinc-400 group-hover:text-black'}`}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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

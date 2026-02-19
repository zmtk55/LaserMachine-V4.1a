
import React, { useState, useMemo } from 'react';
import { FontOption, FontCategory } from '../types';
import { Type, Search, ArrowRight, Check } from 'lucide-react';

interface FontShowcaseProps {
  fonts: FontOption[];
  onSelectFont: (fontId: number, text: string) => void;
}

export const FontShowcase: React.FC<FontShowcaseProps> = ({ fonts, onSelectFont }) => {
  const [previewText, setPreviewText] = useState('');
  const [activeCategory, setActiveCategory] = useState<FontCategory | 'TODAS'>('TODAS');

  const categories: (FontCategory | 'TODAS')[] = ['TODAS', 'BASICAS', 'DEPORTE', 'CURSIVA', 'FONTS 2026', 'KIDS'];

  const filteredFonts = useMemo(() => {
    let result = fonts;
    if (activeCategory !== 'TODAS') {
      result = result.filter(f => (f.category || 'BASICAS') === activeCategory);
    }
    return result;
  }, [fonts, activeCategory]);

  return (
    <div className="view-container font-mono-tech">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 text-center md:text-left">
          <div className="w-full md:w-auto">
            <h1 className="nike-title text-5xl md:text-8xl italic text-zinc-900 dark:text-white uppercase tracking-tighter mb-4 drop-shadow-sm">
              FONTS<span className="text-yellow-400">.</span>
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">
              Visualiza y selecciona tu tipografía favorita
            </p>
          </div>
          
          {/* Preview Input */}
          <div className="w-full md:max-w-xl relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 focus-within:border-yellow-400/50 transition-colors">
                <div className="pl-6 text-zinc-500">
                    <Type size={24} />
                </div>
                <input 
                    type="text" 
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Escribe tu texto aquí..."
                    className="w-full bg-transparent text-white p-6 text-xl md:text-2xl font-bold outline-none placeholder:text-zinc-700 font-sans tracking-wide"
                />
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-3 mb-16 justify-center md:justify-start border-b border-zinc-200 dark:border-zinc-800 pb-8">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        activeCategory === cat 
                        ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 scale-105' 
                        : 'bg-transparent border border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Fonts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredFonts.map(font => (
                <div 
                    key={font.id}
                    onClick={() => onSelectFont(font.id, previewText)}
                    className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden cursor-pointer hover:border-yellow-400 dark:hover:border-yellow-400 transition-all hover:-translate-y-2 hover:shadow-2xl relative h-72 flex flex-col backdrop-blur-sm"
                >
                    {/* Background Large Number (Restored for aesthetics) */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none group-hover:opacity-10 transition-opacity">
                        <span className="text-9xl font-black text-black dark:text-white font-industrial">{font.id}</span>
                    </div>

                    <div className="absolute top-4 left-4 z-10">
                        <span className="text-[9px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-3 py-1.5 rounded-lg uppercase tracking-widest">{font.category || 'BASICA'}</span>
                    </div>
                    
                    {/* ID Badge - Using font-industrial and larger size (text-sm) */}
                    <div className="absolute top-4 right-4 z-10">
                        <span className="text-sm font-industrial bg-yellow-400 text-black px-3 py-1.5 rounded-lg shadow-sm tracking-wider">#{font.id}</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                        <span className={`${font.cssFamily} text-6xl text-center text-zinc-900 dark:text-white transition-transform duration-500 group-hover:scale-110 break-words w-full leading-tight z-10`}>
                            {previewText || 'Aa'}
                        </span>
                        <span className="text-[10px] text-zinc-500 absolute bottom-16 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest font-black">MUESTRA</span>
                    </div>

                    <div className="p-5 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900 transition-colors relative z-20">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase text-zinc-900 dark:text-white tracking-wider">{font.name}</span>
                            <span className="text-[9px] font-bold text-zinc-400 mt-0.5">ID REF: {font.id}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                            <Check size={16} className="opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100"/>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {filteredFonts.length === 0 && (
            <div className="py-32 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <p className="text-zinc-400 font-bold uppercase tracking-widest">No hay fuentes en esta categoría</p>
            </div>
        )}
      </div>
    </div>
  );
};

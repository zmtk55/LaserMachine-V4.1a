import React, { useState, useMemo } from 'react';
import { FontOption, FontCategory } from '../types';
import { Type, Plus, Minus, ArrowLeft } from 'lucide-react';
import { Card, Button } from './ui';

// Etiquetas visibles en español neutro (el valor guardado no cambia).
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

export const ShadcnFontShowcase: React.FC<{ fonts: FontOption[]; onSelectFont: (fontId: number, text: string, fontSizePx?: number) => void; onBack?: () => void; }> = ({ fonts = [], onSelectFont, onBack }) => {
  const [previewText, setPreviewText] = useState('');
  const [activeCategory, setActiveCategory] = useState<FontCategory | 'TODAS'>('TODAS');
  const [globalFontSize, setGlobalFontSize] = useState(64);

  const categories: (FontCategory | 'TODAS')[] = ['TODAS', 'BASICAS', 'DEPORTE', 'CURSIVA', 'FONTS 2026', 'KIDS'];

  const filteredFonts = useMemo(() => {
    let result = fonts;
    if (activeCategory !== 'TODAS') {
      result = result.filter(f => (f.category || 'BASICAS') === activeCategory);
    }
    return result;
  }, [fonts, activeCategory]);

  // Número de orden en la lista completa, no el ID interno legacy.
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
    <Card className="max-w-[95%] mx-auto px-6 md:px-10 py-8 bg-white dark:bg-zinc-950 min-h-screen">
      {onBack && (
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <Button onClick={onBack} variant="outline" className="text-xs font-black uppercase tracking-widest">
            <ArrowLeft size={14} /> Volver al catálogo
          </Button>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Toca una fuente para usarla en el diseñador.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="flex-1">
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                onClick={() => setActiveCategory(cat as any)}
                className="text-xs font-bold uppercase tracking-widest"
              >
                {categoryLabel(cat)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-bold text-zinc-500 uppercase whitespace-nowrap">Tamaño Global</span>
          <Button onClick={() => setGlobalFontSize(Math.max(20, globalFontSize - 8))} variant="outline" className="w-8 h-8">
            <Minus className="w-4 h-4" />
          </Button>
          <input
            type="range"
            min="20"
            max="120"
            step="4"
            value={globalFontSize}
            onChange={e => setGlobalFontSize(Number(e.target.value))}
            className="w-32 accent-amber-500"
          />
          <Button onClick={() => setGlobalFontSize(Math.min(120, globalFontSize + 8))} variant="outline" className="w-8 h-8">
            <Plus className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-12 text-center">{globalFontSize}px</span>
        </div>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Type className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            value={previewText}
            onChange={e => setPreviewText(e.target.value)}
            placeholder="ESCRIBE AQUÍ PARA PROBAR TUS FUENTES..."
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 pl-16 rounded-2xl text-2xl font-bold uppercase text-zinc-900 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        </div>
      </div>

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
            <Card
              key={font.id}
              className={`bg-white dark:bg-zinc-900 border-2 rounded-2xl overflow-hidden flex flex-col cursor-pointer group hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-zinc-200 dark:border-zinc-700 ${font.active === false ? 'opacity-40' : ''}`}
              onClick={() => handleCardClick(font)}
            >
              <div className="flex-1 flex items-center justify-center px-4 py-6 min-h-[160px] bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 group-hover:from-yellow-50 group-hover:to-amber-50 dark:group-hover:from-zinc-800 dark:group-hover:to-zinc-900 transition-colors duration-300 overflow-hidden">
                <span
                  className={`text-zinc-900 dark:text-white text-center leading-tight select-none group-hover:scale-105 transition-transform duration-300 break-words max-w-full ${fontClass}`}
                  style={{ fontSize: `${globalFontSize}px`, lineHeight: '1.1' }}
                >
                  {previewText || 'Aa'}
                </span>
              </div>
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
            </Card>
          );
        })}
      </div>
    </Card>
  );
};

export default ShadcnFontShowcase;

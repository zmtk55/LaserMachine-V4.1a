import React, { useState } from 'react';
import { Sparkles, Type, Wand2, Loader, Copy, Check, X } from 'lucide-react';

interface MonogramLibraryProps {
  onSelectMonogram: (monogram: { text: string; style: string; svg: string }) => void;
  onGenerateAI?: (prompt: string) => Promise<string>;
}

interface MonogramStyle {
  id: string;
  name: string;
  category: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  fontSize: number;
  strokeWidth: number;
  fill: boolean;
  description: string;
}

// Pre-designed monogram styles with proper font configurations
const MONOGRAM_STYLES: MonogramStyle[] = [
  // Minimal styles
  { id: 'minimal-1', name: 'Minimal Line', category: 'Minimal', fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal', fontSize: 60, strokeWidth: 1, fill: true, description: 'Línea delgada minimalista' },
  { id: 'minimal-2', name: 'Minimal Bold', category: 'Minimal', fontFamily: 'Arial Black, sans-serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 55, strokeWidth: 0, fill: true, description: 'Negrita minimalista' },
  { id: 'minimal-3', name: 'Outline', category: 'Minimal', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 55, strokeWidth: 2, fill: false, description: 'Contorno simple' },
  
  // Script styles
  { id: 'script-1', name: 'Script Clásico', category: 'Script', fontFamily: 'Georgia, serif', fontWeight: 'normal', fontStyle: 'italic', fontSize: 50, strokeWidth: 0, fill: true, description: 'Script cursivo elegante' },
  { id: 'script-2', name: 'Script Moderno', category: 'Script', fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'italic', fontSize: 50, strokeWidth: 0, fill: true, description: 'Script moderno fluido' },
  { id: 'script-3', name: 'Cursiva Fina', category: 'Script', fontFamily: 'Times New Roman, serif', fontWeight: 'normal', fontStyle: 'italic', fontSize: 50, strokeWidth: 0, fill: true, description: 'Cursiva delicada' },
  
  // Sports styles
  { id: 'sports-1', name: 'Athletic', category: 'Deportes', fontFamily: 'Arial Black, sans-serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 50, strokeWidth: 0, fill: true, description: 'Estilo atlético bold' },
  { id: 'sports-2', name: 'Varsity', category: 'Deportes', fontFamily: 'Impact, sans-serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 45, strokeWidth: 0, fill: true, description: 'Letras de equipo universitario' },
  { id: 'sports-3', name: 'Moto', category: 'Deportes', fontFamily: 'Verdana, sans-serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 45, strokeWidth: 0, fill: true, description: 'Estilo racing' },
  
  // Western
  { id: 'western-1', name: 'Cowboy', category: 'Western', fontFamily: 'Courier New, monospace', fontWeight: 'bold', fontStyle: 'normal', fontSize: 40, strokeWidth: 0, fill: true, description: 'Estilo vaquero clásico' },
  { id: 'western-2', name: 'Ranch', category: 'Western', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 40, strokeWidth: 0, fill: true, description: 'Estilo rancho' },
  { id: 'western-3', name: 'Rodeo', category: 'Western', fontFamily: 'Times New Roman, serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 40, strokeWidth: 0, fill: true, description: 'Estilo rodeo' },
  
  // Vintage
  { id: 'vintage-1', name: 'Victorian', category: 'Vintage', fontFamily: 'Garamond, serif', fontWeight: 'normal', fontStyle: 'normal', fontSize: 40, strokeWidth: 0, fill: true, description: 'Victoriano elegante' },
  { id: 'vintage-2', name: 'Art Deco', category: 'Vintage', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal', fontSize: 40, strokeWidth: 0, fill: true, description: 'Art Deco geométrico' },
  { id: 'vintage-3', name: 'Retro', category: 'Vintage', fontFamily: 'Comic Sans MS, cursive', fontWeight: 'normal', fontStyle: 'normal', fontSize: 35, strokeWidth: 0, fill: true, description: 'Estilo retro' },
];

// Render monogram as React component
const MonogramPreview: React.FC<{ letter: string; style: MonogramStyle }> = ({ letter, style }) => {
  const letterUpper = letter.toUpperCase() || 'A';
  
  const textStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    fontSize: `${style.fontSize}px`,
    fill: style.fill ? 'currentColor' : 'none',
    stroke: !style.fill ? 'currentColor' : 'none',
    strokeWidth: style.strokeWidth,
  };
  
  return (
    <span style={textStyle} className="select-none">
      {letterUpper}
    </span>
  );
};

export const MonogramLibrary: React.FC<MonogramLibraryProps> = ({ onSelectMonogram, onGenerateAI }) => {
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('minimal-1');
  const [activeCategory, setActiveCategory] = useState('All');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const categories = ['All', 'Minimal', 'Script', 'Deportes', 'Western', 'Vintage'];
  
  const filteredStyles = activeCategory === 'All' 
    ? MONOGRAM_STYLES 
    : MONOGRAM_STYLES.filter(s => s.category === activeCategory);
  
  const currentStyle = MONOGRAM_STYLES.find(s => s.id === selectedStyle) || MONOGRAM_STYLES[0];
  
  const handleSelectMonogram = () => {
    const letter = text.trim() || 'A';
    // Create a simple SVG string
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <text x="50" y="60" text-anchor="middle" font-family="${currentStyle.fontFamily}" font-weight="${currentStyle.fontWeight}" font-style="${currentStyle.fontStyle}" font-size="${currentStyle.fontSize}" fill="${currentStyle.fill ? 'currentColor' : 'none'}" stroke="${!currentStyle.fill ? 'currentColor' : 'none'}" stroke-width="${currentStyle.strokeWidth}">${letter.toUpperCase()}</text>
    </svg>`;
    onSelectMonogram({ text: letter, style: selectedStyle, svg });
  };
  
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || !onGenerateAI) return;
    
    setIsGenerating(true);
    try {
      const imageUrl = await onGenerateAI(aiPrompt);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error('Error generating AI monogram:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
            <Type size={24} className="text-black" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-zinc-900 dark:text-white">Biblioteca de Monogramas</h3>
            <p className="text-sm text-zinc-500">Elige un estilo y escribe tus letras</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Text Input */}
        <div className="mb-6">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Tu texto (máx 3 caracteres)</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 3))}
            placeholder="ABC"
            maxLength={3}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center text-2xl font-bold tracking-widest uppercase"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-yellow-400 text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Monogram Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6 max-h-48 overflow-y-auto">
          {filteredStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`relative p-3 rounded-xl border-2 transition-all ${
                selectedStyle === style.id
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              }`}
            >
              <div className="h-12 flex items-center justify-center text-2xl font-bold text-zinc-900 dark:text-white">
                <MonogramPreview letter={text || 'A'} style={style} />
              </div>
              <p className="text-xs text-zinc-500 mt-1 truncate">{style.name}</p>
            </button>
          ))}
        </div>
        
        {/* Preview */}
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-400 mb-3 text-center">Vista previa</p>
          <div className="h-24 flex items-center justify-center text-6xl font-bold text-zinc-900 dark:text-white">
            <MonogramPreview letter={text || 'A'} style={currentStyle} />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSelectMonogram}
            disabled={!text.trim()}
            className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-300 text-black font-bold rounded-xl transition-all"
          >
            Aplicar Monograma
          </button>
        </div>
        
        {/* AI Generation Section */}
        {onGenerateAI && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 size={18} className="text-yellow-500" />
              <h4 className="font-bold text-zinc-900 dark:text-white">Generar con IA</h4>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe tu diseño..."
                className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              />
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isGenerating}
                className="px-6 py-3 bg-yellow-400 disabled:bg-zinc-300 text-black font-bold rounded-xl flex items-center gap-2"
              >
                {isGenerating ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
              </button>
            </div>
            
            {generatedImage && (
              <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-center">
                <img src={generatedImage} alt="AI Generated" className="w-24 h-24 mx-auto object-contain rounded-lg" />
                <button
                  onClick={() => onSelectMonogram({ text: aiPrompt, style: 'ai-generated', svg: generatedImage })}
                  className="w-full mt-3 py-2 bg-yellow-400 text-black font-bold rounded-lg text-sm"
                >
                  Usar esta imagen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonogramLibrary;

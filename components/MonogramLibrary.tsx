import React, { useState } from 'react';
import { Sparkles, Type, Wand2, Loader, Download, Copy, Check } from 'lucide-react';

interface MonogramLibraryProps {
  onSelectMonogram: (monogram: { text: string; style: string; svg: string }) => void;
  onGenerateAI?: (prompt: string) => Promise<string>;
}

interface MonogramStyle {
  id: string;
  name: string;
  category: string;
  preview: string; // SVG path or icon
  description: string;
}

// Pre-designed monogram styles
const MONOGRAM_STYLES: MonogramStyle[] = [
  // Minimal styles
  { id: 'minimal-1', name: 'Minimal Line', category: 'Minimal', preview: 'M', description: 'Línea delgada minimalista' },
  { id: 'minimal-2', name: 'Minimal Bold', category: 'Minimal', preview: 'M', description: 'Negrita minimalista' },
  { id: 'minimal-3', name: 'Outline', category: 'Minimal', preview: 'M', description: 'Contorno simple' },
  
  // Script styles
  { id: 'script-1', name: 'Script Clásico', category: 'Script', preview: 'M', description: 'Script cursivo elegante' },
  { id: 'script-2', name: 'Script Moderno', category: 'Script', preview: 'M', description: 'Script moderno fluido' },
  { id: 'script-3', name: 'Cursiva Fina', category: 'Script', preview: 'M', description: 'Cursiva delicada' },
  
  // Sports styles
  { id: 'sports-1', name: 'Athletic', category: 'Deportes', preview: 'M', description: 'Estilo atlético bold' },
  { id: 'sports-2', name: 'Varsity', category: 'Deportes', preview: 'M', description: 'Letras de equipo universitario' },
  { id: 'sports-3', name: 'Moto', category: 'Deportes', preview: 'M', description: 'Estilo racing' },
  
  // Western
  { id: 'western-1', name: 'Cowboy', category: 'Western', preview: 'M', description: 'Estilo vaquero clásico' },
  { id: 'western-2', name: 'Ranch', category: 'Western', preview: 'M', description: 'Estilo rancho' },
  { id: 'western-3', name: 'Rodeo', category: 'Western', preview: 'M', description: 'Estilo rodeo' },
  
  // Vintage
  { id: 'vintage-1', name: 'Victorian', category: 'Vintage', preview: 'M', description: 'Victoriano elegante' },
  { id: 'vintage-2', name: 'Art Deco', category: 'Vintage', preview: 'M', description: 'Art Deco geométrico' },
  { id: 'vintage-3', name: 'Retro', category: 'Vintage', preview: 'M', description: 'Estilo retro' },
  
  // Decorative
  { id: 'deco-1', name: 'Floral', category: 'Decorativo', preview: '✦M✦', description: 'Con elementos florales' },
  { id: 'deco-2', name: 'Corona', category: 'Decorativo', preview: 'M', description: 'Con corona' },
  { id: 'deco-3', name: 'Alas', category: 'Decorativo', preview: 'M', description: 'Con alas' },
];

// Generate SVG for monogram based on style
const generateMonogramSVG = (letter: string, styleId: string): string => {
  const letterUpper = letter.toUpperCase();
  
  const styles: Record<string, string> = {
    'minimal-1': `<text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="currentColor" stroke="currentColor" stroke-width="1">${letterUpper}</text>`,
    'minimal-2': `<text x="50%" y="60%" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="80" fill="currentColor">${letterUpper}</text>`,
    'minimal-3': `<text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="none" stroke="currentColor" stroke-width="2">${letterUpper}</text>`,
    
    'script-1': `<text x="50%" y="60%" text-anchor="middle" font-family="Brush Script MT, cursive" font-size="90" fill="currentColor">${letterUpper}</text>`,
    'script-2': `<text x="50%" y="60%" text-anchor="middle" font-family="Segoe Script, cursive" font-size="85" fill="currentColor">${letterUpper}</text>`,
    'script-3': `<text x="50%" y="60%" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="80" fill="currentColor">${letterUpper}</text>`,
    
    'sports-1': `<text x="50%" y="60%" text-anchor="middle" font-family="Impact, sans-serif" font-size="85" fill="currentColor">${letterUpper}</text>`,
    'sports-2': `<text x="50%" y="60%" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="80" fill="currentColor" stroke="currentColor" stroke-width="1">${letterUpper}</text>`,
    'sports-3': `<text x="50%" y="60%" text-anchor="middle" font-family="Verdana, sans-serif" font-weight="bold" font-size="80" fill="currentColor">${letterUpper}</text>`,
    
    'western-1': `<text x="50%" y="60%" text-anchor="middle" font-family="Rye, serif" font-size="75" fill="currentColor">${letterUpper}</text>`,
    'western-2': `<text x="50%" y="60%" text-anchor="middle" font-family="Courier New, monospace" font-weight="bold" font-size="75" fill="currentColor">${letterUpper}</text>`,
    'western-3': `<text x="50%" y="60%" text-anchor="middle" font-family="Times New Roman, serif" font-weight="bold" font-size="75" fill="currentColor">${letterUpper}</text>`,
    
    'vintage-1': `<text x="50%" y="60%" text-anchor="middle" font-family="Garamond, serif" font-size="75" fill="currentColor">${letterUpper}</text>`,
    'vintage-2': `<text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="75" fill="currentColor">${letterUpper}</text>`,
    'vintage-3': `<text x="50%" y="60%" text-anchor="middle" font-family="Comic Sans MS, cursive" font-size="70" fill="currentColor">${letterUpper}</text>`,
    
    'deco-1': `<text x="50%" y="60%" text-anchor="middle" font-family="Georgia, serif" font-size="70" fill="currentColor">✦ ${letterUpper} ✦</text>`,
    'deco-2': `<text x="50%" y="55%" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="65" fill="currentColor">${letterUpper}</text><text x="50%" y="80%" text-anchor="middle" font-size="20" fill="currentColor">▔▔▔</text>`,
    'deco-3': `<text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="60" fill="currentColor">‿ ${letterUpper} ‿</text>`,
  };
  
  const svgStyle = styles[styleId] || styles['minimal-1'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${svgStyle}</svg>`;
};

export const MonogramLibrary: React.FC<MonogramLibraryProps> = ({ onSelectMonogram, onGenerateAI }) => {
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('minimal-1');
  const [activeCategory, setActiveCategory] = useState('All');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const categories = ['All', 'Minimal', 'Script', 'Deportes', 'Western', 'Vintage', 'Decorativo'];
  
  const filteredStyles = activeCategory === 'All' 
    ? MONOGRAM_STYLES 
    : MONOGRAM_STYLES.filter(s => s.category === activeCategory);
  
  const handleSelectMonogram = () => {
    if (!text.trim()) return;
    const svg = generateMonogramSVG(text, selectedStyle);
    onSelectMonogram({ text, style: selectedStyle, svg });
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
  
  const handleCopySVG = () => {
    const svg = generateMonogramSVG(text || 'A', selectedStyle);
    navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Type size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-zinc-900 dark:text-white">Biblioteca de Monogramas</h3>
          <p className="text-sm text-zinc-500">Elige un estilo y escribe tus iniciales</p>
        </div>
      </div>
      
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
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      
      {/* Monogram Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6 max-h-64 overflow-y-auto">
        {filteredStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => setSelectedStyle(style.id)}
            className={`relative p-4 rounded-2xl border-2 transition-all ${
              selectedStyle === style.id
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
            }`}
          >
            <div className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center justify-center h-16">
              {generateSVGPreview(style.id, text || 'A')}
            </div>
            <p className="text-xs text-zinc-500 mt-2 truncate">{style.name}</p>
          </button>
        ))}
      </div>
      
      {/* Preview & Actions */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-400 mb-2">Vista previa</p>
          <div 
            className="w-24 h-24 mx-auto flex items-center justify-center text-5xl font-bold text-zinc-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: generateMonogramSVG(text || 'A', selectedStyle) }}
          />
        </div>
        
        <div className="flex-1 flex flex-col gap-2">
          <button
            onClick={handleSelectMonogram}
            disabled={!text.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 disabled:from-zinc-300 disabled:to-zinc-400 text-black font-bold rounded-xl transition-all"
          >
            Aplicar
          </button>
          <button
            onClick={handleCopySVG}
            className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado!' : 'Copiar SVG'}
          </button>
        </div>
      </div>
      
      {/* AI Generation Section */}
      {onGenerateAI && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 size={18} className="text-purple-500" />
            <h4 className="font-bold text-zinc-900 dark:text-white">Generar con IA</h4>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe tu diseño, ej: 'Logo minimalista con iniciales MG en círculo'"
              className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
            />
            <button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 disabled:from-zinc-400 disabled:to-zinc-500 text-white font-bold rounded-xl flex items-center gap-2"
            >
              {isGenerating ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Generar
            </button>
          </div>
          
          {generatedImage && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-400 mb-2">Resultado:</p>
              <img src={generatedImage} alt="AI Generated" className="w-32 h-32 mx-auto object-contain rounded-lg" />
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
  );
};

// Helper to generate SVG preview
function generateSVGPreview(styleId: string, letter: string): string {
  const svg = generateMonogramSVG(letter, styleId);
  return svg;
}

export default MonogramLibrary;

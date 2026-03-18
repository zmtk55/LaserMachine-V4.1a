import React, { useState } from 'react';
import { Sparkles, Type, Wand2, Loader, Copy, Check, X, Crown, Star, Shield, Heart, Diamond, Hexagon, Circle, Square, Mountain, PawPrint, Skull, Flame, Anchor,  } from 'lucide-react';

interface MonogramLibraryProps {
  onSelectMonogram: (monogram: { text: string; style: string; svg: string; preview: React.ReactNode }) => void;
  onGenerateAI?: (prompt: string) => Promise<string>;
}

// Pre-designed monogram/emblem templates
interface MonogramTemplate {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  svg: (letter: string) => string;
}

// Library of pre-designed monogram templates
const MONOGRAM_TEMPLATES: MonogramTemplate[] = [
  // Circle based
  { id: 'circle-plain', name: 'Círculo Simple', category: 'Círculos', icon: <Circle size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="40" fill="currentColor">${l}</text></svg>` },
  { id: 'circle-filled', name: 'Círculo Relleno', category: 'Círculos', icon: <Circle size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="currentColor"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="40" fill="white">${l}</text></svg>` },
  { id: 'circle-double', name: 'Doble Círculo', category: 'Círculos', icon: <Circle size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="1"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="35" fill="currentColor">${l}</text></svg>` },
  
  // Shield based
  { id: 'shield-plain', name: 'Escudo Simple', category: 'Escudos', icon: <Shield size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><path d="M50 5 L95 25 L95 55 Q95 85 50 95 Q5 85 5 55 L5 25 Z" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="40" fill="currentColor">${l}</text></svg>` },
  { id: 'shield-filled', name: 'Escudo Relleno', category: 'Escudos', icon: <Shield size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><path d="M50 5 L95 25 L95 55 Q95 85 50 95 Q5 85 5 55 L5 25 Z" fill="currentColor"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="40" fill="white">${l}</text></svg>` },
  { id: 'shield-crown', name: 'Escudo con Corona', category: 'Escudos', icon: <Crown size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><path d="M50 5 L95 25 L95 55 Q95 85 50 95 Q5 85 5 55 L5 25 Z" fill="currentColor"/><text x="50" y="65" text-anchor="middle" font-family="Arial Black" font-size="35" fill="white">${l}</text><text x="50" y="25" text-anchor="middle" font-size="15" fill="white">♛</text></svg>` },
  
  // Crown based
  { id: 'crown-plain', name: 'Corona Simple', category: 'Coronas', icon: <Crown size={24} />, svg: (l) => `<svg viewBox="0 0 100 60"><path d="M10 50 L20 20 L35 35 L50 10 L65 35 L80 20 L90 50 Z" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="45" text-anchor="middle" font-family="Arial Black" font-size="30" fill="currentColor">${l}</text></svg>` },
  { id: 'crown-filled', name: 'Corona Rellena', category: 'Coronas', icon: <Crown size={24} />, svg: (l) => `<svg viewBox="0 0 100 60"><path d="M10 50 L20 20 L35 35 L50 10 L65 35 L80 20 L90 50 Z" fill="currentColor"/><text x="50" y="45" text-anchor="middle" font-family="Arial Black" font-size="30" fill="white">${l}</text></svg>` },
  
  // Star based
  { id: 'star-plain', name: 'Estrella Simple', category: 'Estrellas', icon: <Star size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="62" text-anchor="middle" font-family="Arial Black" font-size="30" fill="currentColor">${l}</text></svg>` },
  { id: 'star-filled', name: 'Estrella Rellena', category: 'Estrellas', icon: <Star size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" fill="currentColor"/><text x="50" y="62" text-anchor="middle" font-family="Arial Black" font-size="30" fill="white">${l}</text></svg>` },
  { id: 'star-6', name: 'Hexagrama', category: 'Estrellas', icon: <Hexagon size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="40" fill="currentColor">${l}</text></svg>` },
  
  // Heart based
  { id: 'heart-plain', name: 'Corazón Simple', category: 'Corazones', icon: <Heart size={24} />, svg: (l) => `<svg viewBox="0 0 100 90"><path d="M50 85 C10 55 0 30 25 10 C40 0 50 15 50 15 C50 15 60 0 75 10 C100 30 90 55 50 85 Z" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="55" text-anchor="middle" font-family="Arial Black" font-size="30" fill="currentColor">${l}</text></svg>` },
  { id: 'heart-filled', name: 'Corazón Relleno', category: 'Corazones', icon: <Heart size={24} />, svg: (l) => `<svg viewBox="0 0 100 90"><path d="M50 85 C10 55 0 30 25 10 C40 0 50 15 50 15 C50 15 60 0 75 10 C100 30 90 55 50 85 Z" fill="currentColor"/><text x="50" y="55" text-anchor="middle" font-family="Arial Black" font-size="30" fill="white">${l}</text></svg>` },
  
  // Diamond
  { id: 'diamond-plain', name: 'Diamante', category: 'Diamantes', icon: <Diamond size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="40" fill="currentColor">${l}</text></svg>` },
  { id: 'diamond-filled', name: 'Diamante Relleno', category: 'Diamantes', icon: <Diamond size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50" fill="currentColor"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="40" fill="white">${l}</text></svg>` },
  
  // Square
  { id: 'square-plain', name: 'Cuadrado', category: 'Cuadrados', icon: <Square size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="10" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="45" fill="currentColor">${l}</text></svg>` },
  { id: 'square-rounded', name: 'Redondeado', category: 'Cuadrados', icon: <Square size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="25" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black" font-size="40" fill="currentColor">${l}</text></svg>` },
  
  // Nature
  { id: 'mountain-plain', name: 'Montaña', category: 'Naturaleza', icon: <Mountain size={24} />, svg: (l) => `<svg viewBox="0 0 100 80"><polygon points="50,5 95,75 5,75" fill="none" stroke="currentColor" stroke-width="2"/><line x1="50" y1="5" x2="50" y2="75" stroke="currentColor" stroke-width="1"/><text x="50" y="55" text-anchor="middle" font-family="Arial Black" font-size="25" fill="currentColor">${l}</text></svg>` },
  { id: 'paw-print', name: 'Huella', category: 'Naturaleza', icon: <PawPrint size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="70" rx="25" ry="20" fill="currentColor"/><circle cx="30" cy="35" r="10" fill="currentColor"/><circle cx="50" cy="25" r="12" fill="currentColor"/><circle cx="70" cy="35" r="10" fill="currentColor"/><text x="50" y="65" text-anchor="middle" font-family="Arial Black" font-size="20" fill="white">${l}</text></svg>` },
  { id: 'flame-plain', name: 'Llama', category: 'Naturaleza', icon: <Flame size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><path d="M50 95 Q30 70 30 50 Q30 20 50 5 Q70 20 70 50 Q70 70 50 95 Z" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="65" text-anchor="middle" font-family="Arial Black" font-size="35" fill="currentColor">${l}</text></svg>` },
  
  // Special
  { id: 'anchor-plain', name: 'Ancla', category: 'Especial', icon: <Anchor size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="20" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="50" y1="30" x2="50" y2="85" stroke="currentColor" stroke-width="3"/><path d="M30 85 L50 70 L70 85" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="55" text-anchor="middle" font-family="Arial Black" font-size="25" fill="currentColor">${l}</text></svg>` },
  { id: 'skull-plain', name: 'Cráneo', category: 'Especial', icon: <Skull size={24} />, svg: (l) => `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="35" ry="40" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="35" cy="40" r="8" fill="currentColor"/><circle cx="65" cy="40" r="8" fill="currentColor"/><rect x="40" y="60" width="20" height="15" rx="5" fill="currentColor"/><text x="50" y="45" text-anchor="middle" font-family="Arial Black" font-size="20" fill="white">${l}</text></svg>` },
  { id: 'wings-plain', name: 'Alas', category: 'Especial', icon: <Star size={24} />, svg: (l) => `<svg viewBox="0 0 120 60"><path d="M10 30 Q30 10 50 30 Q70 10 90 30 Q70 50 50 30 Q30 50 10 30" fill="none" stroke="currentColor" stroke-width="2"/><text x="60" y="38" text-anchor="middle" font-family="Arial Black" font-size="25" fill="currentColor">${l}</text></svg>` },
];

// Group templates by category
const TEMPLATES_BY_CATEGORY = MONOGRAM_TEMPLATES.reduce((acc, template) => {
  if (!acc[template.category]) {
    acc[template.category] = [];
  }
  acc[template.category].push(template);
  return acc;
}, {} as Record<string, MonogramTemplate[]>);

export const MonogramLibrary: React.FC<MonogramLibraryProps> = ({ onSelectMonogram, onGenerateAI }) => {
  const [text, setText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(MONOGRAM_TEMPLATES[0]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const categories = ['All', ...Object.keys(TEMPLATES_BY_CATEGORY)];
  
  const filteredTemplates = activeCategory === 'All' 
    ? MONOGRAM_TEMPLATES 
    : TEMPLATES_BY_CATEGORY[activeCategory] || [];
  
  const handleSelect = () => {
    const letter = text.trim() || 'A';
    const svg = selectedTemplate.svg(letter);
    onSelectMonogram({ 
      text: letter, 
      style: selectedTemplate.id, 
      svg,
      preview: selectedTemplate.icon
    });
  };
  
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || !onGenerateAI) return;
    setIsGenerating(true);
    try {
      const imageUrl = await onGenerateAI(aiPrompt);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error('Error generating AI design:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-yellow-400">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Type size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-black">Monogramas & Emblemas</h3>
            <p className="text-xs text-black/70">Elige un diseño y tus letras</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Text Input */}
        <div className="mb-4">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Tus iniciales (1-2 letras)</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2).toUpperCase())}
            placeholder="AB"
            maxLength={2}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center text-2xl font-bold tracking-widest uppercase"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-yellow-400 text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Template Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`relative p-3 rounded-xl border-2 transition-all ${
                selectedTemplate.id === template.id
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              }`}
            >
              <div className="w-full h-14 flex items-center justify-center text-zinc-900 dark:text-white">
                <div className="w-12 h-12 flex items-center justify-center">
                  {template.icon}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 truncate">{template.name}</p>
            </button>
          ))}
        </div>
        
        {/* Preview */}
        <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
          <p className="text-xs text-zinc-400 mb-3 text-center">Vista previa</p>
          <div 
            className="w-32 h-32 mx-auto flex items-center justify-center text-6xl font-bold text-zinc-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: selectedTemplate.svg(text || 'A') }}
          />
        </div>
        
        {/* Action Button */}
        <button
          onClick={handleSelect}
          className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl"
        >
          Aplicar al Producto
        </button>
        
        {/* AI Section */}
        {onGenerateAI && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 size={16} className="text-yellow-500" />
              <span className="font-bold text-sm">Generar con IA</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe tu diseño..."
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
              />
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isGenerating}
                className="px-4 py-2 bg-yellow-400 disabled:bg-zinc-300 text-black font-bold rounded-lg"
              >
                {isGenerating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
              </button>
            </div>
            {generatedImage && (
              <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                <img src={generatedImage} alt="AI" className="w-20 h-20 mx-auto object-contain rounded" />
                <button
                  onClick={() => onSelectMonogram({ text: aiPrompt, style: 'ai', svg: generatedImage, preview: null })}
                  className="mt-2 w-full py-1 bg-yellow-400 text-black font-bold rounded text-sm"
                >
                  Usar
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



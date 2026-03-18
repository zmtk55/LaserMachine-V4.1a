import React, { useState } from 'react';
import { DesignTemplate, FontOption } from '../types';
import { 
  X, Plus, Trash2, Copy, ChevronUp, ChevronDown, Type,
  Palette, Move, RotateCw, Check
} from 'lucide-react';
import { TumblerPreview } from './TumblerPreview';

interface TemplateEditorSimpleProps {
  template: DesignTemplate;
  fonts: FontOption[];
  onSave: (template: DesignTemplate) => void;
  onCancel: () => void;
}



const TUMBLER_COLORS = [
  { id: 'stainless', name: 'Stainless', hex: '#C0C0C0' },
  { id: 'black', name: 'Black', hex: '#1a1a1a' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f' },
  { id: 'white', name: 'White', hex: '#f5f5f5' },
  { id: 'pink', name: 'Pink', hex: '#f8c8dc' },
  { id: 'teal', name: 'Teal', hex: '#008080' },
  { id: 'copper', name: 'Copper', hex: '#b87333' },
];

export const TemplateEditorSimple: React.FC<TemplateEditorSimpleProps> = ({
  template,
  fonts,
  onSave,
  onCancel
}) => {
  const [texts, setTexts] = useState(template.texts.map((t, idx) => ({
    id: `text-${idx}`,
    content: typeof t === 'string' ? t : t.content,
    fontFamily: typeof t === 'string' ? 'Bebas Neue' : (t.fontFamily || 'Bebas Neue'),
    size: typeof t === 'string' ? 1 : (t.size || 1),
    color: typeof t === 'string' ? '#FFFFFF' : (t.color || '#FFFFFF'),
    yPosition: typeof t === 'string' ? 30 + (idx * 25) : (t.yPosition || 50),
  })));
  
  const [selectedId, setSelectedId] = useState<string | null>(texts[0]?.id || null);
  const [tumblerColor, setTumblerColor] = useState(template.previewColor || 'stainless');
  const [name, setName] = useState(template.name);
  const [occasion, setOccasion] = useState(template.occasion);

  const selectedText = texts.find(t => t.id === selectedId);

  const updateText = (id: string, updates: Partial<typeof texts[0]>) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addText = () => {
    const newId = `text-${Date.now()}`;
    setTexts(prev => [...prev, {
      id: newId,
      content: 'NUEVO TEXTO',
      fontFamily: 'Bebas Neue',
      size: 1,
      color: '#FFFFFF',
      yPosition: 50
    }]);
    setSelectedId(newId);
  };

  const deleteText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveText = (id: string, direction: 'up' | 'down') => {
    const idx = texts.findIndex(t => t.id === id);
    if (idx === -1) return;
    
    const text = texts[idx];
    const newY = direction === 'up' 
      ? Math.max(10, text.yPosition - 5)
      : Math.min(90, text.yPosition + 5);
    
    updateText(id, { yPosition: newY });
  };

  const handleSave = () => {
    const updated: DesignTemplate = {
      ...template,
      name,
      occasion,
      previewColor: tumblerColor as any,
      texts: texts.map(t => ({
        content: t.content,
        fontFamily: t.fontFamily,
        size: t.size,
        color: t.color,
        yPosition: t.yPosition
      })),
      updatedAt: new Date().toISOString()
    };
    onSave(updated);
  };

  const previewTemplate: DesignTemplate = {
    ...template,
    name,
    texts,
    previewColor: tumblerColor as any
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex">
      {/* Left - Preview */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
          <h2 className="text-white font-bold uppercase">Editor de Template</h2>
          <button onClick={onCancel} className="text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-zinc-900/50 p-8">
          <div className="relative">
            <TumblerPreview
              template={previewTemplate}
              color={tumblerColor as any}
              width={350}
              height={580}
            />
          </div>
        </div>
      </div>

      {/* Right - Controls */}
      <div className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Template Info */}
          <div className="space-y-4">
            <h3 className="text-zinc-400 text-xs font-bold uppercase">Información</h3>
            
            <div>
              <label className="text-zinc-500 text-xs uppercase block mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs uppercase block mb-1">Ocasión</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white"
              >
                <option value="general">General</option>
                <option value="fathers-day">Día del Padre</option>
                <option value="mothers-day">Día de la Madre</option>
                <option value="teachers-day">Día del Maestro</option>
                <option value="birthday">Cumpleaños</option>
                <option value="graduation">Graduación</option>
                <option value="valentine">San Valentín</option>
                <option value="christmas">Navidad</option>
              </select>
            </div>
          </div>

          {/* Tumbler Color */}
          <div className="space-y-3">
            <h3 className="text-zinc-400 text-xs font-bold uppercase">Color del Vaso</h3>
            <div className="flex flex-wrap gap-2">
              {TUMBLER_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setTumblerColor(c.id)}
                  className={`w-12 h-12 rounded-xl border-2 transition-all ${
                    tumblerColor === c.id ? 'border-yellow-400 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ background: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Text Layers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-zinc-400 text-xs font-bold uppercase">Textos</h3>
              <button
                onClick={addText}
                className="text-yellow-400 text-xs font-bold uppercase flex items-center gap-1 hover:text-yellow-300"
              >
                <Plus size={14} /> Agregar
              </button>
            </div>

            <div className="space-y-2">
              {texts.map((text, idx) => (
                <div
                  key={text.id}
                  onClick={() => setSelectedId(text.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedId === text.id
                      ? 'bg-zinc-800 border-yellow-400'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 text-xs">#{idx + 1}</span>
                    <span className="flex-1 text-white font-medium truncate">{text.content}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveText(text.id, 'up'); }}
                        className="p-1 text-zinc-500 hover:text-white"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveText(text.id, 'down'); }}
                        className="p-1 text-zinc-500 hover:text-white"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteText(text.id); }}
                        className="p-1 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Text Properties */}
          {selectedText && (
            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <h3 className="text-yellow-400 text-xs font-bold uppercase flex items-center gap-2">
                <Type size={14} /> Propiedades del Texto
              </h3>

              <div>
                <label className="text-zinc-500 text-xs uppercase block mb-1">Contenido</label>
                <input
                  type="text"
                  value={selectedText.content}
                  onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-xs uppercase block mb-1">Fuente</label>
                <select
                  value={selectedText.fontFamily}
                  onChange={(e) => updateText(selectedText.id, { fontFamily: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white"
                >
                  {fonts.map(f => (
                    <option key={f.id} value={f.cssFamily || f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs uppercase block mb-1">Tamaño</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3"
                    value={selectedText.size}
                    onChange={(e) => updateText(selectedText.id, { size: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs uppercase block mb-1">Posición Y (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={selectedText.yPosition}
                    onChange={(e) => updateText(selectedText.id, { yPosition: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-500 text-xs uppercase block mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateText(selectedText.id, { color })}
                      className={`w-8 h-8 rounded-lg border-2 ${
                        selectedText.color === color ? 'border-yellow-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={selectedText.color}
                  onChange={(e) => updateText(selectedText.id, { color: e.target.value })}
                  className="w-full mt-2 h-10 rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-6 space-y-3">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-yellow-400 text-zinc-900 rounded-xl font-bold uppercase hover:bg-yellow-300 transition-colors"
          >
            Guardar Template
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-zinc-800 text-white rounded-xl font-bold uppercase hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorSimple;

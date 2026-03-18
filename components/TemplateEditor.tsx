import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DesignTemplate, FontOption } from '../types';
import { 
  Move, Type, Image as ImageIcon, Trash2, Copy, Layers, 
  Grid3X3, ZoomIn, ZoomOut, RotateCcw, Eye, Lock, Unlock,
  ChevronUp, ChevronDown, Settings2, Palette
} from 'lucide-react';
import { TumblerMockup3D } from './TumblerMockup3D';

interface DraggableText {
  id: string;
  content: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  rotation: number;
  locked: boolean;
}

interface TemplateEditorProps {
  template: DesignTemplate;
  fonts: FontOption[];
  onSave: (template: DesignTemplate) => void;
  onCancel: () => void;
  tumblerColors?: string[];
}

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FFD700', '#C0C0C0', '#FF6B6B',
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#F8C8DC', '#B87333', '#8B4513', '#1E3A5F', '#2F4F4F'
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  fonts,
  onSave,
  onCancel,
  tumblerColors = ['stainless', 'black', 'navy', 'white', 'pink', 'teal', 'copper', 'gold']
}) => {
  const [texts, setTexts] = useState<DraggableText[]>(() => 
    template.texts.map((t, idx) => ({
      id: `text-${idx}`,
      content: typeof t === 'string' ? t : t.content,
      x: 50,
      y: typeof t === 'string' ? 30 + (idx * 25) : (t.yPosition || 50),
      fontFamily: typeof t === 'string' ? 'Bebas Neue' : (t.fontFamily || 'Bebas Neue'),
      fontSize: typeof t === 'string' ? 32 : ((t.size || 1) * 32),
      color: typeof t === 'string' ? '#FFFFFF' : (t.color || '#FFFFFF'),
      rotation: 0,
      locked: false
    }))
  );
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tumblerColor, setTumblerColor] = useState('stainless');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    const text = texts.find(t => t.id === id);
    if (!text || text.locked) return;
    
    setSelectedId(id);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: ((e.clientX - rect.left) / rect.width) * 100 - text.x,
        y: ((e.clientY - rect.top) / rect.height) * 100 - text.y
      });
    }
  }, [texts]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
    const newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;
    
    setTexts(prev => prev.map(t => 
      t.id === selectedId 
        ? { ...t, x: Math.max(5, Math.min(95, newX)), y: Math.max(5, Math.min(95, newY)) }
        : t
    ));
  }, [isDragging, selectedId, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const updateText = (id: string, updates: Partial<DraggableText>) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addText = () => {
    const newText: DraggableText = {
      id: `text-${Date.now()}`,
      content: 'NUEVO TEXTO',
      x: 50,
      y: 50,
      fontFamily: 'Bebas Neue',
      fontSize: 32,
      color: '#FFFFFF',
      rotation: 0,
      locked: false
    };
    setTexts(prev => [...prev, newText]);
    setSelectedId(newText.id);
  };

  const duplicateText = (id: string) => {
    const text = texts.find(t => t.id === id);
    if (!text) return;
    
    const newText: DraggableText = {
      ...text,
      id: `text-${Date.now()}`,
      x: text.x + 5,
      y: text.y + 5
    };
    setTexts(prev => [...prev, newText]);
    setSelectedId(newText.id);
  };

  const deleteText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = texts.findIndex(t => t.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === texts.length - 1) return;
    if (direction === 'down' && idx === 0) return;
    
    const newTexts = [...texts];
    const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
    [newTexts[idx], newTexts[swapIdx]] = [newTexts[swapIdx], newTexts[idx]];
    setTexts(newTexts);
  };

  const handleSave = () => {
    const updatedTemplate: DesignTemplate = {
      ...template,
      texts: texts.map(t => ({
        content: t.content,
        fontFamily: t.fontFamily,
        size: t.fontSize / 32,
        yPosition: t.y,
        color: t.color,
        xPosition: t.x,
        rotation: t.rotation
      })),
      previewColor: tumblerColor
    };
    onSave(updatedTemplate);
  };

  const selectedText = texts.find(t => t.id === selectedId);

  // Generate preview template
  const previewTemplate: DesignTemplate = {
    ...template,
    texts: texts.map(t => ({
      content: t.content,
      fontFamily: t.fontFamily,
      size: t.fontSize / 32,
      yPosition: t.y,
      color: t.color
    }))
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex">
      {/* Left Panel - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold uppercase tracking-wider">Editor de Templates</span>
            <span className="text-zinc-500 text-sm">{template.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              title="Mostrar/Ocultar Grid"
            >
              <Grid3X3 size={20} />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-2 text-zinc-400 hover:text-white rounded-lg"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-zinc-400 text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-2 text-zinc-400 hover:text-white rounded-lg"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg"
              title="Reset Zoom"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-zinc-950 overflow-auto flex items-center justify-center p-8">
          <div 
            ref={canvasRef}
            className="relative"
            style={{ 
              width: 400 * zoom, 
              height: 500 * zoom,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid Background */}
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #333 1px, transparent 1px),
                    linear-gradient(to bottom, #333 1px, transparent 1px)
                  `,
                  backgroundSize: '10% 10%'
                }}
              />
            )}
            
            {/* Tumbler Preview */}
            <TumblerMockup3D
              template={previewTemplate}
              color={tumblerColor}
              width={400 * zoom}
              height={500 * zoom}
              showGrid={false}
            />
            
            {/* Draggable Text Overlays */}
            {texts.map((text) => (
              <div
                key={text.id}
                className={`absolute cursor-move select-none transition-shadow ${
                  selectedId === text.id 
                    ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-950 z-10' 
                    : 'hover:ring-1 hover:ring-zinc-500'
                } ${text.locked ? 'cursor-not-allowed opacity-70' : ''}`}
                style={{
                  left: `${text.x}%`,
                  top: `${text.y}%`,
                  transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
                  fontFamily: text.fontFamily,
                  fontSize: text.fontSize * zoom,
                  color: text.color,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  pointerEvents: text.locked ? 'none' : 'auto'
                }}
                onMouseDown={(e) => handleMouseDown(e, text.id)}
                onClick={() => setSelectedId(text.id)}
              >
                {text.content}
                {text.locked && <Lock size={12} className="absolute -top-4 left-1/2 -translate-x-1/2 text-zinc-500" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center px-4">
          <Settings2 size={18} className="text-zinc-400 mr-2" />
          <span className="text-white font-bold uppercase text-sm">Propiedades</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Tumbler Color */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Color del Vaso</label>
            <div className="grid grid-cols-4 gap-2">
              {tumblerColors.map(color => (
                <button
                  key={color}
                  onClick={() => setTumblerColor(color)}
                  className={`h-10 rounded-lg border-2 transition-all ${
                    tumblerColor === color ? 'border-yellow-400 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ 
                    background: color === 'stainless' ? 'linear-gradient(135deg, #E8E8E8, #A0A0A0)' :
                               color === 'black' ? '#1a1a1a' :
                               color === 'navy' ? '#1e3a5f' :
                               color === 'white' ? '#f5f5f5' :
                               color === 'pink' ? '#f8c8dc' :
                               color === 'teal' ? '#008080' :
                               color === 'copper' ? '#b87333' :
                               color === 'gold' ? '#d4af37' : '#C0C0C0'
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Layers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Capas</label>
              <button
                onClick={addText}
                className="text-xs text-yellow-400 hover:text-yellow-300 font-bold uppercase flex items-center gap-1"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
            
            <div className="space-y-1">
              {texts.slice().reverse().map((text, idx) => (
                <div
                  key={text.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedId === text.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  }`}
                  onClick={() => setSelectedId(text.id)}
                >
                  <Type size={14} className="text-zinc-500" />
                  <span className="flex-1 text-sm text-white truncate">{text.content}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveLayer(text.id, 'up'); }}
                    disabled={idx === 0}
                    className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveLayer(text.id, 'down'); }}
                    disabled={idx === texts.length - 1}
                    className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Text Properties */}
          {selectedText && (
            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Palette size={16} className="text-yellow-400" />
                <span className="text-white font-bold text-sm uppercase">Editar Texto</span>
              </div>

              {/* Content */}
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-1 block">Contenido</label>
                <input
                  type="text"
                  value={selectedText.content}
                  onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Font */}
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-1 block">Fuente</label>
                <select
                  value={selectedText.fontFamily}
                  onChange={(e) => updateText(selectedText.id, { fontFamily: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {fonts.map(font => (
                    <option key={font.id} value={font.cssFamily || font.name}>{font.name}</option>
                  ))}
                </select>
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">X (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(selectedText.x)}
                    onChange={(e) => updateText(selectedText.id, { x: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">Y (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(selectedText.y)}
                    onChange={(e) => updateText(selectedText.id, { y: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-1 block">Tamaño</label>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={selectedText.fontSize}
                  onChange={(e) => updateText(selectedText.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-xs text-zinc-500">{selectedText.fontSize}px</div>
              </div>

              {/* Rotation */}
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-1 block">Rotación</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedText.rotation}
                  onChange={(e) => updateText(selectedText.id, { rotation: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-xs text-zinc-500">{selectedText.rotation}°</div>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-1 block">Color</label>
                <div className="grid grid-cols-5 gap-1">
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
                  className="w-full mt-2 h-8 rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateText(selectedText.id, { locked: !selectedText.locked })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 ${
                    selectedText.locked 
                      ? 'bg-yellow-400 text-zinc-900' 
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {selectedText.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  {selectedText.locked ? 'Bloqueado' : 'Bloquear'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => duplicateText(selectedText.id)}
                  className="flex-1 py-2 bg-zinc-800 text-white rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 hover:bg-zinc-700"
                >
                  <Copy size={14} /> Duplicar
                </button>
                <button
                  onClick={() => deleteText(selectedText.id)}
                  className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 hover:bg-red-500/30"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-800 p-4 space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-yellow-400 text-zinc-900 rounded-xl font-bold uppercase text-sm hover:bg-yellow-300 transition-colors"
          >
            Guardar Template
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-zinc-800 text-white rounded-xl font-bold uppercase text-sm hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Need to import Plus
import { Plus } from 'lucide-react';

export default TemplateEditor;

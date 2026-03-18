import React, { useState, useMemo } from 'react';
import { 
  X, Sparkles, Search, Star, Copy, Eye, GripVertical,
  TrendingUp, Heart, LayoutGrid, List as ListIcon, Filter,
  ChevronDown, Check, Zap, Crown, ArrowRight
} from 'lucide-react';
import { DesignTemplate } from '../types';
import { TumblerMockup3D } from './TumblerMockup3D';

export type TemplateOccasion = 
  | 'fathers-day' 
  | 'mothers-day' 
  | 'teachers-day'
  | 'birthday'
  | 'graduation'
  | 'general';

const OCCASIONS: Record<TemplateOccasion | 'TODAS', { 
  label: string; 
  color: string; 
  icon: string;
  gradient: string;
}> = {
  'TODAS': { 
    label: 'Todas las Plantillas', 
    color: '#6B7280', 
    icon: '✨',
    gradient: 'from-gray-400 to-gray-600'
  },
  'fathers-day': { 
    label: 'Día del Padre', 
    color: '#3B82F6', 
    icon: '👔',
    gradient: 'from-blue-400 to-blue-600'
  },
  'mothers-day': { 
    label: 'Día de la Madre', 
    color: '#EC4899', 
    icon: '🌸',
    gradient: 'from-pink-400 to-pink-600'
  },
  'teachers-day': { 
    label: 'Día del Maestro', 
    color: '#F59E0B', 
    icon: '📚',
    gradient: 'from-amber-400 to-amber-600'
  },
  'birthday': { 
    label: 'Cumpleaños', 
    color: '#8B5CF6', 
    icon: '🎂',
    gradient: 'from-purple-400 to-purple-600'
  },
  'graduation': { 
    label: 'Graduación', 
    color: '#10B981', 
    icon: '🎓',
    gradient: 'from-emerald-400 to-emerald-600'
  },
  'general': { 
    label: 'Uso General', 
    color: '#6B7280', 
    icon: '🎨',
    gradient: 'from-slate-400 to-slate-600'
  }
};

interface DesignTemplatesProps {
  templates?: DesignTemplate[];
  onSelectTemplate: (template: DesignTemplate) => void;
  onClose: () => void;
  productImage?: string;
}

// Default templates con estructura profesional
const DEFAULT_TEMPLATES: DesignTemplate[] = [
  { 
    id: 'default-1', 
    name: 'El Rey', 
    occasion: 'fathers-day', 
    preview: '👑', 
    previewColor: 'black',
    texts: [
      { content: 'REY', fontFamily: 'Bebas Neue', size: 1.5, yPosition: 35, color: '#FFD700' },
      { content: 'PAPÁ', fontFamily: 'Plus Jakarta Sans', size: 1, yPosition: 60, color: '#FFFFFF' }
    ],
    isActive: true, 
    isFavorite: true,
    usageCount: 245,
    createdAt: new Date().toISOString(),
    tags: ['popular', 'padre', 'best-seller'],
    order: 1
  },
  { 
    id: 'default-2', 
    name: 'The Boss', 
    occasion: 'fathers-day', 
    preview: '💼', 
    previewColor: 'navy',
    texts: [
      { content: 'THE BOSS', fontFamily: 'Anton', size: 1.3, yPosition: 50, color: '#FFFFFF' }
    ],
    isActive: true, 
    usageCount: 189,
    createdAt: new Date().toISOString(),
    tags: ['popular', 'padre'],
    order: 2
  },
  { 
    id: 'default-3', 
    name: 'Mejor Mamá', 
    occasion: 'mothers-day', 
    preview: '💖', 
    previewColor: 'pink',
    texts: [
      { content: 'BEST MOM', fontFamily: 'Playfair Display', size: 1.2, yPosition: 40, color: '#FFFFFF' },
      { content: 'EVER', fontFamily: 'Bebas Neue', size: 1, yPosition: 65, color: '#FFFFFF' }
    ],
    isActive: true, 
    isFavorite: true,
    usageCount: 312,
    createdAt: new Date().toISOString(),
    tags: ['popular', 'madre', 'best-seller'],
    order: 3
  },
  { 
    id: 'default-4', 
    name: 'Queen', 
    occasion: 'mothers-day', 
    preview: '👑', 
    previewColor: 'white',
    texts: [
      { content: 'QUEEN', fontFamily: 'Anton', size: 1.5, yPosition: 45, color: '#FFD700' },
      { content: 'MOM', fontFamily: 'Plus Jakarta Sans', size: 0.9, yPosition: 70, color: '#333333' }
    ],
    isActive: true, 
    usageCount: 156,
    createdAt: new Date().toISOString(),
    tags: ['madre'],
    order: 4
  },
  { 
    id: 'default-5', 
    name: 'Feliz Cumple', 
    occasion: 'birthday', 
    preview: '🎉', 
    previewColor: 'teal',
    texts: [
      { content: 'HAPPY', fontFamily: 'Permanent Marker', size: 1.1, yPosition: 35, color: '#FFFFFF' },
      { content: 'BIRTHDAY', fontFamily: 'Permanent Marker', size: 1.1, yPosition: 55, color: '#FFFFFF' }
    ],
    isActive: true, 
    usageCount: 198,
    createdAt: new Date().toISOString(),
    tags: ['popular', 'cumpleaños'],
    order: 5
  },
  { 
    id: 'default-6', 
    name: 'Graduado 2025', 
    occasion: 'graduation', 
    preview: '🎓', 
    previewColor: 'black',
    texts: [
      { content: 'CLASS OF', fontFamily: 'Bebas Neue', size: 1, yPosition: 35, color: '#FFFFFF' },
      { content: '2025', fontFamily: 'Anton', size: 1.8, yPosition: 60, color: '#FFFFFF' }
    ],
    isActive: true, 
    usageCount: 134,
    createdAt: new Date().toISOString(),
    tags: ['graduación'],
    order: 6
  },
  { 
    id: 'default-7', 
    name: 'Gracias Maestro', 
    occasion: 'teachers-day', 
    preview: '🍎', 
    previewColor: 'stainless',
    texts: [
      { content: 'BEST', fontFamily: 'Bebas Neue', size: 1, yPosition: 35, color: '#333333' },
      { content: 'TEACHER', fontFamily: 'Plus Jakarta Sans', size: 1.2, yPosition: 55, color: '#333333' }
    ],
    isActive: true, 
    usageCount: 87,
    createdAt: new Date().toISOString(),
    tags: ['maestro'],
    order: 7
  },
  { 
    id: 'default-8', 
    name: 'Custom Name', 
    occasion: 'general', 
    preview: '✨', 
    previewColor: 'copper',
    texts: [
      { content: 'TU NOMBRE', fontFamily: 'Bebas Neue', size: 1.4, yPosition: 45, color: '#FFFFFF' }
    ],
    isActive: true, 
    usageCount: 423,
    createdAt: new Date().toISOString(),
    tags: ['popular', 'personalizado', 'best-seller'],
    order: 8
  },
  { 
    id: 'default-9', 
    name: 'Estrella', 
    occasion: 'general', 
    preview: '⭐', 
    previewColor: 'gold',
    texts: [
      { content: 'SUPERSTAR', fontFamily: 'Anton', size: 1.3, yPosition: 40, color: '#000000' },
      { content: '⭐', fontFamily: 'Arial', size: 1, yPosition: 65, color: '#FFD700' }
    ],
    isActive: true, 
    usageCount: 76,
    createdAt: new Date().toISOString(),
    tags: [],
    order: 9
  },
  { 
    id: 'default-10', 
    name: 'Boss Lady', 
    occasion: 'general', 
    preview: '💪', 
    previewColor: 'black',
    texts: [
      { content: 'BOSS', fontFamily: 'Anton', size: 1.4, yPosition: 35, color: '#FFFFFF' },
      { content: 'LADY', fontFamily: 'Plus Jakarta Sans', size: 1, yPosition: 65, color: '#FFFFFF' }
    ],
    isActive: true, 
    usageCount: 112,
    createdAt: new Date().toISOString(),
    tags: ['mujer'],
    order: 10
  },
  { 
    id: 'default-11', 
    name: 'Mi Persona Favorita', 
    occasion: 'general', 
    preview: '❤️', 
    previewColor: 'white',
    texts: [
      { content: 'MY', fontFamily: 'Playfair Display', size: 1, yPosition: 30, color: '#333333' },
      { content: 'FAVORITE', fontFamily: 'Playfair Display', size: 1.1, yPosition: 50, color: '#333333' },
      { content: 'PERSON', fontFamily: 'Playfair Display', size: 1, yPosition: 70, color: '#333333' }
    ],
    isActive: true, 
    usageCount: 145,
    createdAt: new Date().toISOString(),
    tags: ['amor', 'regalo'],
    order: 11
  },
  { 
    id: 'default-12', 
    name: 'Papá Héroe', 
    occasion: 'fathers-day', 
    preview: '🦸', 
    previewColor: 'stainless',
    texts: [
      { content: 'DAD', fontFamily: 'Bebas Neue', size: 1.5, yPosition: 35, color: '#333333' },
      { content: 'MY HERO', fontFamily: 'Plus Jakarta Sans', size: 0.9, yPosition: 65, color: '#333333' }
    ],
    isActive: true, 
    usageCount: 203,
    createdAt: new Date().toISOString(),
    tags: ['popular', 'padre'],
    order: 12
  }
];

export const DesignTemplates: React.FC<DesignTemplatesProps> = ({
  templates = [],
  onSelectTemplate,
  onClose,
  productImage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<TemplateOccasion | 'TODAS'>('TODAS');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Merge custom templates with defaults
  const allTemplates = useMemo(() => {
    const customActive = templates.filter(t => t.isActive);
    const defaultFiltered = DEFAULT_TEMPLATES.filter(dt => 
      !customActive.some(ct => ct.name === dt.name)
    );
    return [...customActive, ...defaultFiltered].sort((a, b) => 
      (b.usageCount || 0) - (a.usageCount || 0)
    );
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = allTemplates;

    // Filter by occasion
    if (selectedOccasion !== 'TODAS') {
      result = result.filter(t => t.occasion === selectedOccasion);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allTemplates, selectedOccasion, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: allTemplates.length,
    filtered: filteredTemplates.length,
    popular: allTemplates.filter(t => (t.usageCount || 0) > 100).length
  }), [allTemplates, filteredTemplates]);

  const handleSelect = (template: DesignTemplate) => {
    setSelectedId(template.id);
    setTimeout(() => {
      onSelectTemplate(template);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 w-full max-w-7xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col border border-zinc-800 shadow-2xl">
        
        {/* Header */}
        <div className="h-20 border-b border-zinc-800 flex items-center justify-between px-8 bg-gradient-to-r from-zinc-900 to-zinc-950">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Sparkles className="text-zinc-900" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Templates de Diseño
              </h2>
              <p className="text-zinc-500 text-sm">
                {stats.filtered} de {stats.total} plantillas • {stats.popular} populares
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Occasion Pills */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(OCCASIONS) as Array<TemplateOccasion | 'TODAS'>).map((occ) => (
                <button
                  key={occ}
                  onClick={() => setSelectedOccasion(occ)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold uppercase transition-all flex items-center gap-2 ${
                    selectedOccasion === occ
                      ? 'bg-yellow-400 text-zinc-900 shadow-lg shadow-yellow-500/20'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  <span>{OCCASIONS[occ].icon}</span>
                  <span className="hidden sm:inline">{OCCASIONS[occ].label}</span>
                </button>
              ))}
            </div>

            {/* View Mode */}
            <div className="flex bg-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-zinc-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No se encontraron templates</h3>
              <p className="text-zinc-500">Intenta con otra búsqueda o categoría</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`group relative bg-zinc-900 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedId === template.id 
                      ? 'border-yellow-400 ring-4 ring-yellow-400/20' 
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelect(template)}
                >
                  {/* Preview */}
                  <div className={`relative ${viewMode === 'grid' ? 'aspect-[4/5]' : 'h-32'} bg-gradient-to-br from-zinc-800 to-zinc-900`}>
                    <TumblerMockup3D
                      template={template}
                      color={template.previewColor || 'stainless'}
                      width={viewMode === 'grid' ? 300 : 120}
                      height={viewMode === 'grid' ? 375 : 150}
                      className="absolute inset-0 w-full h-full flex items-center justify-center"
                    />

                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-opacity ${
                      hoveredId === template.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center text-zinc-900 font-bold">
                        <ArrowRight size={28} />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {template.isFavorite && (
                        <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                          <Heart size={10} className="fill-current" />
                          Fav
                        </span>
                      )}
                      {(template.usageCount || 0) > 100 && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                          <TrendingUp size={10} />
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Usage Count */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                      {template.usageCount || 0} usos
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate group-hover:text-yellow-400 transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-zinc-500 text-xs capitalize flex items-center gap-1 mt-0.5">
                          <span>{OCCASIONS[template.occasion]?.icon}</span>
                          {OCCASIONS[template.occasion]?.label}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.tags.slice(0, 3).map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-full border border-zinc-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Preview Text */}
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <p className="text-zinc-500 text-xs line-clamp-1">
                        {template.texts.map(t => typeof t === 'string' ? t : t.content).join(' • ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
          <p className="text-zinc-500 text-sm">
            Selecciona un template para aplicarlo a tu diseño
          </p>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Zap size={16} className="text-yellow-400" />
            <span>Actualizado automáticamente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignTemplates;

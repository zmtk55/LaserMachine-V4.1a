import React, { useState, useMemo } from 'react';
import { DesignTemplate, StoreConfig, FontOption } from '../types';
import { 
  Search, Grid3X3, List, Copy, Trash2, Edit3, Heart, Plus,
  LayoutTemplate, X, CheckSquare, Square, TrendingUp, 
  Sparkles, Filter, MoreHorizontal, Eye, EyeOff
} from 'lucide-react';
import { TumblerPreview } from './TumblerPreview';
import { TemplateEditorSimple } from './TemplateEditorSimple';

interface TemplateManagerProProps {
  storeConfig: StoreConfig;
  fonts: FontOption[];
  onUpdateStoreConfig: (config: StoreConfig) => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'name' | 'popular';

const OCCASIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'fathers-day', label: 'Día del Padre' },
  { id: 'mothers-day', label: 'Día de la Madre' },
  { id: 'teachers-day', label: 'Día del Maestro' },
  { id: 'birthday', label: 'Cumpleaños' },
  { id: 'graduation', label: 'Graduación' },
  { id: 'valentine', label: 'San Valentín' },
  { id: 'christmas', label: 'Navidad' },
  { id: 'general', label: 'General' },
];

export const TemplateManagerPro: React.FC<TemplateManagerProProps> = ({
  storeConfig,
  fonts,
  onUpdateStoreConfig
}) => {
  const templates = storeConfig.designTemplates || [];
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DesignTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeCollection, setActiveCollection] = useState('all');

  const collections = useMemo(() => {
    const allTags = new Set<string>();
    templates.forEach(t => t.tags?.forEach(tag => allTags.add(tag)));
    
    return [
      { id: 'all', name: 'Todos', count: templates.length },
      { id: 'favorites', name: 'Favoritos', count: templates.filter(t => t.isFavorite).length },
      { id: 'active', name: 'Activos', count: templates.filter(t => t.isActive).length },
      ...Array.from(allTags).map(tag => ({
        id: `tag-${tag}`,
        name: tag,
        count: templates.filter(t => t.tags?.includes(tag)).length,
      }))
    ];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = [...templates];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    
    if (selectedOccasion !== 'all') {
      result = result.filter(t => t.occasion === selectedOccasion);
    }
    
    if (activeCollection === 'favorites') {
      result = result.filter(t => t.isFavorite);
    } else if (activeCollection === 'active') {
      result = result.filter(t => t.isActive);
    } else if (activeCollection.startsWith('tag-')) {
      const tag = activeCollection.replace('tag-', '');
      result = result.filter(t => t.tags?.includes(tag));
    }
    
    if (showFavoritesOnly) {
      result = result.filter(t => t.isFavorite);
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest': return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name': return a.name.localeCompare(b.name);
        case 'popular': return (b.usageCount || 0) - (a.usageCount || 0);
        default: return 0;
      }
    });
    
    return result;
  }, [templates, searchQuery, selectedOccasion, activeCollection, showFavoritesOnly, sortBy]);

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    favorites: templates.filter(t => t.isFavorite).length,
  }), [templates]);

  const toggleSelection = (id: string) => {
    setSelectedTemplates(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedTemplates(filteredTemplates.map(t => t.id));
  const deselectAll = () => setSelectedTemplates([]);

  const bulkDelete = () => {
    if (!confirm(`Eliminar ${selectedTemplates.length} templates?`)) return;
    const updated = templates.filter(t => !selectedTemplates.includes(t.id));
    onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
    setSelectedTemplates([]);
  };

  const bulkToggleActive = (active: boolean) => {
    const updated = templates.map(t => 
      selectedTemplates.includes(t.id) ? { ...t, isActive: active } : t
    );
    onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
    setSelectedTemplates([]);
  };

  const duplicateTemplate = (template: DesignTemplate) => {
    const duplicated: DesignTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copia)`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    onUpdateStoreConfig({ ...storeConfig, designTemplates: [...templates, duplicated] });
  };

  const deleteTemplate = (id: string) => {
    if (!confirm('Eliminar este template?')) return;
    const updated = templates.filter(t => t.id !== id);
    onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
  };

  const toggleFavorite = (id: string) => {
    const updated = templates.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t);
    onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
  };

  const createNewTemplate = () => {
    const newTemplate: DesignTemplate = {
      id: Date.now().toString(),
      name: 'Nuevo Template',
      occasion: 'general',
      preview: '',
      texts: [{ content: 'TEXTO', fontFamily: 'Bebas Neue', size: 1.2, yPosition: 45, color: '#FFFFFF' }],
      isActive: true,
      isFavorite: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      tags: []
    };
    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  const handleSaveTemplate = (template: DesignTemplate) => {
    if (isCreating) {
      onUpdateStoreConfig({ ...storeConfig, designTemplates: [...templates, template] });
      setIsCreating(false);
    } else {
      const updated = templates.map(t => t.id === template.id ? template : t);
      onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
    }
    setEditingTemplate(null);
  };

  if (editingTemplate) {
    return (
      <TemplateEditorSimple
        template={editingTemplate}
        fonts={fonts}
        onSave={handleSaveTemplate}
        onCancel={() => { setEditingTemplate(null); setIsCreating(false); }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <LayoutTemplate className="text-yellow-400" size={28} />
            Templates de Diseño
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            {stats.total} templates • {stats.active} activos • {stats.favorites} favoritos
          </p>
        </div>
        <button
          onClick={createNewTemplate}
          className="px-6 py-3 bg-yellow-400 text-zinc-900 rounded-xl font-bold uppercase text-sm flex items-center gap-2 hover:bg-yellow-300 transition-colors"
        >
          <Plus size={18} /> Nuevo Template
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-zinc-800 p-6 space-y-6 overflow-y-auto">
          {/* Collections */}
          <div>
            <h3 className="text-zinc-500 text-xs font-bold uppercase mb-3">Colecciones</h3>
            <div className="space-y-1">
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => setActiveCollection(col.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCollection === col.id 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <span>{col.name}</span>
                  <span className="text-zinc-600 text-xs">{col.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Occasions */}
          <div>
            <h3 className="text-zinc-500 text-xs font-bold uppercase mb-3">Ocasión</h3>
            <div className="space-y-1">
              {OCCASIONS.map(occ => (
                <button
                  key={occ.id}
                  onClick={() => setSelectedOccasion(occ.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedOccasion === occ.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {occ.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-2 rounded-lg transition-colors ${
                showFavoritesOnly ? 'bg-zinc-800 text-red-400' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Heart size={20} className={showFavoritesOnly ? 'fill-current' : ''} />
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="name">Nombre</option>
              <option value="popular">Más usados</option>
            </select>

            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedTemplates.length > 0 && (
            <div className="px-6 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center gap-3">
              <span className="text-zinc-400 text-sm">{selectedTemplates.length} seleccionados</span>
              <button onClick={() => bulkToggleActive(true)} className="text-green-400 text-sm hover:underline">Activar</button>
              <button onClick={() => bulkToggleActive(false)} className="text-zinc-400 text-sm hover:underline">Desactivar</button>
              <button onClick={bulkDelete} className="text-red-400 text-sm hover:underline">Eliminar</button>
              <button onClick={deselectAll} className="text-zinc-500 text-sm hover:underline ml-auto">Cancelar</button>
            </div>
          )}

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                <LayoutTemplate size={64} className="mx-auto text-zinc-700 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No hay templates</h3>
                <p className="text-zinc-500 mb-6">Crea tu primer template para comenzar</p>
                <button onClick={createNewTemplate} className="px-6 py-3 bg-yellow-400 text-zinc-900 rounded-xl font-bold uppercase">
                  Crear Template
                </button>
              </div>
            ) : (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`group bg-zinc-900 rounded-xl border transition-all ${
                      selectedTemplates.includes(template.id) ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-zinc-800 hover:border-zinc-700'
                    } ${!template.isActive ? 'opacity-50' : ''}`}
                  >
                    {/* Preview */}
                    <div className={`relative bg-zinc-950 ${viewMode === 'grid' ? 'aspect-[4/3]' : 'h-24 w-24'}`}>
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <TumblerPreview
                          template={template}
                          color={template.previewColor || 'stainless'}
                          width={viewMode === 'grid' ? 140 : 60}
                          height={viewMode === 'grid' ? 220 : 95}
                        />
                      </div>

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => setEditingTemplate(template)} className="p-2 bg-white text-zinc-900 rounded-lg hover:bg-yellow-400">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => duplicateTemplate(template)} className="p-2 bg-white text-zinc-900 rounded-lg hover:bg-yellow-400">
                          <Copy size={18} />
                        </button>
                        <button onClick={() => toggleFavorite(template.id)} className={`p-2 rounded-lg ${template.isFavorite ? 'bg-red-500 text-white' : 'bg-white text-zinc-900'}`}>
                          <Heart size={18} className={template.isFavorite ? 'fill-current' : ''} />
                        </button>
                      </div>

                      {/* Selection */}
                      <button
                        onClick={() => toggleSelection(template.id)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded text-white hover:bg-yellow-400 hover:text-zinc-900"
                      >
                        {selectedTemplates.includes(template.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>

                      {/* Active Toggle */}
                      <div className="absolute bottom-2 right-2">
                        <button
                          onClick={() => {
                            const updated = templates.map(t => t.id === template.id ? { ...t, isActive: !t.isActive } : t);
                            onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
                          }}
                          className={`w-8 h-4 rounded-full relative transition-colors ${template.isActive ? 'bg-green-500' : 'bg-zinc-600'}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${template.isActive ? 'left-4.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-bold">{template.name}</h4>
                          <p className="text-zinc-500 text-sm capitalize">{template.occasion?.replace('-', ' ')}</p>
                        </div>
                        <button onClick={() => deleteTemplate(template.id)} className="text-zinc-600 hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp size={12} /> {template.usageCount || 0}
                        </span>
                        <span>{new Date(template.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>

                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {template.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateManagerPro;

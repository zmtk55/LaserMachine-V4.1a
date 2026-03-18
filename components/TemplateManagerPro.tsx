import React, { useState, useMemo } from 'react';
import { DesignTemplate, StoreConfig, FontOption } from '../types';
import { 
  Search, Filter, Grid3X3, List, Folder, Heart, MoreVertical, 
  Copy, Trash2, Edit3, Eye, TrendingUp, Clock, Star, Plus,
  LayoutTemplate, X, CheckSquare, Square, Download, Upload,
  BarChart3, Users, Sparkles, ArrowUpDown, Tag, Calendar,
  Settings, ChevronDown, FolderPlus, FolderOpen
} from 'lucide-react';
import { TumblerMockup3D } from './TumblerMockup3D';
import { TemplateEditor } from './TemplateEditor';

interface TemplateCollection {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface TemplateManagerProProps {
  storeConfig: StoreConfig;
  fonts: FontOption[];
  onUpdateStoreConfig: (config: StoreConfig) => void;
}

type ViewMode = 'grid' | 'list' | 'masonry';
type SortBy = 'newest' | 'oldest' | 'name' | 'popular' | 'usage';

const OCCASIONS = [
  { id: 'all', label: 'Todos', icon: '✨', color: 'bg-zinc-500' },
  { id: 'fathers-day', label: 'Día del Padre', icon: '👔', color: 'bg-blue-500' },
  { id: 'mothers-day', label: 'Día de la Madre', icon: '💐', color: 'bg-pink-500' },
  { id: 'teachers-day', label: 'Día del Maestro', icon: '🍎', color: 'bg-green-500' },
  { id: 'birthday', label: 'Cumpleaños', icon: '🎂', color: 'bg-purple-500' },
  { id: 'graduation', label: 'Graduación', icon: '🎓', color: 'bg-yellow-500' },
  { id: 'valentine', label: 'San Valentín', icon: '❤️', color: 'bg-red-500' },
  { id: 'christmas', label: 'Navidad', icon: '🎄', color: 'bg-green-600' },
  { id: 'general', label: 'General', icon: '🎯', color: 'bg-zinc-400' },
];

export const TemplateManagerPro: React.FC<TemplateManagerProProps> = ({
  storeConfig,
  fonts,
  onUpdateStoreConfig
}) => {
  const templates = storeConfig.designTemplates || [];
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DesignTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeCollection, setActiveCollection] = useState('all');
  
  // Derived collections
  const collections: TemplateCollection[] = useMemo(() => {
    const allTags = new Set<string>();
    templates.forEach(t => t.tags?.forEach(tag => allTags.add(tag)));
    
    return [
      { id: 'all', name: 'Todos los Templates', icon: '✨', count: templates.length, color: 'bg-zinc-500' },
      { id: 'favorites', name: 'Favoritos', icon: '❤️', count: templates.filter(t => t.isFavorite).length, color: 'bg-red-500' },
      { id: 'active', name: 'Activos', icon: '✅', count: templates.filter(t => t.isActive).length, color: 'bg-green-500' },
      { id: 'popular', name: 'Más Usados', icon: '🔥', count: templates.filter(t => (t.usageCount || 0) > 5).length, color: 'bg-orange-500' },
      ...Array.from(allTags).map(tag => ({
        id: `tag-${tag}`,
        name: tag,
        icon: '🏷️',
        count: templates.filter(t => t.tags?.includes(tag)).length,
        color: 'bg-blue-400'
      }))
    ];
  }, [templates]);
  
  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = [...templates];
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q)) ||
        t.texts.some(text => {
          const content = typeof text === 'string' ? text : text.content;
          return content.toLowerCase().includes(q);
        })
      );
    }
    
    // Occasion filter
    if (selectedOccasion !== 'all') {
      result = result.filter(t => t.occasion === selectedOccasion);
    }
    
    // Collection filter
    if (activeCollection === 'favorites') {
      result = result.filter(t => t.isFavorite);
    } else if (activeCollection === 'active') {
      result = result.filter(t => t.isActive);
    } else if (activeCollection === 'popular') {
      result = result.filter(t => (t.usageCount || 0) > 5);
    } else if (activeCollection.startsWith('tag-')) {
      const tag = activeCollection.replace('tag-', '');
      result = result.filter(t => t.tags?.includes(tag));
    }
    
    // Favorites only
    if (showFavoritesOnly) {
      result = result.filter(t => t.isFavorite);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest': return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name': return a.name.localeCompare(b.name);
        case 'popular': return (b.usageCount || 0) - (a.usageCount || 0);
        case 'usage': return (b.usageCount || 0) - (a.usageCount || 0);
        default: return 0;
      }
    });
    
    return result;
  }, [templates, searchQuery, selectedOccasion, activeCollection, showFavoritesOnly, sortBy]);
  
  // Stats
  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    favorites: templates.filter(t => t.isFavorite).length,
    totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
    avgUsage: templates.length > 0 ? templates.reduce((sum, t) => sum + (t.usageCount || 0), 0) / templates.length : 0
  }), [templates]);
  
  // Actions
  const toggleSelection = (id: string) => {
    setSelectedTemplates(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const selectAll = () => {
    setSelectedTemplates(filteredTemplates.map(t => t.id));
  };
  
  const deselectAll = () => {
    setSelectedTemplates([]);
  };
  
  const bulkDelete = () => {
    if (!confirm(`¿Eliminar ${selectedTemplates.length} templates?`)) return;
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
    onUpdateStoreConfig({
      ...storeConfig,
      designTemplates: [...templates, duplicated]
    });
  };
  
  const deleteTemplate = (id: string) => {
    if (!confirm('¿Eliminar este template?')) return;
    const updated = templates.filter(t => t.id !== id);
    onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
  };
  
  const toggleFavorite = (id: string) => {
    const updated = templates.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    );
    onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
  };
  
  const createNewTemplate = () => {
    const newTemplate: DesignTemplate = {
      id: Date.now().toString(),
      name: 'Nuevo Template',
      occasion: 'general',
      preview: '✨',
      texts: [
        { content: 'TEXTO 1', fontFamily: 'Bebas Neue', size: 1.2, yPosition: 40, color: '#FFFFFF' },
        { content: 'TEXTO 2', fontFamily: 'Plus Jakarta Sans', size: 1, yPosition: 65, color: '#FFFFFF' }
      ],
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
      onUpdateStoreConfig({
        ...storeConfig,
        designTemplates: [...templates, template]
      });
      setIsCreating(false);
    } else {
      const updated = templates.map(t => t.id === template.id ? template : t);
      onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
    }
    setEditingTemplate(null);
  };

  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        fonts={fonts}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setEditingTemplate(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-4 border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs uppercase font-bold">Total Templates</p>
              <p className="text-2xl font-black text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-zinc-700 rounded-xl flex items-center justify-center">
              <LayoutTemplate className="text-zinc-400" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-2xl p-4 border border-green-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-xs uppercase font-bold">Activos</p>
              <p className="text-2xl font-black text-white">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckSquare className="text-green-400" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-2xl p-4 border border-red-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-xs uppercase font-bold">Favoritos</p>
              <p className="text-2xl font-black text-white">{stats.favorites}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Heart className="text-red-400" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-2xl p-4 border border-yellow-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-xs uppercase font-bold">Usos Totales</p>
              <p className="text-2xl font-black text-white">{stats.totalUsage}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-yellow-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Collections */}
        <div className="w-full lg:w-64 space-y-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold uppercase text-sm">Colecciones</h3>
              <button className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400">
                <FolderPlus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {collections.map(collection => (
                <button
                  key={collection.id}
                  onClick={() => setActiveCollection(collection.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    activeCollection === collection.id 
                      ? 'bg-yellow-400 text-zinc-900' 
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{collection.icon}</span>
                  <span className="flex-1 text-left text-sm font-medium">{collection.name}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    activeCollection === collection.id ? 'bg-zinc-900/20' : 'bg-zinc-800'
                  }`}>
                    {collection.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Occasions */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <h3 className="text-white font-bold uppercase text-sm mb-4">Ocasión</h3>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map(occ => (
                <button
                  key={occ.id}
                  onClick={() => setSelectedOccasion(occ.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                    selectedOccasion === occ.id
                      ? 'bg-yellow-400 text-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {occ.icon} {occ.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`p-2.5 rounded-xl transition-colors ${
                    showFavoritesOnly ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="Solo Favoritos"
                >
                  <Heart size={18} className={showFavoritesOnly ? 'fill-current' : ''} />
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm"
                >
                  <option value="newest">Más Recientes</option>
                  <option value="oldest">Más Antiguos</option>
                  <option value="name">Nombre</option>
                  <option value="popular">Más Populares</option>
                  <option value="usage">Más Usados</option>
                </select>

                <div className="flex bg-zinc-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                  >
                    <List size={18} />
                  </button>
                </div>

                <button
                  onClick={createNewTemplate}
                  className="px-4 py-2.5 bg-yellow-400 text-zinc-900 rounded-xl font-bold uppercase text-sm flex items-center gap-2 hover:bg-yellow-300 transition-colors"
                >
                  <Plus size={18} /> Nuevo
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedTemplates.length > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                <span className="text-zinc-400 text-sm">{selectedTemplates.length} seleccionados</span>
                <button
                  onClick={() => bulkToggleActive(true)}
                  className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold uppercase hover:bg-green-500/30"
                >
                  Activar
                </button>
                <button
                  onClick={() => bulkToggleActive(false)}
                  className="px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase hover:bg-zinc-600"
                >
                  Desactivar
                </button>
                <button
                  onClick={bulkDelete}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase hover:bg-red-500/30"
                >
                  Eliminar
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-zinc-500 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center">
              <LayoutTemplate size={64} className="mx-auto text-zinc-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No hay templates</h3>
              <p className="text-zinc-500 mb-6">Crea tu primer template para comenzar</p>
              <button
                onClick={createNewTemplate}
                className="px-6 py-3 bg-yellow-400 text-zinc-900 rounded-xl font-bold uppercase hover:bg-yellow-300"
              >
                Crear Template
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
            }`}>
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`group bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden transition-all hover:border-zinc-700 ${
                    selectedTemplates.includes(template.id) ? 'ring-2 ring-yellow-400' : ''
                  } ${!template.isActive ? 'opacity-60' : ''}`}
                >
                  {/* Preview */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <TumblerMockup3D
                      template={template}
                      color={template.previewColor || 'stainless'}
                      width={viewMode === 'list' ? 200 : 400}
                      height={viewMode === 'list' ? 250 : 300}
                      className="absolute inset-0 w-full h-full flex items-center justify-center"
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="p-3 bg-white text-zinc-900 rounded-xl hover:bg-yellow-400 transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button
                        onClick={() => duplicateTemplate(template)}
                        className="p-3 bg-white text-zinc-900 rounded-xl hover:bg-yellow-400 transition-colors"
                        title="Duplicar"
                      >
                        <Copy size={20} />
                      </button>
                      <button
                        onClick={() => toggleFavorite(template.id)}
                        className={`p-3 rounded-xl transition-colors ${
                          template.isFavorite ? 'bg-red-500 text-white' : 'bg-white text-zinc-900 hover:bg-red-500 hover:text-white'
                        }`}
                        title="Favorito"
                      >
                        <Heart size={20} className={template.isFavorite ? 'fill-current' : ''} />
                      </button>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {template.isFavorite && (
                        <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full">
                          ❤️ Fav
                        </span>
                      )}
                      {(template.usageCount || 0) > 10 && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-full">
                          🔥 Popular
                        </span>
                      )}
                    </div>

                    {/* Selection Checkbox */}
                    <button
                      onClick={() => toggleSelection(template.id)}
                      className="absolute top-3 right-3 p-2 bg-black/50 rounded-lg text-white hover:bg-yellow-400 hover:text-zinc-900 transition-colors"
                    >
                      {selectedTemplates.includes(template.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    {/* Active Toggle */}
                    <div className="absolute bottom-3 right-3">
                      <button
                        onClick={() => {
                          const updated = templates.map(t => 
                            t.id === template.id ? { ...t, isActive: !t.isActive } : t
                          );
                          onUpdateStoreConfig({ ...storeConfig, designTemplates: updated });
                        }}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          template.isActive ? 'bg-green-500' : 'bg-zinc-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${
                          template.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate">{template.name}</h4>
                        <p className="text-zinc-500 text-xs capitalize">{template.occasion?.replace('-', ' ')}</p>
                      </div>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} /> {template.usageCount || 0} usos
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(template.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-full">
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-full">
                            +{template.tags.length - 3}
                          </span>
                        )}
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
  );
};

export default TemplateManagerPro;

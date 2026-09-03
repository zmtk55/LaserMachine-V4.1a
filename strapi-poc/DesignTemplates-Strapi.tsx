// strapi-poc/DesignTemplates-Strapi.tsx
// Versión del modal de templates usando Strapi API

import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Search, Grid3X3, List, Heart,
  TrendingUp, ChevronDown
} from 'lucide-react';
import { DesignTemplate } from '../types';
import { TumblerPreview } from '../components/TumblerPreview';
import { getTemplates, adaptStrapiToTemplate } from './strapi-api';

interface DesignTemplatesProps {
  onSelectTemplate: (template: DesignTemplate) => void;
  onClose: () => void;
}

const OCCASIONS = [
  { id: 'all', label: 'Todas' },
  { id: 'fathers-day', label: 'Día del Padre' },
  { id: 'mothers-day', label: 'Día de la Madre' },
  { id: 'teachers-day', label: 'Día del Maestro' },
  { id: 'birthday', label: 'Cumpleaños' },
  { id: 'graduation', label: 'Graduación' },
  { id: 'general', label: 'General' },
];

export const DesignTemplatesStrapi: React.FC<DesignTemplatesProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('usageCount:desc');

  // Cargar templates desde Strapi
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        
        const filters: any = {
          isActive: true,
          sort: sortBy,
        };
        
        if (selectedOccasion !== 'all') {
          filters.occasion = selectedOccasion;
        }
        
        if (searchQuery) {
          filters.search = searchQuery;
        }

        const response = await getTemplates(filters);
        const adapted = response.data.map(adaptStrapiToTemplate);
        
        setTemplates(adapted);
      } catch (err) {
        setError('Error cargando templates');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [selectedOccasion, searchQuery, sortBy]);

  const handleSelect = async (template: DesignTemplate) => {
    // Incrementar uso en Strapi
    try {
      await fetch(`${process.env.VITE_STRAPI_URL}/api/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { usageCount: (template.usageCount || 0) + 1 }
        }),
      });
    } catch (e) {
      // No bloquear si falla el contador
    }
    
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col border border-zinc-800">
        
        {/* Header */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">Templates de Diseño</h2>
            <span className="text-zinc-500 text-sm">({templates.length})</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white"
            >
              <option value="usageCount:desc">Más populares</option>
              <option value="createdAt:desc">Más recientes</option>
              <option value="name:asc">Nombre A-Z</option>
            </select>

            <div className="flex bg-zinc-900 rounded-lg p-1">
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

          {/* Occasion pills */}
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map(occ => (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasion(occ.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedOccasion === occ.id
                    ? 'bg-yellow-400 text-zinc-900'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No se encontraron templates
            </div>
          ) : (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  {/* Preview */}
                  <div className={`relative bg-zinc-950 ${viewMode === 'grid' ? 'aspect-[3/4]' : 'h-24'}`}>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <TumblerPreview
                        template={template}
                        color={template.previewColor || 'stainless'}
                        width={viewMode === 'grid' ? 120 : 60}
                        height={viewMode === 'grid' ? 190 : 95}
                      />
                    </div>
                    
                    {template.isFavorite && (
                      <div className="absolute top-2 left-2">
                        <Heart size={16} className="text-red-500 fill-current" />
                      </div>
                    )}
                    
                    {(template.usageCount || 0) > 50 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-400 text-zinc-900 text-xs font-bold rounded">
                        POPULAR
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h4 className="text-white font-medium truncate">{template.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span className="capitalize">{template.occasion?.replace('-', ' ')}</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        {template.usageCount || 0}
                      </span>
                    </div>
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

export default DesignTemplatesStrapi;

/*
DIFERENCIAS CLAVE vs VERSIÓN ACTUAL:

1. DATOS:
   Antes: localStorage.getItem('lm_store_config')
   Ahora: fetch a /api/templates con filtros

2. BÚSQUEDA:
   Antes: Array.filter() en frontend
   Ahora: Query params en API (?filters[name][$containsi]=xxx)

3. POPULARIDAD:
   Antes: Campo estático
   Ahora: usageCount real que incrementa en cada uso

4. IMÁGENES:
   Antes: Ninguna o emojis
   Ahora: previewImage desde Strapi Media Library con CDN

5. ADMIN:
   Antes: Editar código/constants.ts
   Ahora: Panel visual en localhost:1337/admin
*/

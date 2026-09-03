import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Search, Grid3X3, List, Heart,
  TrendingUp
} from 'lucide-react';
import { DesignTemplate } from '../types';
import { TumblerPreview } from './TumblerPreview';
import { useStrapiTemplates, incrementTemplateUsage } from '../hooks/useStrapi';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { templates: strapiTemplates, isLoading } = useStrapiTemplates({
    occasion: selectedOccasion === 'all' ? undefined : selectedOccasion
  });
  
  const [localTemplates, setLocalTemplates] = useState<DesignTemplate[]>([]);
  
  useEffect(() => {
    const storeConfig = localStorage.getItem('lm_store_config');
    if (storeConfig) {
      const config = JSON.parse(storeConfig);
      setLocalTemplates(config.designTemplates || []);
    }
  }, []);
  
  const templates = strapiTemplates.length > 0 ? strapiTemplates : localTemplates;
  
  const filteredTemplates = templates.filter(t => 
    searchQuery === '' || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = async (template: DesignTemplate) => {
    if (strapiTemplates.length > 0) {
      await incrementTemplateUsage(template.id);
    }
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col border border-zinc-800">
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">Templates</h2>
            {strapiTemplates.length === 0 && localTemplates.length > 0 && (
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Offline</span>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white"
              />
            </div>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>
                <Grid3X3 size={18} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>
                <List size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map(occ => (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasion(occ.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedOccasion === occ.id ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">No se encontraron templates</div>
          ) : (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  <div className={`relative bg-zinc-950 ${viewMode === 'grid' ? 'aspect-[3/4]' : 'h-24'}`}>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <TumblerPreview template={template} color={template.previewColor || 'stainless'} width={viewMode === 'grid' ? 120 : 60} height={viewMode === 'grid' ? 190 : 95} />
                    </div>
                    {template.isFavorite && <div className="absolute top-2 left-2"><Heart size={16} className="text-red-500 fill-current" /></div>}
                    {(template.usageCount || 0) > 20 && <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-400 text-zinc-900 text-xs font-bold rounded">POPULAR</div>}
                  </div>
                  <div className="p-3">
                    <h4 className="text-white font-medium truncate">{template.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span className="capitalize">{template.occasion?.replace('-', ' ')}</span>
                      <span className="flex items-center gap-1"><TrendingUp size={12} />{template.usageCount || 0}</span>
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

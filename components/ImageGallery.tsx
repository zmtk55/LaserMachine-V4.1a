import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Upload, X, Check, Grid3X3, LayoutGrid, List, 
  Image as ImageIcon, ChevronRight, Folder
} from 'lucide-react';
import { BrandingAsset } from '../types';

interface ImageGalleryProps {
  galleryAssets: BrandingAsset[];
  onSelectImage: (url: string) => void;
  onUploadImage: (file: File) => void;
  isDarkMode?: boolean;
}

type ViewMode = 'compact' | 'grid' | 'list';
type AssetCategory = 'TODAS' | 'LOGO' | 'ICON' | 'ILUSTRACION' | 'FORMS' | 'CLIPART' | 'OTHER';

// Simplified category config - NO emojis, NO arbitrary colors
const CATEGORY_LABELS: Record<AssetCategory, string> = {
  'TODAS': 'Todas',
  'LOGO': 'Logos',
  'ICON': 'Iconos',
  'ILUSTRACION': 'Ilustraciones',
  'FORMS': 'Formas',
  'CLIPART': 'Clipart',
  'OTHER': 'Otros'
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as AssetCategory[];

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  galleryAssets,
  onSelectImage,
  onUploadImage,
  isDarkMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('TODAS');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [showFolders, setShowFolders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group assets by category for folder view
  const groupedAssets = useMemo(() => {
    const groups: Record<string, BrandingAsset[]> = {};
    galleryAssets.forEach(asset => {
      const type = asset.type || 'OTHER';
      if (!groups[type]) groups[type] = [];
      groups[type].push(asset);
    });
    return groups;
  }, [galleryAssets]);

  // Filter images based on search and category
  const filteredAssets = useMemo(() => {
    let result = galleryAssets;
    
    if (activeCategory !== 'TODAS') {
      result = result.filter(asset => asset.type === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [galleryAssets, activeCategory, searchQuery]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      e.target.value = '';
    }
  };

  const handleSelectImage = (asset: BrandingAsset) => {
    onSelectImage(asset.url);
  };

  // View mode button
  const ViewButton = ({ mode, icon: Icon }: { mode: ViewMode; icon: React.ElementType }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`p-1.5 rounded-lg transition-all ${
        viewMode === mode 
          ? 'bg-yellow-500 text-zinc-900' 
          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
    >
      <Icon size={14} />
    </button>
  );

  // Image card component
  const ImageCard = ({ asset }: { asset: BrandingAsset }) => {
    if (viewMode === 'list') {
      return (
        <div
          className="group flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"
          onClick={() => handleSelectImage(asset)}
        >
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
            <img src={asset.url} alt={asset.name} className="w-full h-full object-contain p-1" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{asset.name}</p>
            <p className="text-[10px] text-zinc-400 uppercase">{CATEGORY_LABELS[asset.type as AssetCategory] || 'Otros'}</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Check size={16} className="text-yellow-500" />
          </div>
        </div>
      );
    }

    return (
      <div
        className="group relative bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        onClick={() => handleSelectImage(asset)}
      >
        <div className="aspect-square">
          <img 
            src={asset.url} 
            alt={asset.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {/* Select Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
              <Check size={16} className="text-zinc-900" />
            </div>
          </div>
        </div>

        {/* Name Badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 pt-4">
          <p className="text-[8px] font-bold text-white uppercase truncate">{asset.name}</p>
        </div>
      </div>
    );
  };

  // Folder component - Clean, no emojis, system colors only
  const FolderCard = ({ category, count }: { category: Exclude<AssetCategory, 'TODAS'>; count: number }) => {
    if (count === 0) return null;
    
    return (
      <button
        onClick={() => {
          setActiveCategory(category);
          setShowFolders(false);
        }}
        className="group flex flex-col items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500 hover:shadow-md transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 group-hover:bg-yellow-500 flex items-center justify-center mb-2 transition-colors">
          <Folder size={18} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </div>
        <p className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-wide">{CATEGORY_LABELS[category]}</p>
        <p className="text-[9px] text-zinc-400 font-medium">{count}</p>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header: Search + View Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-yellow-500 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <ViewButton mode="compact" icon={Grid3X3} />
          <ViewButton mode="grid" icon={LayoutGrid} />
          <ViewButton mode="list" icon={List} />
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2.5 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold uppercase text-zinc-400 hover:text-yellow-500 hover:border-yellow-500 transition-all flex items-center justify-center gap-2"
      >
        <Upload size={14} />
        Subir Imagen
      </button>
      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileSelect} />

      {/* Folder View */}
      {showFolders && !searchQuery && activeCategory === 'TODAS' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Carpetas</span>
            <span className="text-[9px] text-zinc-400">{galleryAssets.length} total</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.filter(c => c !== 'TODAS').map(cat => {
              const count = groupedAssets[cat]?.length ?? 0;
              return count > 0 ? (
                <FolderCard key={cat} category={cat as Exclude<AssetCategory, 'TODAS'>} count={count} />
              ) : null;
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Back button when folder selected */}
          {activeCategory !== 'TODAS' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveCategory('TODAS');
                  setShowFolders(true);
                }}
                className="flex items-center gap-1 text-[10px] text-yellow-500 hover:text-yellow-600 font-bold"
              >
                <ChevronRight size={12} className="rotate-180" />
                Volver
              </button>
              <span className="text-[10px] font-bold text-zinc-500">
                {CATEGORY_LABELS[activeCategory]} ({filteredAssets.length})
              </span>
            </div>
          )}

          {/* Results count when searching */}
          {searchQuery && (
            <p className="text-[9px] text-zinc-400">
              {filteredAssets.length} resultado{filteredAssets.length !== 1 ? 's' : ''}
            </p>
          )}

          {/* Images Grid */}
          {filteredAssets.length > 0 ? (
            <div className={`grid gap-2 max-h-[280px] overflow-y-auto pr-1 ${
              viewMode === 'compact' ? 'grid-cols-4' :
              viewMode === 'grid' ? 'grid-cols-3' :
              'grid-cols-1'
            }`}>
              {filteredAssets.map(asset => (
                <ImageCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ImageIcon size={24} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-zinc-400 text-[10px] font-medium">
                {searchQuery ? 'Sin resultados' : 'Sin imágenes'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageGallery;
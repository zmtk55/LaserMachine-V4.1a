import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  Search, Upload, X, Check, Grid3X3, LayoutGrid, List, 
  Image as ImageIcon, ChevronRight, Folder, Eye, Download, Copy, Trash2, ExternalLink,
  Calendar, Tag, BarChart3, ImagePlus, ZoomIn, Move, Layers,
  ChevronLeft, Filter, CheckSquare, Square, FolderPlus, XCircle
} from 'lucide-react';
import { BrandingAsset } from '../types';
import { useContextMenu } from '../contexts/ContextMenuContext';

interface ImageGalleryProps {
  galleryAssets: BrandingAsset[];
  onSelectImage: (url: string) => void;
  onUploadImage: (file: File) => void;
  onDeleteImages?: (ids: string[]) => void;
  onUpdateImage?: (id: string, updates: Partial<BrandingAsset>) => void;
  isDarkMode?: boolean;
}

type ViewMode = 'masonry' | 'compact' | 'grid' | 'list';
type AssetCategory = 'TODAS' | 'LOGO' | 'ICON' | 'ILUSTRACION' | 'FORMS' | 'CLIPART' | 'OTHER';
type SortOption = 'newest' | 'oldest' | 'name' | 'size' | 'usage';
type FilterOption = 'all' | 'used' | 'unused';

interface Folder {
  id: string;
  name: string;
  count: number;
  createdAt: Date;
}

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

// =============================================================================
// LIGHTBOX COMPONENT
// =============================================================================
const Lightbox = ({
  assets,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onSelect
}: {
  assets: BrandingAsset[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onSelect: (url: string) => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  if (!isOpen || assets.length === 0) return null;

  const currentAsset = assets[currentIndex];

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
      >
        <X size={24} />
      </button>

      {/* Navigation */}
      <button
        onClick={() => onNavigate('prev')}
        className="absolute left-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={() => onNavigate('next')}
        className="absolute right-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
      >
        <ChevronRight size={32} />
      </button>

      {/* Image */}
      <div className="max-w-[90vw] max-h-[80vh] flex flex-col items-center">
        <img
          src={currentAsset.url}
          alt={currentAsset.name}
          className="max-w-full max-h-[70vh] object-contain"
        />
        
        {/* Info bar */}
        <div className="mt-4 flex items-center gap-4 text-white/70 text-sm">
          <span className="font-bold">{currentAsset.name}</span>
          <span className="text-white/40">|</span>
          <span>{currentIndex + 1} / {assets.length}</span>
          <button
            onClick={() => { onSelect(currentAsset.url); onClose(); }}
            className="ml-4 px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Usar esta imagen
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// DRAG OVERLAY
// =============================================================================
const DragOverlay = ({ isDragging }: { isDragging: boolean }) => {
  if (!isDragging) return null;
  
  return (
    <div className="absolute inset-0 z-50 bg-yellow-500/20 border-4 border-dashed border-yellow-500 rounded-xl flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl shadow-xl text-center">
        <Upload size={48} className="mx-auto text-yellow-500 mb-2" />
        <p className="font-bold text-zinc-900 dark:text-white">Suelta las imágenes aquí</p>
        <p className="text-sm text-zinc-500">Se subirán automáticamente</p>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export const ImageGallery: React.FC<ImageGalleryProps> = ({
  galleryAssets,
  onSelectImage,
  onUploadImage,
  onDeleteImages,
  onUpdateImage,
  isDarkMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('TODAS');
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [showFolders, setShowFolders] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'default', name: 'General', count: 0, createdAt: new Date() }
  ]);
  const [tags, setTags] = useState<string[]>(['destacado', 'nuevo', 'popular']);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { showMenu } = useContextMenu();

  // Group assets by category
  const groupedAssets = useMemo(() => {
    const groups: Record<string, BrandingAsset[]> = {};
    galleryAssets.forEach(asset => {
      const type = asset.type || 'OTHER';
      if (!groups[type]) groups[type] = [];
      groups[type].push(asset);
    });
    return groups;
  }, [galleryAssets]);

  // Enhanced filter and sort
  const filteredAssets = useMemo(() => {
    let result = [...galleryAssets];
    
    // Category filter
    if (activeCategory !== 'TODAS') {
      result = result.filter(asset => asset.type === activeCategory);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(query) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Tag filter
    if (selectedTag) {
      result = result.filter(asset => asset.tags?.includes(selectedTag));
    }
    
    // Usage filter
    if (filterBy === 'used') {
      result = result.filter(asset => (asset.usageCount || 0) > 0);
    } else if (filterBy === 'unused') {
      result = result.filter(asset => !asset.usageCount || asset.usageCount === 0);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [galleryAssets, activeCategory, searchQuery, selectedTag, filterBy, sortBy]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files as FileList).filter((f: File) => f.type.startsWith('image/'));
    files.forEach(file => onUploadImage(file));
  }, [onUploadImage]);

  // File select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => onUploadImage(file));
    e.target.value = '';
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredAssets.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    if (onDeleteImages && selectedIds.size > 0) {
      onDeleteImages(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex(prev => (prev > 0 ? prev - 1 : filteredAssets.length - 1));
    } else {
      setLightboxIndex(prev => (prev < filteredAssets.length - 1 ? prev + 1 : 0));
    }
  };

  // View mode button
  const ViewButton = ({ mode, icon: Icon, title }: { mode: ViewMode; icon: React.ElementType; title: string }) => (
    <button
      onClick={() => setViewMode(mode)}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        viewMode === mode 
          ? 'bg-yellow-500 text-zinc-900' 
          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  // Image card with multi-select
  const ImageCard = ({ asset, index }: { asset: BrandingAsset; index: number }) => {
    const isSelected = selectedIds.has(asset.id);
    const usageCount = asset.usageCount || 0;

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const menuItems = [
        {
          id: 'select',
          label: 'Seleccionar',
          icon: <Check size={14} />,
          onClick: () => onSelectImage(asset.url),
        },
        {
          id: 'preview',
          label: 'Vista previa',
          icon: <ZoomIn size={14} />,
          onClick: () => openLightbox(index),
        },
        {
          id: 'separator1',
          label: '',
        },
        {
          id: 'copy-url',
          label: 'Copiar URL',
          icon: <Copy size={14} />,
          onClick: () => navigator.clipboard.writeText(asset.url),
        },
        {
          id: 'download',
          label: 'Descargar',
          icon: <Download size={14} />,
          onClick: () => {
            const link = document.createElement('a');
            link.href = asset.url;
            link.download = asset.name || 'image';
            link.click();
          },
        },
        {
          id: 'separator2',
          label: '',
        },
        {
          id: 'add-tag',
          label: 'Agregar etiqueta',
          icon: <Tag size={14} />,
          onClick: () => {
            const tag = prompt('Etiqueta:');
            if (tag && onUpdateImage) {
              onUpdateImage(asset.id, { 
                tags: [...(asset.tags || []), tag] 
              });
            }
          },
        },
      ];
      
      showMenu({ x: e.clientX, y: e.clientY }, menuItems, asset);
    };

    const handleClick = (e: React.MouseEvent) => {
      if (isMultiSelectMode || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toggleSelection(asset.id);
      } else {
        onSelectImage(asset.url);
      }
    };

    if (viewMode === 'list') {
      return (
        <div
          className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
            isSelected 
              ? 'bg-yellow-500/10 border-yellow-500' 
              : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-yellow-500/50'
          }`}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >
          {isMultiSelectMode && (
            <div className="flex-shrink-0">
              {isSelected ? <CheckSquare size={18} className="text-yellow-500" /> : <Square size={18} className="text-zinc-400" />}
            </div>
          )}
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
            <img src={asset.url} alt={asset.name} className="w-full h-full object-contain p-1" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{asset.name}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>{CATEGORY_LABELS[asset.type as AssetCategory] || 'Otros'}</span>
              {usageCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-yellow-500">Usado {usageCount} veces</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); openLightbox(index); }}
            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-zinc-600 transition-all"
          >
            <Eye size={16} />
          </button>
        </div>
      );
    }

    return (
      <div
        className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
          isSelected 
            ? 'border-yellow-500 ring-2 ring-yellow-500/20' 
            : 'border-zinc-200 dark:border-zinc-700 hover:border-yellow-500'
        } ${viewMode === 'masonry' ? 'break-inside-avoid mb-3' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Multi-select checkbox */}
        {(isMultiSelectMode || isSelected) && (
          <div className="absolute top-2 left-2 z-10">
            {isSelected ? (
              <div className="w-6 h-6 bg-yellow-500 rounded-md flex items-center justify-center">
                <Check size={14} className="text-zinc-900" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-white/80 dark:bg-zinc-800/80 rounded-md border-2 border-zinc-300 dark:border-zinc-600" />
            )}
          </div>
        )}

        {/* Image */}
        <div className={`bg-zinc-50 dark:bg-zinc-800/50 ${viewMode === 'masonry' ? '' : 'aspect-square'}`}>
          <img 
            src={asset.url} 
            alt={asset.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); openLightbox(index); }}
            className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Eye size={16} className="text-zinc-900" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSelectImage(asset.url); }}
            className="p-2 bg-yellow-500 rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Check size={16} className="text-zinc-900" />
          </button>
        </div>

        {/* Info badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
          <p className="text-xs font-bold text-white truncate">{asset.name}</p>
          {usageCount > 0 && (
            <p className="text-[10px] text-yellow-400">Usado {usageCount} veces</p>
          )}
        </div>

        {/* Tags indicator */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {asset.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-black/50 text-white text-[8px] rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Folder component
  const FolderCard = ({ category, count }: { category: Exclude<AssetCategory, 'TODAS'>; count: number }) => {
    if (count === 0) return null;
    
    return (
      <button
        onClick={() => {
          setActiveCategory(category);
          setShowFolders(false);
        }}
        className="group flex flex-col items-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500 hover:shadow-md transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 group-hover:bg-yellow-500 flex items-center justify-center mb-2 transition-colors">
          <Folder size={22} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </div>
        <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wide">{CATEGORY_LABELS[category]}</p>
        <p className="text-[10px] text-zinc-400 font-medium">{count} imágenes</p>
      </button>
    );
  };

  return (
    <div 
      ref={dropZoneRef}
      className="relative space-y-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DragOverlay isDragging={isDragging} />

      {/* Header: Search + Actions */}
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o etiqueta..."
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-yellow-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* View mode buttons */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <ViewButton mode="masonry" icon={Layers} title="Masonry" />
            <ViewButton mode="compact" icon={Grid3X3} title="Compacto" />
            <ViewButton mode="grid" icon={LayoutGrid} title="Grid" />
            <ViewButton mode="list" icon={List} title="Lista" />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-select toggle */}
          <button
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              if (isMultiSelectMode) setSelectedIds(new Set());
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              isMultiSelectMode 
                ? 'bg-yellow-500 text-zinc-900' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            {isMultiSelectMode ? <CheckSquare size={14} /> : <Square size={14} />}
            Selección múltiple
          </button>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              showFilters 
                ? 'bg-yellow-500 text-zinc-900' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <Filter size={14} />
            Filtros
          </button>

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-zinc-900 rounded-lg text-xs font-bold hover:bg-yellow-400 transition-all"
          >
            <Upload size={14} />
            Subir
          </button>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <ImageIcon size={12} />
              {galleryAssets.length} total
            </span>
            {selectedIds.size > 0 && (
              <span className="text-yellow-500 font-bold">
                {selectedIds.size} seleccionadas
              </span>
            )}
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
            {/* Sort options */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">Ordenar:</span>
              <div className="flex gap-1">
                {[
                  { value: 'newest', label: 'Más reciente' },
                  { value: 'oldest', label: 'Más antiguo' },
                  { value: 'name', label: 'Nombre' },
                  { value: 'usage', label: 'Más usado' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as SortOption)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      sortBy === opt.value 
                        ? 'bg-yellow-500 text-zinc-900' 
                        : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Usage filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">Mostrar:</span>
              <div className="flex gap-1">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'used', label: 'Usadas' },
                  { value: 'unused', label: 'Sin usar' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterBy(opt.value as FilterOption)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      filterBy === opt.value 
                        ? 'bg-yellow-500 text-zinc-900' 
                        : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-500">Etiquetas:</span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    !selectedTag 
                      ? 'bg-yellow-500 text-zinc-900' 
                      : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  Todas
                </button>
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      selectedTag === tag 
                        ? 'bg-yellow-500 text-zinc-900' 
                        : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selection actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
              {selectedIds.size} seleccionadas
            </span>
            <div className="flex-1" />
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all"
            >
              Seleccionar todas
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all"
            >
              Deseleccionar
            </button>
            {onDeleteImages && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all"
              >
                <Trash2 size={12} />
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" hidden accept="image/*" multiple onChange={handleFileSelect} />

      {/* Folder View */}
      {showFolders && !searchQuery && activeCategory === 'TODAS' && !selectedTag ? (
        <div className="space-y-4">
          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Categorías</span>
              <button
                onClick={() => setShowFolders(false)}
                className="text-[10px] text-yellow-500 hover:text-yellow-600 font-bold"
              >
                Ver todas
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {CATEGORIES.filter(c => c !== 'TODAS').map(cat => {
                const count = groupedAssets[cat]?.length ?? 0;
                return count > 0 ? (
                  <FolderCard key={cat} category={cat as Exclude<AssetCategory, 'TODAS'>} count={count} />
                ) : null;
              })}
            </div>
          </div>

          {/* Custom Folders */}
          {folders.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Carpetas</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {folders.filter(f => f.id !== 'default').map(folder => (
                  <button
                    key={folder.id}
                    className="group flex flex-col items-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500 hover:shadow-md transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-500 flex items-center justify-center mb-2 transition-colors">
                      <Folder size={22} className="text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wide">{folder.name}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{folder.count} imágenes</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setActiveCategory('TODAS');
                setShowFolders(true);
                setSelectedTag(null);
              }}
              className="text-xs text-yellow-500 hover:text-yellow-600 font-bold"
            >
              Galería
            </button>
            {activeCategory !== 'TODAS' && (
              <>
                <ChevronRight size={12} className="text-zinc-400" />
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  {CATEGORY_LABELS[activeCategory]}
                </span>
              </>
            )}
            {selectedTag && (
              <>
                <ChevronRight size={12} className="text-zinc-400" />
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  #{selectedTag}
                </span>
              </>
            )}
            <span className="text-xs text-zinc-400">
              ({filteredAssets.length})
            </span>
          </div>

          {/* Images Grid */}
          {filteredAssets.length > 0 ? (
            <div className={`max-h-[400px] overflow-y-auto pr-2 ${
              viewMode === 'masonry' ? 'columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3' :
              viewMode === 'compact' ? 'grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2' :
              viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 gap-3' :
              'space-y-2'
            }`}>
              {filteredAssets.map((asset, index) => (
                <ImageCard key={asset.id} asset={asset} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ImageIcon size={48} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">
                {searchQuery || selectedTag ? 'Sin resultados' : 'Sin imágenes'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {searchQuery || selectedTag ? 'Intenta con otros filtros' : 'Sube tu primera imagen'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      <Lightbox
        assets={filteredAssets}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={navigateLightbox}
        onSelect={onSelectImage}
      />
    </div>
  );
};

export default ImageGallery;

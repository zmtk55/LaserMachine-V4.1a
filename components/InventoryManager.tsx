import{FilterDisclosure}from'./FilterDisclosure';
import{productPreviewImage}from'../utils/productColorPreview';
import{RowActions}from'./RowActions';
import{useModalFocus}from'../utils/useModalFocus';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Product, ProductBrand, ProductColor, ColorPreset } from '../types';
import { ImageDropZone } from './ImageDropZone';
import { ImageCropper } from './ImageCropper';
import { removeBackground } from '../utils/imageUtils';
import { 
  Search, Plus, Edit2, Trash2, Package, Grid, List, 
  Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown,
  AlertTriangle, Eye, X, Check, UploadCloud, ImagePlus,
  DollarSign, Layers, Tag, Warehouse, GripVertical
} from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  categories: string[];
  globalColors: ColorPreset[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBulkDistributor: () => void;
}

type ViewMode = 'GALLERY' | 'LIST';
type SortField = 'name' | 'price' | 'stock' | 'category' | 'brand';
type SortDirection = 'asc' | 'desc';

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

// Componente para drop zone de variantes múltiples
const MultiImageDropZone = ({ 
  onFilesDrop, 
  className = '' 
}: { 
  onFilesDrop: (files: File[]) => void;
  className?: string;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
    if (files.length > 0) onFilesDrop(files as File[]);
  }, [onFilesDrop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f: File) => f.type.startsWith('image/'));
    if (files.length > 0) onFilesDrop(files as File[]);
    e.target.value = '';
  }, [onFilesDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
        transition-all duration-200
        ${isDragging 
          ? 'border-amber-500 bg-amber-500/10 scale-[1.02]' 
          : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/50'
        }
        ${className}
      `}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-amber-500' : 'text-zinc-400'}`} />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {isDragging ? 'Suelta las imágenes aquí' : 'Arrastra varias imágenes o haz clic'}
      </p>
      <p className="text-xs text-zinc-400 mt-1">Creará variantes automáticamente</p>
    </div>
  );
};

const ProductModal = ({ 
  isOpen, onClose, product, onSave, presetColors, categories 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: Product | null; 
  onSave: (product: Product) => void; 
  presetColors: ColorPreset[];
  categories: string[];
}) => {
  const [formData, setFormData] = useState<Product>(
    product || { 
      id: `prod-${Date.now()}`, name: '', brand: ProductBrand.GENERIC, 
      category: 'General', price: 0, stockThreshold: 5, imageUrl: '', colors: [], sku: ''
    }
  );
  const [pendingVariantImages,setPendingVariantImages]=useState(0);
  const [busyImages,setBusyImages]=useState<string[]>([]);
  const setImageBusy=useCallback((id:string,busy:boolean)=>setBusyImages(prev=>busy?(prev.includes(id)?prev:[...prev,id]):(prev.includes(id)?prev.filter(key=>key!==id):prev)),[]);
  const photosPending=pendingVariantImages>0||busyImages.length>0;
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'main' | { index: number } | null>(null);

  React.useEffect(() => {
    if (product) setFormData(product);
    else setFormData({ 
      id: `prod-${Date.now()}`, name: '', brand: ProductBrand.GENERIC, 
      category: categories[0] || 'General', price: 0, stockThreshold: 5, 
      imageUrl: '', colors: [], sku: ''
    });
  }, [product, isOpen, categories]);

  const handleVariantFiles = useCallback(async (files: File[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      setPendingVariantImages(n=>n+1);
      reader.onerror=()=>setPendingVariantImages(n=>Math.max(0,n-1));
      reader.onabort=()=>setPendingVariantImages(n=>Math.max(0,n-1));
      reader.onload = async (ev) => {
        let url = ev.target?.result as string;
        
        // Auto-remove background
        try {
          url = await removeBackground(url);
        } catch (error) {
          console.error('Error removing background:', error);
        } finally {
          setPendingVariantImages(n=>Math.max(0,n-1));
        }
        
        // Intentar detectar color del nombre del archivo
        const fileName = file.name.toLowerCase().replace(/[_-]/g, ' ');
        const match = presetColors?.find(pc => fileName.includes(pc.name.toLowerCase()));
        
        setFormData(prev => ({
          ...prev,
          colors: [...prev.colors, {
            id: `var-${Date.now()}-${i}`, 
            name: match ? match.name : file.name.split('.')[0].replace(/[_-]/g, ' ').toUpperCase(),
            hex: match ? match.hex : '#888888', 
            stock: 0, 
            imageUrl: url
          }]
        }));
      };
      reader.readAsDataURL(file);
    }
  }, [presetColors]);

  const addEmptyVariant = () => {
    setFormData(prev => ({
      ...prev, colors: [...prev.colors, { id: `var-${Date.now()}`, name: '', hex: '#000000', stock: 0, imageUrl: '' }]
    }));
  };

  const updateVariantImage = (index: number, url: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((c, i) => i === index ? { ...c, imageUrl: url } : c)
    }));
  };

  const handleCropComplete = (croppedUrl: string) => {
    if (cropTarget === 'main') {
      setFormData(prev => ({ ...prev, imageUrl: croppedUrl }));
    } else if (typeof cropTarget === 'object' && 'index' in cropTarget) {
      updateVariantImage(cropTarget.index, croppedUrl);
    }
    setCropImage(null);
    setCropTarget(null);
  };

  const dialogRef=useRef<HTMLDivElement>(null);useModalFocus(isOpen&&!cropImage,dialogRef,onClose);
  const [validation,setValidation]=useState('');
  const saveProduct=()=>{if(photosPending)return;if(!formData.name.trim()){setValidation('Escribe el nombre del producto.');return;}if(!Number.isFinite(formData.price)||formData.price<=0){setValidation('El precio debe ser mayor a cero.');return;}if(!Number.isInteger(formData.stockThreshold)||formData.stockThreshold<0||formData.colors.some(c=>!c.name.trim()||!Number.isInteger(c.stock)||c.stock<0)){setValidation('Revisa los nombres de color y las existencias: usa números enteros de cero en adelante.');return;}onSave(formData);};
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={product?"Editar producto":"Nuevo producto"} className="lm-product-dialog bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-5xl rounded-2xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Cancelar</button>
            <button disabled={photosPending} onClick={saveProduct} className="px-6 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors">{photosPending?'Procesando imágenes...':'Guardar'}</button>
          </div>
        </div>
        {validation&&<p role="alert" className="px-5 py-3 text-red-600">{validation}</p>}<div className="lm-product-fields flex-1 flex overflow-hidden">
          {/* Left Column - Main Image & Info */}
          <div className="w-1/3 p-6 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-zinc-950">
            {/* Main Image with Drag & Drop */}
            <ImageDropZone
              onBusyChange={busy=>setImageBusy('main',busy)}
              value={formData.imageUrl}
              onChange={(url) => setFormData(prev=>({ ...prev, imageUrl: url }))}
              onCrop={(url) => { setCropImage(url); setCropTarget('main'); }}
              label="Imagen Principal"
              placeholder="Arrastra imagen principal"
              aspectRatio="portrait"
            />
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Nombre del Producto</label>
                <input aria-label="Nombre del Producto" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white font-bold uppercase outline-none focus:border-amber-500 transition-colors" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del Producto"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Precio</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/>
                    <input aria-label="Precio" type="number" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 pl-8 rounded-lg text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="0"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Marca</label>
                  <select aria-label="Marca" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value as ProductBrand })}>
                    {Object.values(ProductBrand).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Categoría</label>
                  <select aria-label="Categoría" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Stock Mínimo</label>
                  <input aria-label="Stock Mínimo" type="number" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors" value={formData.stockThreshold} onChange={e => setFormData({ ...formData, stockThreshold: Number(e.target.value) })} placeholder="5"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">SKU (Opcional)</label>
                <input aria-label="SKU (Opcional)" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white font-mono outline-none focus:border-amber-500 transition-colors" value={formData.sku || ''} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="SKU-001"/>
              </div>
            </div>
          </div>
          
          {/* Right Column - Variants */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-900">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-zinc-500 uppercase flex items-center gap-2"><Layers size={16}/> Variantes de Color</h4>
              <div className="flex gap-2">
                <button onClick={addEmptyVariant} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Plus size={14}/> Agregar Manual
                </button>
              </div>
            </div>

            {/* Multi-file Drop Zone */}
            <MultiImageDropZone 
              onFilesDrop={handleVariantFiles}
              className="mb-6"
            />
            
            <div className="space-y-3">
              {formData.colors.map((color, index) => (
                <div key={color.id} className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  {/* Variant Image with Drag & Drop */}
                  <div className="w-20 shrink-0">
                    <ImageDropZone
                      onBusyChange={busy=>setImageBusy(color.id,busy)}
                      value={color.imageUrl}
                      onChange={(url) => setFormData(prev=>({...prev,colors:prev.colors.map(c=>c.id===color.id?{...c,imageUrl:url}:c)}))}
                      aspectRatio="square"
                      showPreview={true}
                    />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Nombre</label>
                      <input aria-label="Nombre" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-zinc-900 dark:text-white text-xs font-bold uppercase outline-none focus:border-amber-500 transition-colors" value={color.name} onChange={e => setFormData({ ...formData, colors: formData.colors.map((c, i) => i === index ? { ...c, name: e.target.value } : c) })} placeholder="COLOR"/>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Hex</label>
                      <div className="flex items-center gap-2">
                        <input aria-label={`Color de ${color.name||'variante'}`} type="color" className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer" value={color.hex} onChange={e => setFormData({ ...formData, colors: formData.colors.map((c, i) => i === index ? { ...c, hex: e.target.value } : c) })}/>
                        <input aria-label={`Código de color de ${color.name||'variante'}`} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-zinc-900 dark:text-white text-xs font-mono outline-none focus:border-amber-500 transition-colors" value={color.hex} onChange={e => setFormData({ ...formData, colors: formData.colors.map((c, i) => i === index ? { ...c, hex: e.target.value } : c) })}/>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Stock</label>
                      <input aria-label="Stock" type="number" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-zinc-900 dark:text-white text-xs text-center font-bold outline-none focus:border-amber-500 transition-colors" value={color.stock} onChange={e => setFormData({ ...formData, colors: formData.colors.map((c, i) => i === index ? { ...c, stock: Number(e.target.value) } : c) })}/>
                    </div>
                  </div>
                  <button aria-label={`Eliminar variante ${color.name||index+1}`} onClick={() => setFormData({ ...formData, colors: formData.colors.filter((_, i) => i !== index) })} className="text-zinc-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
              {formData.colors.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Layers size={32} className="mx-auto text-zinc-300 mb-3"/>
                  <p className="text-xs text-zinc-400 font-bold uppercase">Sin variantes</p>
                  <p className="text-[10px] text-zinc-300 mt-1">Arrastra imágenes arriba para crear variantes automáticamente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {cropImage&&<ImageCropper imageSrc={cropImage} onCropComplete={handleCropComplete} onCancel={()=>{setCropImage(null);setCropTarget(null);}} aspect={3/4}/>}
    </div>
  );
};

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, categories, globalColors, onAddProduct, onUpdateProduct, onDeleteProduct, onBulkDistributor }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [filterBrand, setFilterBrand] = useState<string>('TODAS');
  const [filterStock, setFilterStock] = useState<'ALL' | 'LOW' | 'OUT' | 'OK' | 'PENDING'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query)));
    }
    if (filterCategory !== 'TODAS') result = result.filter(p => p.category === filterCategory);
    if (filterBrand !== 'TODAS') result = result.filter(p => p.brand === filterBrand);
    result = result.filter(p => {
      const totalStock = (p.colors || []).reduce((sum, c) => sum + c.stock, 0);
      switch (filterStock) {
        case 'LOW': return totalStock <= p.stockThreshold && totalStock > 0;
        case 'OUT': return totalStock === 0 && (p.colors || []).length > 0;
        case 'PENDING': return (p.colors || []).length === 0;
        case 'OK': return totalStock > p.stockThreshold;
        default: return true;
      }
    });
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'price': comparison = a.price - b.price; break;
        case 'stock': comparison = (a.colors || []).reduce((s, c) => s + c.stock, 0) - (b.colors || []).reduce((s, c) => s + c.stock, 0); break;
        case 'category': comparison = a.category.localeCompare(b.category); break;
        case 'brand': comparison = a.brand.localeCompare(b.brand); break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [products, searchQuery, filterCategory, filterBrand, filterStock, sortField, sortDirection]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.colors || []).reduce((s, c) => s + c.stock, 0), 0);
    const lowStock = products.filter(p => { const stock = (p.colors || []).reduce((s, c) => s + c.stock, 0); return stock <= p.stockThreshold && stock > 0; }).length;
    const outOfStock = products.filter(p => (p.colors || []).length > 0 && (p.colors || []).reduce((s, c) => s + c.stock, 0) === 0).length;
    const pendingConfirm = products.filter(p => (p.colors || []).length === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.colors || []).reduce((s, c) => s + c.stock, 0)), 0);
    return { totalProducts, totalStock, lowStock, outOfStock, pendingConfirm, totalValue };
  }, [products]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };
  const handleEditProduct = (product: Product) => { setEditingProduct(product); setIsProductModalOpen(true); };
  const handleSaveProduct = (product: Product) => { if (editingProduct) onUpdateProduct(product); else onAddProduct(product); setIsProductModalOpen(false); setEditingProduct(null); };
  const handleDeleteProduct = (product: Product) => { if (confirm(`¿Eliminar "${product.name}"?`)) onDeleteProduct(product.id); };
  const clearFilters = () => { setSearchQuery(''); setFilterCategory('TODAS'); setFilterBrand('TODAS'); setFilterStock('ALL'); };
  const hasActiveFilters = searchQuery || filterCategory !== 'TODAS' || filterBrand !== 'TODAS' || filterStock !== 'ALL';

  return (
    <div className="lm-inventory h-full flex flex-col space-y-6">
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="sr-only">Inventario</h3>
          <p className="text-xs text-zinc-500 mt-1">{filteredProducts.length} de {products.length} productos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBulkDistributor} className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
            <Layers size={14}/> Editar existencias
          </button>
          <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="px-4 py-2.5 bg-yellow-400 text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500/80 shadow-lg shadow-black/20 transition-all flex items-center gap-2">
            <Plus size={16}/> Nuevo producto
          </button>
        </div>
      </div>

      <div className="inventory-summary"><span><strong>{stats.totalProducts}</strong> {stats.totalProducts===1?'producto':'productos'}</span><span><strong>{stats.totalStock}</strong> piezas confirmadas</span>{stats.pendingConfirm>0&&<span className="inventory-unconfirmed">{stats.pendingConfirm} por confirmar</span>}<details><summary aria-label="Resumen del inventario">Resumen</summary><p>{stats.lowStock} con stock bajo · {stats.outOfStock} agotados · Valor confirmado {formatCurrency(stats.totalValue)}</p></details></div>

      {/* Toolbar Compacta */}
      <div className="lm-catalog-toolbar flex flex-col xl:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Buscar productos..." 
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-10 pr-9 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={14}/>
            </button>
          )}
        </div>
        
        {/* Filtros en dropdowns */}
        <FilterDisclosure label="Filtros" count={[filterCategory!=='TODAS',filterBrand!=='TODAS',filterStock!=='ALL'].filter(Boolean).length}><div className="flex gap-2">
          <select aria-label="Categoría de producto"
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)} 
            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="TODAS">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select aria-label="Marca de producto"
            value={filterBrand} 
            onChange={e => setFilterBrand(e.target.value)} 
            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="TODAS">Todas las marcas</option>
            {Array.from(new Set(products.map(p => p.brand))).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          
          <select aria-label="Existencias de producto"
            value={filterStock} 
            onChange={e => setFilterStock(e.target.value as any)} 
            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">Todo el stock</option>
            <option value="LOW">Stock bajo</option>
            <option value="OUT">Agotados</option>
            <option value="PENDING">Por confirmar</option>
            <option value="OK">Disponible</option>
          </select>
          
          </div>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 hover:text-red-500 transition-colors"
              title="Limpiar filtros"
            >
              <X size={16}/>
            </button>
          )}
        </FilterDisclosure>
      </div>

      <div className="inventory-results">{hasActiveFilters?<span>{filteredProducts.length} resultados</span>:<span/>}<label>Ordenar<select aria-label="Ordenar inventario" value={sortField} onChange={e=>{setSortField(e.target.value as SortField);setSortDirection('asc');}}><option value="name">Nombre</option><option value="price">Precio</option><option value="stock">Existencias</option></select></label><button aria-label="Cambiar sentido de orden" onClick={()=>setSortDirection(d=>d==='asc'?'desc':'asc')}>{sortDirection==='asc'?<ArrowUp size={16}/>:<ArrowDown size={16}/>}</button><button aria-label="Ver productos en lista" aria-pressed={viewMode==='LIST'} onClick={()=>setViewMode('LIST')}><List size={17}/></button><button aria-label="Ver productos en galería" aria-pressed={viewMode==='GALLERY'} onClick={()=>setViewMode('GALLERY')}><Grid size={17}/></button></div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Package size={64} className="mb-4 opacity-30"/>
            <p className="text-sm font-bold uppercase mb-2">No se encontraron productos</p>
            <p className="text-xs text-zinc-300">Intenta ajustar los filtros</p>
          </div>
        ) : viewMode === 'GALLERY' ? (
          <div className="lm-product-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map(product => {
              const totalStock = (product.colors || []).reduce((a, b) => a + b.stock, 0);
              const isLowStock = totalStock <= product.stockThreshold && totalStock > 0;
              const isOutOfStock = totalStock === 0 && (product.colors || []).length > 0;
              const noColors = (product.colors || []).length === 0;
              const displayImage = productPreviewImage(product, product.colors?.[0]?.name || 'NEGRO');
              return (
                <div 
                  key={product.id} role="button" tabIndex={0} aria-label={`Editar ${product.name}`}
                  onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleEditProduct(product);}}}
                  onClick={() => handleEditProduct(product)}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="aspect-square bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 relative overflow-hidden">
                    <img 
                      src={displayImage} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={product.name}
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                    
                    {/* Brand + stock badges share one row and wrap instead of overlapping */}
                    <div className="lm-product-badges absolute top-3 left-3 right-3 flex flex-wrap items-start gap-1">
                      <span className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur text-[10px] font-black px-3 py-1.5 rounded-full text-zinc-700 dark:text-zinc-300 uppercase tracking-wider shadow-lg">
                        {product.brand}
                      </span>
                      <span className={`lm-product-stock-badge ml-auto px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${noColors ? 'bg-zinc-500 text-white' : isOutOfStock ? 'bg-red-500 text-white' : isLowStock ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                        {noColors ? 'Inventario por confirmar' : isOutOfStock ? 'Sin Stock' : isLowStock ? 'Bajo Stock' : `${totalStock} pzas`}
                      </span>
                    </div>

                    {/* Price on hover - bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-2xl font-black text-white drop-shadow-lg">{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-4">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white uppercase truncate mb-1 group-hover:text-amber-500 transition-colors">{product.name}</h4>
                    <p className="lm-product-meta"><span>{product.category}</span><strong>{formatCurrency(product.price)}</strong></p>
                    
                    {/* Color dots and stock info */}
                    <div className="flex items-center justify-between">
                      {(product.colors || []).length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {product.colors.slice(0, 5).map((c, i) => (
                            <div 
                              key={i} 
                              className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm" 
                              style={{ backgroundColor: c.hex }} 
                              title={c.name}
                            />
                          ))}
                          {product.colors.length > 5 && (
                            <span className="text-[10px] text-zinc-400 font-bold flex items-center">+{product.colors.length - 5}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Sin colores</span>
                      )}
                      
                      {/* Edit hint */}
                      <span className="text-[10px] font-bold text-zinc-300 group-hover:text-amber-500 transition-colors uppercase tracking-wider">
                        Editar →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="inventory-ledger"><div className="inventory-ledger-head"><span>Producto</span><span>Precio</span><span>Existencias</span><span/></div>{filteredProducts.map(product=>{const count=(product.colors||[]).reduce((n,c)=>n+c.stock,0),unconfirmed=!product.colors?.length;return <div className="inventory-ledger-row" key={product.id}><button className="inventory-product" onClick={()=>handleEditProduct(product)}><img src={productPreviewImage(product, product.colors?.[0]?.name || 'NEGRO')} alt=""/><span><strong>{product.name}</strong><small>{[product.sku,product.brand,product.category].filter(Boolean).join(' · ')}</small></span></button><strong className="inventory-price">{formatCurrency(product.price)}</strong><div className="inventory-quantity">{unconfirmed?<span>Inventario por confirmar</span>:<><strong>{count===0?'Sin Stock':`${count} piezas`}</strong><small>{product.colors.length} {product.colors.length===1?'color':'colores'}</small></>}</div><RowActions label={`Acciones de ${product.name}`}><button onClick={()=>handleEditProduct(product)}><Edit2 size={16}/>Editar producto y colores</button><button onClick={()=>handleDeleteProduct(product)}><Trash2 size={16}/>Eliminar</button></RowActions></div>})}</div>
        )}
      </div>

      {isProductModalOpen&&<ProductModal key={editingProduct?.id??'new'} isOpen={isProductModalOpen} onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }} product={editingProduct} onSave={handleSaveProduct} presetColors={globalColors} categories={categories}/>}
    </div>
  );
};

export default InventoryManager;

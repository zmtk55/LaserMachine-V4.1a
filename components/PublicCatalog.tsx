import React, { useState, useMemo, useEffect } from 'react';
import { Product, ProductColor } from '../types';
import { Search, Filter, Grid, List, ShoppingBag, ArrowLeft, ChevronDown } from 'lucide-react';

interface PublicCatalogProps {
  products: Product[];
  storeName?: string;
  accentColor?: string;
}

export const PublicCatalog: React.FC<PublicCatalogProps> = ({
  products,
  storeName = 'LaserMachine',
  accentColor = '#f59e0b'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'stock'>('name');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Extract unique brands
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return ['TODOS', ...uniqueBrands];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Filter by brand
    if (selectedBrand !== 'TODOS') {
      result = result.filter(p => p.brand === selectedBrand);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return (a.basePrice || 0) - (b.basePrice || 0);
        case 'price-high':
          return (b.basePrice || 0) - (a.basePrice || 0);
        case 'stock':
          const aStock = a.colors?.reduce((sum, c) => sum + c.stock, 0) || 0;
          const bStock = b.colors?.reduce((sum, c) => sum + c.stock, 0) || 0;
          return bStock - aStock;
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, selectedBrand, sortBy]);

  // Generate shareable URL
  const generateShareUrl = (product: Product) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      shared: 'product',
      productId: product.id,
      _t: Date.now().toString()
    });
    return `${baseUrl}?${params.toString()}`;
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleShareProduct = async (product: Product) => {
    const url = generateShareUrl(product);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - ${storeName}`,
          text: `Mira este producto: ${product.name}`,
          url
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      const success = await copyToClipboard(url);
      if (success) {
        alert('Enlace copiado al portapapeles');
      }
    }
  };

  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedProduct(null)}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 font-bold"
          >
            <ArrowLeft size={20} /> Volver al catálogo
          </button>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-xl">
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    {selectedProduct.brand}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white uppercase mt-1">
                    {selectedProduct.name}
                  </h1>
                </div>
                <button
                  onClick={() => handleShareProduct(selectedProduct)}
                  className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-amber-500 hover:text-white transition-colors"
                >
                  <ShoppingBag size={20} />
                </button>
              </div>

              {selectedProduct.description && (
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                  {selectedProduct.description}
                </p>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase text-zinc-500 mb-3">Colores Disponibles</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.colors?.map((color: ProductColor) => (
                    <div
                      key={color.name}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-zinc-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {color.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        ({color.stock} disponible{color.stock !== 1 ? 's' : ''})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-xs font-bold uppercase text-zinc-500">Precio desde</span>
                  <p className="text-3xl font-black" style={{ color: accentColor }}>
                    ${selectedProduct.basePrice || 0}
                  </p>
                </div>
                <button
                  onClick={() => handleShareProduct(selectedProduct)}
                  className="px-8 py-4 rounded-xl font-black uppercase tracking-wider text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accentColor }}
                >
                  Personalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: accentColor }}>
              {storeName}
            </h1>
            <span className="text-sm text-zinc-500">{filteredProducts.length} productos</span>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 text-zinc-900 dark:text-white font-bold placeholder:text-zinc-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
              >
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
              >
                <option value="name">Nombre</option>
                <option value="price-low">Precio: Menor</option>
                <option value="price-high">Precio: Mayor</option>
                <option value="stock">Stock</option>
              </select>

              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-400'}`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-400'}`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={64} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-xl font-bold text-zinc-500">No se encontraron productos</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareProduct(product);
                      }}
                      className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      <ShoppingBag size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4 text-left">
                  <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                    {product.brand}
                  </span>
                  <h3 className="font-black text-zinc-900 dark:text-white uppercase mt-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm font-bold mt-2" style={{ color: accentColor }}>
                    Desde ${product.basePrice || 0}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="w-full flex items-center gap-4 bg-white dark:bg-zinc-900 rounded-2xl p-4 hover:shadow-xl transition-all hover:-translate-y-1 text-left"
              >
                <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                    {product.brand}
                  </span>
                  <h3 className="font-black text-zinc-900 dark:text-white uppercase mt-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
                    {product.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold" style={{ color: accentColor }}>
                    ${product.basePrice || 0}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareProduct(product);
                    }}
                    className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-amber-500 hover:text-white transition-colors"
                  >
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCatalog;

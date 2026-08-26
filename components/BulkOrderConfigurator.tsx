import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Minus, Trash2, Save, Send, ShoppingCart, Package, FileText,
  AlertCircle, CheckCircle2, X, Calculator, PenTool, Layers, ChevronDown
} from 'lucide-react';
import type { Product, BulkOrderItem, DraftOrder, BusinessAccount, User, PricingConfig } from '../types';
import '../src/styles/business-portal-theme.css';

interface BulkOrderConfiguratorProps {
  businessAccount: BusinessAccount;
  user: User;
  products: Product[];
  discountPercent: number;
  pricing?: PricingConfig;
  onSubmit?: (items: BulkOrderItem[], poNumber: string, notes: string) => void;
  onSaveDraft?: (draft: DraftOrder) => void;
}

const fmtMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export const BulkOrderConfigurator: React.FC<BulkOrderConfiguratorProps> = ({
  businessAccount,
  user,
  products,
  discountPercent,
  pricing,
  onSubmit,
  onSaveDraft,
}) => {
  const [activeSection, setActiveSection] = useState<'products' | 'services'>('products');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<BulkOrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(`lm_bulk_draft_${businessAccount.id}`);
      if (saved) return (JSON.parse(saved) as DraftOrder).items || [];
    } catch {}
    return [];
  });
  const [poNumber, setPoNumber] = useState(() => {
    try {
      const saved = localStorage.getItem(`lm_bulk_draft_${businessAccount.id}`);
      if (saved) return (JSON.parse(saved) as DraftOrder).poNumber || '';
    } catch {}
    return '';
  });
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`lm_bulk_draft_${businessAccount.id}`);
      if (saved) return (JSON.parse(saved) as DraftOrder).notes || '';
    } catch {}
    return '';
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Engraving-only quote state
  const [quoteQty, setQuoteQty] = useState(1);
  const [quoteSides, setQuoteSides] = useState(1);
  const [quoteHasLogo, setQuoteHasLogo] = useState(false);
  const [quoteItems, setQuoteItems] = useState<BulkOrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(`lm_bulk_draft_${businessAccount.id}`);
      if (saved) {
        const draft = JSON.parse(saved) as DraftOrder;
        return (draft.items || []).filter((i) => i.productId.startsWith('SRV-'));
      }
    } catch {}
    return [];
  });

  const activeProducts = useMemo(() => products.filter((p) => p.isActive !== false), [products]);
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return activeProducts;
    const q = search.toLowerCase();
    return activeProducts.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [activeProducts, search]);

  const addItem = (product: Product, colorName: string) => {
    const exists = items.find((i) => i.productId === product.id && i.colorName === colorName);
    if (exists) {
      updateQuantity(exists.id, exists.quantity + 1);
      return;
    }
    const unitPrice = product.price;
    const finalUnitPrice = unitPrice * (1 - discountPercent / 100);
    const newItem: BulkOrderItem = {
      id: `BI-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      colorName,
      colorHex: product.colors.find((c) => c.name === colorName)?.hex,
      quantity: 1,
      unitPrice,
      discountPercent,
      finalUnitPrice,
      subtotal: finalUnitPrice,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity, subtotal: i.finalUnitPrice * quantity } : i)));
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const addQuoteItem = () => {
    const base = pricing?.baseEngravingPrice || 100;
    const extra = pricing?.extraSidePrice || 50;
    const logo = pricing?.logoSurcharge || 80;
    const unitPrice = base + (quoteSides > 1 ? extra * (quoteSides - 1) : 0) + (quoteHasLogo ? logo : 0);
    const finalUnitPrice = unitPrice * (1 - discountPercent / 100);
    const newItem: BulkOrderItem = {
      id: `SRV-${Date.now()}`,
      productId: `SRV-GRABADO`,
      productName: `Servicio de grabado${quoteSides > 1 ? ` (${quoteSides} lados)` : ''}${quoteHasLogo ? ' + logo' : ''}`,
      colorName: '-',
      quantity: quoteQty,
      unitPrice,
      discountPercent,
      finalUnitPrice,
      subtotal: finalUnitPrice * quoteQty,
    };
    setQuoteItems((prev) => [...prev, newItem]);
    setItems((prev) => [...prev, newItem]);
  };

  const removeQuoteItem = (id: string) => {
    setQuoteItems((prev) => prev.filter((i) => i.id !== id));
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const productItems = items.filter((i) => !i.productId.startsWith('SRV-'));
  const serviceItems = items.filter((i) => i.productId.startsWith('SRV-'));
  const total = useMemo(() => items.reduce((sum, i) => sum + i.subtotal, 0), [items]);
  const totalQty = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const savings = useMemo(() => items.reduce((sum, i) => sum + (i.unitPrice - i.finalUnitPrice) * i.quantity, 0), [items]);

  const saveDraft = () => {
    const draft: DraftOrder = {
      id: `DRAFT-${Date.now()}`,
      businessId: businessAccount.id,
      createdById: user.id,
      createdByName: user.name,
      items,
      poNumber,
      notes,
      total,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try { localStorage.setItem(`lm_bulk_draft_${businessAccount.id}`, JSON.stringify(draft)); } catch {}
    onSaveDraft?.(draft);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const submitOrder = () => {
    if (items.length === 0) return;
    onSubmit?.(items, poNumber, notes);
    try { localStorage.removeItem(`lm_bulk_draft_${businessAccount.id}`); } catch {}
    setItems([]);
    setQuoteItems([]);
    setPoNumber('');
    setNotes('');
  };

  useEffect(() => {
    const draft: DraftOrder = {
      id: `DRAFT-AUTO`,
      businessId: businessAccount.id,
      createdById: user.id,
      createdByName: user.name,
      items,
      poNumber,
      notes,
      total,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try { localStorage.setItem(`lm_bulk_draft_${businessAccount.id}`, JSON.stringify(draft)); } catch {}
  }, [items, poNumber, notes, total, businessAccount.id, user.id, user.name]);

  return (
    <div className="h-[calc(100vh-140px)] md:h-auto flex flex-col md:flex-row gap-5">
      {/* Left: Catalog / Services */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bp-card p-3 mb-4 flex gap-2">
          <button
            onClick={() => setActiveSection('products')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${activeSection === 'products' ? 'bg-[var(--bp-accent)] text-black' : 'bg-[var(--bp-bg-elevated)] text-[var(--bp-text-secondary)] hover:bg-[var(--bp-bg-sunken)]'}`}
          >
            <Package size={14} /> Productos
          </button>
          <button
            onClick={() => setActiveSection('services')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${activeSection === 'services' ? 'bg-[var(--bp-accent)] text-black' : 'bg-[var(--bp-bg-elevated)] text-[var(--bp-text-secondary)] hover:bg-[var(--bp-bg-sunken)]'}`}
          >
            <PenTool size={14} /> Solo grabado
          </button>
        </div>

        {activeSection === 'products' && (
          <>
            <div className="bp-card p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto, SKU, marca..."
                  className="bp-input pl-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bp-scrollbar pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} discountPercent={discountPercent} onAdd={addItem} />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-[var(--bp-text-tertiary)]">
                  <Package size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No se encontraron productos</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeSection === 'services' && (
          <div className="flex-1 overflow-y-auto bp-scrollbar">
            <div className="bp-card p-5 mb-4">
              <h3 className="font-semibold text-[var(--bp-text-primary)] mb-1 flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
                <Calculator size={18} className="text-[var(--bp-accent)]" />
                Cotizador de grabado
              </h3>
              <p className="text-xs text-[var(--bp-text-tertiary)] mb-4">
                Calcula el costo de grabado sin comprar el producto. Precios base: {fmtMoney(pricing?.baseEngravingPrice || 100)} por lado, {fmtMoney(pricing?.extraSidePrice || 50)} lado extra, {fmtMoney(pricing?.logoSurcharge || 80)} por logo.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase block mb-1">Cantidad</label>
                  <input type="number" min={1} value={quoteQty} onChange={(e) => setQuoteQty(Math.max(1, Number(e.target.value)))} className="bp-input" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase block mb-1">Lados a grabar</label>
                  <select value={quoteSides} onChange={(e) => setQuoteSides(Number(e.target.value))} className="bp-input">
                    <option value={1}>1 lado</option>
                    <option value={2}>2 lados</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-[var(--bp-text-primary)] cursor-pointer">
                    <input type="checkbox" checked={quoteHasLogo} onChange={(e) => setQuoteHasLogo(e.target.checked)} className="w-4 h-4 accent-[var(--bp-accent)]" />
                    Incluye logo
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between bg-[var(--bp-bg-elevated)] rounded-lg p-3 border border-[var(--bp-border)]">
                <div>
                  <p className="text-xs text-[var(--bp-text-tertiary)]">Precio unitario con descuento</p>
                  <p className="text-lg font-bold text-[var(--bp-text-primary)]">
                    {fmtMoney(
                      ((pricing?.baseEngravingPrice || 100) +
                        (quoteSides > 1 ? (pricing?.extraSidePrice || 50) * (quoteSides - 1) : 0) +
                        (quoteHasLogo ? pricing?.logoSurcharge || 80 : 0)) *
                        (1 - discountPercent / 100)
                    )}
                  </p>
                </div>
                <button onClick={addQuoteItem} className="bp-btn bp-btn-primary px-4 py-2.5">
                  <Plus size={16} /> Agregar al pedido
                </button>
              </div>
            </div>

            {serviceItems.length > 0 && (
              <div className="bp-card p-4">
                <h4 className="font-semibold text-[var(--bp-text-primary)] mb-3" style={{ fontFamily: 'var(--bp-font-heading)' }}>Servicios agregados</h4>
                <div className="space-y-2">
                  {serviceItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg">
                      <div>
                        <p className="font-medium text-[var(--bp-text-primary)] text-sm">{item.productName}</p>
                        <p className="text-[11px] text-[var(--bp-text-tertiary)]">Cantidad: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[var(--bp-text-primary)]">{fmtMoney(item.subtotal)}</span>
                        <button onClick={() => removeQuoteItem(item.id)} className="p-1.5 text-[var(--bp-text-muted)] hover:text-[var(--bp-error)]">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Order Summary */}
      <div className="w-full md:w-96 flex flex-col">
        <div className="bp-card flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bp-border)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--bp-text-primary)] flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
              <ShoppingCart size={18} className="text-[var(--bp-accent)]" />
              Tu pedido
            </h3>
            <span className="bp-badge bp-badge-muted">{totalQty} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bp-scrollbar">
            {items.length === 0 ? (
              <div className="text-center py-10 text-[var(--bp-text-tertiary)]">
                <ShoppingCart size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Selecciona productos o servicios para comenzar</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--bp-text-primary)] text-sm truncate">{item.productName}</p>
                      {item.colorName !== '-' && <p className="text-[11px] text-[var(--bp-text-tertiary)]">{item.colorName}</p>}
                    </div>
                    <button onClick={() => item.productId.startsWith('SRV-') ? removeQuoteItem(item.id) : removeItem(item.id)} className="p-1.5 text-[var(--bp-text-muted)] hover:text-[var(--bp-error)] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-md bg-[var(--bp-surface)] border border-[var(--bp-border)] flex items-center justify-center hover:bg-[var(--bp-bg-sunken)] transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold text-[var(--bp-text-primary)] w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-md bg-[var(--bp-surface)] border border-[var(--bp-border)] flex items-center justify-center hover:bg-[var(--bp-bg-sunken)] transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[var(--bp-text-primary)]">{fmtMoney(item.subtotal)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-[var(--bp-border)] space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">PO Number</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={16} />
                <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Ej. PO-2024-001" className="bp-input pl-10" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones especiales..." rows={2} className="bp-input resize-none" />
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--bp-text-secondary)]">Subtotal</span>
                <span className="text-[var(--bp-text-primary)] font-medium">{fmtMoney(total + savings)}</span>
              </div>
              {savings > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--bp-text-secondary)]">Descuento empresa</span>
                  <span className="text-[var(--bp-success)] font-medium">-{fmtMoney(savings)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base pt-2 border-t border-[var(--bp-border)]">
                <span className="font-semibold text-[var(--bp-text-primary)]">Total</span>
                <span className="font-bold text-[var(--bp-text-primary)] text-lg">{fmtMoney(total)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={saveDraft} className="bp-btn bp-btn-secondary flex-1 py-2.5">
                <Save size={16} /> Guardar
              </button>
              <button onClick={submitOrder} disabled={items.length === 0} className="bp-btn bp-btn-primary flex-1 py-2.5 disabled:opacity-40">
                <Send size={16} /> Enviar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-[150] bg-[var(--bp-success-bg)] text-[var(--bp-success)] px-4 py-3 rounded-xl border border-[var(--bp-success)]/20 shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Borrador guardado</span>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Product Card with explicit add button and color selector
// ------------------------------------------------------------------
const ProductCard = ({
  product, discountPercent, onAdd,
}: { product: Product; discountPercent: number; onAdd: (p: Product, color: string) => void; key?: React.Key }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const color = product.colors.find((c) => c.name === selectedColor);
  const finalPrice = product.price * (1 - discountPercent / 100);

  return (
    <div className="bp-card p-4 flex flex-col">
      <div className="aspect-square bg-[var(--bp-bg-sunken)] rounded-lg overflow-hidden mb-3">
        <img src={color?.imageUrl || product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <p className="text-[10px] text-[var(--bp-text-tertiary)] font-medium uppercase tracking-wide">{product.brand}</p>
      <p className="font-semibold text-[var(--bp-text-primary)] text-sm truncate">{product.name}</p>
      <p className="text-xs text-[var(--bp-text-muted)] mt-0.5">{fmtMoney(finalPrice)}</p>

      <div className="mt-3">
        <label className="text-[10px] font-semibold text-[var(--bp-text-tertiary)] uppercase block mb-1.5">Color</label>
        <div className="relative">
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="bp-input py-2 pr-8 text-xs appearance-none"
          >
            {product.colors.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.stock} disp.)
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)] pointer-events-none" />
        </div>
      </div>

      <button
        onClick={() => onAdd(product, selectedColor)}
        className="mt-3 w-full bp-btn bp-btn-primary py-2.5"
      >
        <Plus size={16} /> Agregar
      </button>
    </div>
  );
};

export default BulkOrderConfigurator;

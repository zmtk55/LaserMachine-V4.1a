import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, Building2, CheckCircle2, Clock, CreditCard, Grid3X3, Heart, Home,
  History, MessageCircle, Moon, Package, Palette, PenTool, Receipt, Search, Send, Sun, Type,
  Users, X, ChevronRight, TrendingUp, BarChart3, Plus, Trash2, FileText, AlertCircle,
  ShoppingBag, Save, Star, Eye, Download, UserPlus, ShieldCheck, LogOut,
  Sparkles, Zap, MoreHorizontal, Filter, ArrowUpRight
} from 'lucide-react';
import type {
  BusinessAccount, BusinessChatMessage, FontOption, Order, Product, StoreConfig, User,
  BulkOrderItem, DraftOrder, BusinessInvoice, AuditLogEntry, BusinessUser, PricingConfig
} from '../types';
import { OrderStatus, UserRole } from '../types';
import { TechnicalPreview } from './TechnicalPreview';
import { BulkOrderConfigurator } from './BulkOrderConfigurator';
import '../src/styles/business-portal-theme.css';

type BusinessTab = 'home' | 'orders' | 'bulk' | 'catalog' | 'fonts' | 'chat' | 'account';

interface BusinessPortalProps {
  user: User;
  businessAccount: BusinessAccount;
  orders: Order[];
  products: Product[];
  fonts: FontOption[];
  storeConfig: StoreConfig;
  pricing?: PricingConfig;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  onProductSelect?: (product: Product) => void;
  onSelectFontForCustomizer?: (fontId: number, text: string) => void;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const fmtMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShortDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
const fmtMonthShort = (i: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return d.toLocaleDateString('es-MX', { month: 'short' });
};

const TIER_META: Record<string, { label: string; percent: number }> = {
  NONE: { label: 'Estándar', percent: 0 },
  BRONZE: { label: 'Bronce', percent: 5 },
  SILVER: { label: 'Plata', percent: 10 },
  GOLD: { label: 'Oro', percent: 15 },
  PLATINUM: { label: 'Platino', percent: 20 },
};

const STATUS_META: Record<OrderStatus, { label: string; cls: string; icon: React.ElementType }> = {
  [OrderStatus.RECEIVED]: { label: 'Recibido', cls: 'bp-badge-accent', icon: Package },
  [OrderStatus.WAITING_APPROVAL]: { label: 'Aprobación', cls: 'bp-badge-muted', icon: Clock },
  [OrderStatus.IN_PRODUCTION]: { label: 'Producción', cls: 'bp-badge-accent', icon: PenTool },
  [OrderStatus.READY]: { label: 'Listo', cls: 'bp-badge-success', icon: CheckCircle2 },
  [OrderStatus.COMPLETED]: { label: 'Entregado', cls: 'bp-badge-muted', icon: CheckCircle2 },
  [OrderStatus.CANCELLED]: { label: 'Cancelado', cls: 'bp-badge-error', icon: X },
};

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const s = STATUS_META[status];
  const Icon = s.icon;
  return (
    <span className={`bp-badge ${s.cls}`}>
      <Icon size={11} />
      {s.label}
    </span>
  );
};

// ------------------------------------------------------------------
// Atmosphere
// ------------------------------------------------------------------
const AtmosphereBackground: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
    <div
      className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full opacity-40"
      style={{
        background: 'radial-gradient(circle at 30% 30%, var(--bp-accent-300), transparent 60%)',
        filter: 'blur(80px)',
        animation: 'bp-mesh-1 18s ease-in-out infinite alternate',
      }}
    />
    <div
      className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle at 70% 70%, var(--bp-accent-400), transparent 60%)',
        filter: 'blur(90px)',
        animation: 'bp-mesh-2 22s ease-in-out infinite alternate',
      }}
    />
    <div
      className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle at 50% 50%, var(--bp-accent-200), transparent 60%)',
        filter: 'blur(100px)',
        animation: 'bp-mesh-3 26s ease-in-out infinite alternate',
      }}
    />
    <style>{`
      @keyframes bp-mesh-1 {
        from { transform: translate(0, 0) scale(1); }
        to { transform: translate(6%, 4%) scale(1.08); }
      }
      @keyframes bp-mesh-2 {
        from { transform: translate(0, 0) scale(1); }
        to { transform: translate(-4%, 6%) scale(1.05); }
      }
      @keyframes bp-mesh-3 {
        from { transform: translate(0, 0) scale(1); }
        to { transform: translate(3%, -3%) scale(1.1); }
      }
    `}</style>
  </div>
);

// ------------------------------------------------------------------
// Sidebar
// ------------------------------------------------------------------
interface SidebarItemProps {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, icon: Icon, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
      active
        ? 'bg-[var(--bp-accent-bg)] text-[var(--bp-accent-text)] shadow-[0_0_0_1px_var(--bp-accent-subtle)]'
        : 'text-[var(--bp-text-secondary)] hover:text-[var(--bp-text-primary)] hover:bg-[var(--bp-bg-elevated)]'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2 : 1.75} />
    <span className="hidden lg:block">{label}</span>
    {badge ? (
      <span className="hidden lg:flex ml-auto text-[10px] px-2 py-0.5 bg-[var(--bp-accent)] text-[var(--bp-text-inverse)] rounded-full font-semibold">
        {badge}
      </span>
    ) : null}
  </button>
);

// ------------------------------------------------------------------
// Bento / Home
// ------------------------------------------------------------------
interface HomeTabProps {
  stats: { total: number; completed: number; pending: number; spent: number };
  tier: { label: string; percent: number };
  businessAccount: BusinessAccount;
  myOrders: Order[];
  setSelectedOrder: (o: Order | null) => void;
  setActiveTab: (t: BusinessTab) => void;
  creditAvailable: number;
  creditPercent: number;
}

const HomeTab: React.FC<HomeTabProps> = ({
  stats, tier, businessAccount, myOrders, setSelectedOrder, setActiveTab, creditAvailable, creditPercent,
}) => {
  const monthlySpend = useMemo(() => {
    const now = new Date();
    return myOrders
      .filter((o) => o.status !== OrderStatus.CANCELLED && new Date(o.createdAt).getMonth() === now.getMonth())
      .reduce((sum, o) => sum + o.total, 0);
  }, [myOrders]);

  const barData = useMemo(() => {
    const months: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const spent = myOrders
        .filter((o) => o.status !== OrderStatus.CANCELLED && new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear())
        .reduce((sum, o) => sum + o.total, 0);
      months.push(spent);
    }
    const max = Math.max(1, ...months);
    return { months, max };
  }, [myOrders]);

  return (
    <div className="space-y-5">
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bp-card bp-card-hover p-5 bp-animate-in bp-delay-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Package size={48} className="text-[var(--bp-accent)]" />
          </div>
          <p className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide">Pedidos totales</p>
          <p className="text-3xl font-bold text-[var(--bp-text-primary)] mt-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>{stats.total}</p>
          <div className="mt-3 h-1.5 bg-[var(--bp-bg-elevated)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--bp-accent)]" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bp-card bp-card-hover p-5 bp-animate-in bp-delay-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <CheckCircle2 size={48} className="text-[var(--bp-success)]" />
          </div>
          <p className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide">Completados</p>
          <p className="text-3xl font-bold text-[var(--bp-text-primary)] mt-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>{stats.completed}</p>
          <div className="mt-3 h-1.5 bg-[var(--bp-bg-elevated)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--bp-success)]" style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bp-card bp-card-hover p-5 bp-animate-in bp-delay-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Clock size={48} className="text-[var(--bp-info)]" />
          </div>
          <p className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide">En proceso</p>
          <p className="text-3xl font-bold text-[var(--bp-text-primary)] mt-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>{stats.pending}</p>
          <div className="mt-3 h-1.5 bg-[var(--bp-bg-elevated)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--bp-info)]" style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bp-card bp-card-hover p-5 bp-animate-in bp-delay-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <CreditCard size={48} className="text-[var(--bp-accent)]" />
          </div>
          <p className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide">Total comprado</p>
          <p className="text-3xl font-bold text-[var(--bp-text-primary)] mt-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>{fmtMoney(stats.spent)}</p>
          <div className="mt-3 h-1.5 bg-[var(--bp-bg-elevated)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--bp-accent)]" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Second bento row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Credit line — spans 2 cols */}
        <div className="lg:col-span-2 bp-card p-6 bp-animate-in bp-delay-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--bp-text-primary)] flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
              <CreditCard size={16} className="text-[var(--bp-text-tertiary)]" />
              Línea de crédito
            </h3>
            <span className="bp-badge bp-badge-accent">{tier.label} • {tier.percent}% dto.</span>
          </div>
          <div className="flex items-end gap-2 mb-5">
            <span className="text-4xl font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>{fmtMoney(creditAvailable)}</span>
            <span className="text-sm text-[var(--bp-text-tertiary)] mb-1.5">disponibles</span>
          </div>
          <div className="h-2.5 bg-[var(--bp-bg-elevated)] rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, creditPercent)}%`,
                background: creditPercent > 80
                  ? 'linear-gradient(90deg, var(--bp-error), var(--bp-warning))'
                  : 'linear-gradient(90deg, var(--bp-accent), var(--bp-accent-300))',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--bp-text-tertiary)]">
            <span>Usado: {fmtMoney(businessAccount.creditUsed)}</span>
            <span>Límite: {fmtMoney(businessAccount.creditLimit)}</span>
          </div>
          {creditPercent > 80 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--bp-warning)] bg-[var(--bp-warning-bg)] px-3 py-2.5 rounded-lg border border-[var(--bp-warning)]/20">
              <AlertCircle size={14} />
              <span>Has utilizado más del 80% de tu línea de crédito.</span>
            </div>
          )}
        </div>

        {/* Representative */}
        <div className="bp-card p-6 bp-animate-in bp-delay-6">
          <h3 className="font-semibold text-[var(--bp-text-primary)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
            <Users size={16} className="text-[var(--bp-text-tertiary)]" />
            Tu representante
          </h3>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] flex items-center justify-center text-base font-bold text-[var(--bp-text-primary)]">
              {(businessAccount.assignedRepName || 'R')[0]}
            </div>
            <div>
              <p className="font-semibold text-[var(--bp-text-primary)] text-sm">{businessAccount.assignedRepName || 'Por asignar'}</p>
              <p className="text-[11px] text-[var(--bp-text-tertiary)]">LaserMachine</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('chat')} className="bp-btn bp-btn-secondary w-full py-2.5">
            Enviar mensaje
          </button>
        </div>
      </div>

      {/* Monthly spend mini chart */}
      <div className="bp-card p-6 bp-animate-in" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--bp-text-primary)] flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
            <BarChart3 size={16} className="text-[var(--bp-text-tertiary)]" />
            Gasto mensual
          </h3>
          <span className="text-sm font-bold text-[var(--bp-text-primary)]">{fmtMoney(monthlySpend)}</span>
        </div>
        <div className="flex items-end gap-3 h-28">
          {barData.months.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg relative overflow-hidden bg-[var(--bp-accent-bg)]"
                style={{ height: `${(v / barData.max) * 100}%`, minHeight: v > 0 ? 6 : 2 }}
              >
                <div className="absolute inset-0 bg-[var(--bp-accent)] opacity-70" />
              </div>
              <span className="text-[10px] font-medium text-[var(--bp-text-muted)]">{fmtMonthShort(5 - i)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bp-card overflow-hidden bp-animate-in" style={{ animationDelay: '280ms' }}>
        <div className="px-6 py-4 border-b border-[var(--bp-border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Pedidos recientes</h3>
          <button onClick={() => setActiveTab('orders')} className="bp-btn bp-btn-ghost px-2 py-1 text-xs">
            Ver todos <ArrowRight size={12} />
          </button>
        </div>
        <div className="divide-y divide-[var(--bp-border)]">
          {myOrders.slice(0, 5).map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--bp-bg-elevated)] transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg flex items-center justify-center">
                  <Package size={18} className="text-[var(--bp-text-tertiary)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--bp-text-primary)] text-sm">Pedido #{order.id}</p>
                  <p className="text-[11px] text-[var(--bp-text-tertiary)]">{fmtShortDate(order.createdAt)} • {order.items.length} productos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={order.status} />
                <span className="font-semibold text-[var(--bp-text-primary)] text-sm w-20 text-right">{fmtMoney(order.total)}</span>
                <ChevronRight size={16} className="text-[var(--bp-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
          {myOrders.length === 0 && (
            <div className="px-6 py-12 text-center text-[var(--bp-text-tertiary)]">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="opacity-40" />
              </div>
              <p className="text-sm font-medium text-[var(--bp-text-secondary)]">No hay pedidos</p>
              <p className="text-xs text-[var(--bp-text-tertiary)] mt-1 max-w-xs mx-auto">Tus pedidos aparecerán aquí una vez que los realices.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Orders
// ------------------------------------------------------------------
interface OrdersTabProps {
  myOrders: Order[];
  setSelectedOrder: (o: Order | null) => void;
  onReorder: (o: Order) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ myOrders, setSelectedOrder, onReorder }) => {
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() => {
    if (!filter.trim()) return myOrders;
    const q = filter.toLowerCase();
    return myOrders.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      fmtDate(o.createdAt).toLowerCase().includes(q)
    );
  }, [myOrders, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Pedidos de empresa</h1>
          <p className="text-sm text-[var(--bp-text-tertiary)] mt-0.5">{filtered.length} de {myOrders.length} pedidos</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={16} />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar pedido..." className="bp-input pl-10 w-48 md:w-64" />
        </div>
      </div>
      <div className="bp-card overflow-hidden">
        <div className="divide-y divide-[var(--bp-border)]">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[var(--bp-bg-elevated)] transition-colors text-left group"
            >
              <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-4 flex-1 text-left">
                <div className="w-10 h-10 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg flex items-center justify-center">
                  <Package size={18} className="text-[var(--bp-text-tertiary)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--bp-text-primary)] text-sm">Pedido #{order.id}</p>
                  <p className="text-[11px] text-[var(--bp-text-tertiary)]">{fmtDate(order.createdAt)}</p>
                </div>
              </button>
              <div className="flex items-center gap-3 sm:gap-4">
                <StatusBadge status={order.status} />
                <span className="font-semibold text-[var(--bp-text-primary)] text-sm w-20 text-right hidden sm:block">{fmtMoney(order.total)}</span>
                <button
                  onClick={() => onReorder(order)}
                  className="bp-btn bp-btn-ghost px-2 py-1.5 text-xs"
                  title="Reordenar"
                >
                  <History size={14} />
                </button>
                <ChevronRight size={16} className="text-[var(--bp-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-[var(--bp-text-tertiary)]">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="opacity-40" />
              </div>
              <p className="text-sm font-medium text-[var(--bp-text-secondary)]">Sin resultados</p>
              <p className="text-xs text-[var(--bp-text-tertiary)] mt-1 max-w-xs mx-auto">No encontramos pedidos que coincidan con tu búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Catalog
// ------------------------------------------------------------------
interface CatalogTabProps {
  products: Product[];
  tier: { label: string; percent: number };
  onProductSelect?: (p: Product) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  recentlyViewed: string[];
  markViewed: (id: string) => void;
}

const CatalogTab: React.FC<CatalogTabProps> = ({ products, tier, onProductSelect, favorites, toggleFavorite, recentlyViewed, markViewed }) => {
  const activeProducts = products.filter((p) => p.isActive !== false);
  const [search, setSearch] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const filtered = useMemo(() => {
    let list = activeProducts;
    if (showFavorites) list = list.filter((p) => favorites.includes(p.id));
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [activeProducts, search, showFavorites, favorites]);
  const priceWithDiscount = (p: number) => p * (1 - tier.percent / 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Catálogo</h1>
          <p className="text-sm text-[var(--bp-text-tertiary)] mt-0.5">Precios con {tier.percent}% de descuento por tier {tier.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFavorites(!showFavorites)} className={`bp-btn px-3 py-2 text-xs ${showFavorites ? 'bp-btn-primary' : 'bp-btn-secondary'}`}>
            <Heart size={14} className={showFavorites ? 'fill-current' : ''} /> Favoritos
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="bp-input pl-9 py-2 text-xs w-40" />
          </div>
        </div>
      </div>

      {recentlyViewed.length > 0 && !showFavorites && !search && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide mb-2">Vistos recientemente</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentlyViewed.map((id) => {
              const p = products.find((x) => x.id === id);
              if (!p) return null;
              return (
                <button
                  key={id}
                  onClick={() => { markViewed(p.id); onProductSelect?.(p); }}
                  className="shrink-0 w-24 text-left"
                >
                  <div className="aspect-square bg-[var(--bp-bg-sunken)] rounded-xl overflow-hidden mb-1 border border-[var(--bp-border)]">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] text-[var(--bp-text-primary)] truncate">{p.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="bp-card bp-card-hover overflow-hidden group relative">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
              aria-label="Favorito"
            >
              <Heart size={14} className={favorites.includes(product.id) ? 'fill-current text-[var(--bp-accent)]' : ''} />
            </button>
            <div className="aspect-square bg-[var(--bp-bg-sunken)] relative overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => { markViewed(product.id); onProductSelect?.(product); }}
                  className="px-4 py-2 bg-[var(--bp-surface)] text-[var(--bp-text-primary)] text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[var(--bp-bg-elevated)] transition-colors border border-[var(--bp-border)]"
                >
                  <PenTool size={14} /> Personalizar
                </button>
              </div>
              {tier.percent > 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-[var(--bp-accent)] text-[var(--bp-text-inverse)] text-[10px] font-bold rounded-md">
                  -{tier.percent}%
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-[10px] text-[var(--bp-text-tertiary)] font-medium uppercase tracking-wide">{product.brand}</p>
              <p className="font-semibold text-[var(--bp-text-primary)] text-sm truncate mt-0.5">{product.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="font-bold text-[var(--bp-text-primary)]">{fmtMoney(priceWithDiscount(product.price))}</p>
                {tier.percent > 0 && <p className="text-xs text-[var(--bp-text-muted)] line-through">{fmtMoney(product.price)}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="px-6 py-12 text-center text-[var(--bp-text-tertiary)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="opacity-40" />
          </div>
          <p className="text-sm font-medium text-[var(--bp-text-secondary)]">Sin resultados</p>
          <p className="text-xs text-[var(--bp-text-tertiary)] mt-1 max-w-xs mx-auto">Prueba con otro término de búsqueda.</p>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Fonts
// ------------------------------------------------------------------
interface FontsTabProps {
  fonts: FontOption[];
  businessAccount: BusinessAccount;
  onSelectFontForCustomizer?: (id: number, text: string) => void;
}

const FontsTab: React.FC<FontsTabProps> = ({ fonts, businessAccount, onSelectFontForCustomizer }) => {
  const activeFonts = fonts.filter((f) => f.isActive !== false);
  const [previewText, setPreviewText] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const display = previewText || businessAccount.companyName || 'Preview';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Fuentes aprobadas</h1>
          <p className="text-sm text-[var(--bp-text-tertiary)] mt-0.5">Tipografías disponibles para tu marca</p>
        </div>
      </div>

      <div className="bp-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={16} />
            <input value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Escribe un preview..." className="bp-input pl-10" />
          </div>
          <div className="flex items-center gap-3 md:w-64">
            <span className="text-xs text-[var(--bp-text-tertiary)] w-10">{fontSize}px</span>
            <input
              type="range"
              min={20}
              max={64}
              step={4}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1 h-1.5 bg-[var(--bp-bg-elevated)] rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'var(--bp-accent)' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeFonts.map((font) => {
          const approved = businessAccount.brandKit.approvedFonts.includes(font.id);
          return (
            <div key={font.id} className={`bp-card p-4 transition-opacity ${approved ? '' : 'opacity-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-[var(--bp-text-tertiary)] font-medium uppercase tracking-wide">{font.category}</span>
                {approved ? <span className="bp-badge bp-badge-success">Aprobada</span> : <span className="bp-badge bp-badge-muted">No aprobada</span>}
              </div>
              <p className="text-[var(--bp-text-primary)] break-words mb-4 min-h-[48px]" style={{ fontFamily: font.cssFamily, fontSize: `${fontSize}px` }}>
                {display}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--bp-text-secondary)]">{font.name}</span>
                {approved && onSelectFontForCustomizer && (
                  <button onClick={() => onSelectFontForCustomizer(font.id, display)} className="bp-btn bp-btn-secondary px-3 py-1.5">
                    Usar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Chat
// ------------------------------------------------------------------
interface ChatTabProps {
  businessAccount: BusinessAccount;
  user: User;
  chatMessages: BusinessChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<BusinessChatMessage[]>>;
  lastOrder?: Order | null;
  stats?: { total: number; spent: number };
}

const ChatTab: React.FC<ChatTabProps> = ({ businessAccount, user, chatMessages, setChatMessages, lastOrder, stats }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const send = () => {
    if (!input.trim()) return;
    const msg: BusinessChatMessage = {
      id: Date.now().toString(),
      businessId: businessAccount.id,
      senderId: user.id,
      senderName: user.name,
      senderRole: 'BUSINESS',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    setChatMessages((prev) => [...prev, msg]);
    setInput('');
    setTimeout(() => {
      setChatMessages((prev) => [...prev, {
        id: `rep-${Date.now()}`,
        businessId: businessAccount.id,
        senderId: 'rep-1',
        senderName: businessAccount.assignedRepName || 'Representante',
        senderRole: 'REP',
        content: 'Gracias por tu mensaje. Tu representante te responderá a la brevedad.',
        timestamp: new Date().toISOString(),
        read: true,
      }]);
    }, 1200);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-5">
      {/* Chat main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bp-card flex-1 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[var(--bp-border)] flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Mensajes</h3>
              <p className="text-[11px] text-[var(--bp-text-tertiary)]">{businessAccount.assignedRepName || 'Representante LaserMachine'}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bp-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--bp-text-tertiary)]">
                <div className="w-14 h-14 rounded-2xl bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] flex items-center justify-center mb-4">
                  <MessageCircle size={28} className="opacity-40" />
                </div>
                <p className="text-sm font-medium text-[var(--bp-text-secondary)]">Inicia una conversación con tu representante</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderRole === 'BUSINESS';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-[var(--bp-accent)] text-[var(--bp-text-inverse)] rounded-br-sm' : 'bg-[var(--bp-bg-elevated)] text-[var(--bp-text-primary)] border border-[var(--bp-border)] rounded-bl-sm'}`}>
                      <p className="text-[11px] opacity-80 mb-1 font-medium">{msg.senderName}</p>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-[var(--bp-text-inverse)]/60' : 'text-[var(--bp-text-tertiary)]'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>
          <div className="p-4 border-t border-[var(--bp-border)] flex gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Escribe un mensaje..." className="bp-input" />
            <button onClick={send} disabled={!input.trim()} className="bp-btn bp-btn-primary px-4 disabled:opacity-40 disabled:cursor-not-allowed">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full md:w-72 shrink-0 space-y-4">
        {lastOrder && (
          <div className="bp-card p-4">
            <h4 className="text-xs font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide mb-3">Último pedido</h4>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg flex items-center justify-center">
                <Package size={18} className="text-[var(--bp-accent)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--bp-text-primary)] text-sm">Pedido #{lastOrder.id}</p>
                <p className="text-[11px] text-[var(--bp-text-tertiary)]">{fmtMoney(lastOrder.total)}</p>
              </div>
            </div>
            <StatusBadge status={lastOrder.status} />
          </div>
        )}

        <div className="bp-card p-4">
          <h4 className="text-xs font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide mb-3">Resumen rápido</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--bp-text-secondary)]">Pedidos totales</span>
              <span className="font-semibold text-[var(--bp-text-primary)]">{stats?.total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--bp-text-secondary)]">Total comprado</span>
              <span className="font-semibold text-[var(--bp-text-primary)]">{fmtMoney(stats?.spent || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--bp-text-secondary)]">Crédito disponible</span>
              <span className="font-semibold text-[var(--bp-text-primary)]">{fmtMoney(Math.max(0, businessAccount.creditLimit - businessAccount.creditUsed))}</span>
            </div>
          </div>
        </div>

        <div className="bp-card p-4">
          <h4 className="text-xs font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide mb-3">Acciones rápidas</h4>
          <div className="space-y-2">
            <button onClick={() => setChatMessages((prev) => [...prev, { id: `quick-${Date.now()}`, businessId: businessAccount.id, senderId: user.id, senderName: user.name, senderRole: 'BUSINESS', content: 'Hola, necesito ayuda con mi último pedido.', timestamp: new Date().toISOString(), read: true }])} className="w-full text-left px-3 py-2 rounded-lg bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] text-sm text-[var(--bp-text-secondary)] hover:text-[var(--bp-text-primary)] hover:border-[var(--bp-border-strong)] transition-colors">
              "Necesito ayuda con mi último pedido"
            </button>
            <button onClick={() => setChatMessages((prev) => [...prev, { id: `quick-${Date.now()}`, businessId: businessAccount.id, senderId: user.id, senderName: user.name, senderRole: 'BUSINESS', content: '¿Cuál es el estado de mi línea de crédito?', timestamp: new Date().toISOString(), read: true }])} className="w-full text-left px-3 py-2 rounded-lg bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] text-sm text-[var(--bp-text-secondary)] hover:text-[var(--bp-text-primary)] hover:border-[var(--bp-border-strong)] transition-colors">
              "¿Cuál es mi línea de crédito?"
            </button>
            <button onClick={() => setChatMessages((prev) => [...prev, { id: `quick-${Date.now()}`, businessId: businessAccount.id, senderId: user.id, senderName: user.name, senderRole: 'BUSINESS', content: 'Quiero cotizar un pedido masivo.', timestamp: new Date().toISOString(), read: true }])} className="w-full text-left px-3 py-2 rounded-lg bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] text-sm text-[var(--bp-text-secondary)] hover:text-[var(--bp-text-primary)] hover:border-[var(--bp-border-strong)] transition-colors">
              "Quiero cotizar un pedido masivo"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Account
// ------------------------------------------------------------------
interface AccountTabProps {
  businessAccount: BusinessAccount;
  user: User;
  auditLogs: AuditLogEntry[];
  onInviteUser: (email: string, role: 'ADMIN' | 'USER') => void;
}

const AccountTab: React.FC<AccountTabProps> = ({ businessAccount, user, auditLogs, onInviteUser }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'USER'>('USER');

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    onInviteUser(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Cuenta empresarial</h1>
          <p className="text-sm text-[var(--bp-text-tertiary)] mt-0.5">Gestiona tu empresa, usuarios y brand kit</p>
        </div>
      </div>

      <div className="bp-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-xl flex items-center justify-center">
            <Building2 size={26} className="text-[var(--bp-text-secondary)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>{businessAccount.companyName}</h2>
            <p className="text-xs text-[var(--bp-text-tertiary)]">RFC: {businessAccount.taxId}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Representante', value: businessAccount.representativeName },
            { label: 'Email', value: businessAccount.representativeEmail },
            { label: 'Teléfono', value: businessAccount.representativePhone },
            { label: 'Términos de pago', value: businessAccount.paymentTerms.replace('_', ' ') },
          ].map((item) => (
            <div key={item.label} className="bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg p-4">
              <p className="text-[11px] text-[var(--bp-text-tertiary)] font-medium uppercase tracking-wide">{item.label}</p>
              <p className="font-medium text-[var(--bp-text-primary)] text-sm mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bp-card p-6">
        <h3 className="font-semibold text-[var(--bp-text-primary)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
          <Palette size={16} className="text-[var(--bp-text-tertiary)]" /> Brand Kit
        </h3>
        {businessAccount.brandKit.logoUrl ? (
          <div className="flex items-center gap-4 mb-5">
            <img src={businessAccount.brandKit.logoUrl} alt="Logo" className="w-20 h-20 object-contain bg-[var(--bp-bg-sunken)] rounded-lg border border-[var(--bp-border)] p-2" />
            <div>
              <p className="font-medium text-[var(--bp-text-primary)] text-sm">Logo corporativo</p>
              <p className="text-[11px] text-[var(--bp-text-tertiary)]">Aprobado para producción</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--bp-text-tertiary)] mb-5">No hay logo registrado. Contacta a tu representante.</p>
        )}
        <div>
          <p className="text-[11px] text-[var(--bp-text-tertiary)] font-medium uppercase tracking-wide mb-2">Colores aprobados</p>
          <div className="flex flex-wrap gap-2">
            {businessAccount.brandKit.approvedColors?.length > 0 ? businessAccount.brandKit.approvedColors.map((c: string) => (
              <div key={c} className="flex items-center gap-2 px-3 py-2 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg">
                <div className="w-4 h-4 rounded-full border border-[var(--bp-border)]" style={{ backgroundColor: c }} />
                <span className="text-xs font-medium text-[var(--bp-text-secondary)]">{c}</span>
              </div>
            )) : <span className="text-xs text-[var(--bp-text-tertiary)]">Sin colores aprobados</span>}
          </div>
        </div>
      </div>

      <div className="bp-card p-6">
        <h3 className="font-semibold text-[var(--bp-text-primary)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
          <Users size={16} className="text-[var(--bp-text-tertiary)]" /> Usuarios autorizados
        </h3>
        <div className="space-y-2 mb-5">
          {businessAccount.users.map((u: BusinessUser) => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[var(--bp-surface)] border border-[var(--bp-border)] flex items-center justify-center text-xs font-bold text-[var(--bp-text-primary)]">
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--bp-text-primary)] text-sm truncate">{u.name}</p>
                <p className="text-[11px] text-[var(--bp-text-tertiary)] truncate">{u.email}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-1 rounded border ${u.role === 'ADMIN' ? 'bg-[var(--bp-success-bg)] text-[var(--bp-success)] border-transparent' : 'bg-[var(--bp-bg-elevated)] text-[var(--bp-text-tertiary)] border-[var(--bp-border)]'}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg p-4">
          <p className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide mb-2">Invitar usuario</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="correo@empresa.com" className="bp-input flex-1" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'USER')} className="bp-input sm:w-32">
              <option value="USER">Usuario</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button onClick={sendInvite} className="bp-btn bp-btn-primary px-4 py-2.5">
              <UserPlus size={16} /> Invitar
            </button>
          </div>
        </div>
      </div>

      {auditLogs.length > 0 && (
        <div className="bp-card p-6">
          <h3 className="font-semibold text-[var(--bp-text-primary)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
            <ShieldCheck size={16} className="text-[var(--bp-text-tertiary)]" /> Registro de actividad
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto bp-scrollbar">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[var(--bp-accent)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--bp-text-primary)]">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-[var(--bp-text-tertiary)]">{log.userName} • {new Date(log.timestamp).toLocaleString('es-MX')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Order Detail Modal
// ------------------------------------------------------------------
interface OrderDetailModalProps {
  order: Order;
  fonts: FontOption[];
  products: Product[];
  onClose: () => void;
  onChat: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, fonts, products, onClose, onChat }) => {
  const s = STATUS_META[order.status];
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="h-full overflow-y-auto bp-scrollbar">
        <div className="min-h-full p-4 flex items-start justify-center">
          <div className="bg-[var(--bp-surface)] w-full max-w-3xl rounded-2xl border border-[var(--bp-border)] p-6 relative my-4 shadow-2xl bp-animate-scale" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg hover:bg-[var(--bp-bg-sunken)] transition-colors">
              <X size={18} className="text-[var(--bp-text-tertiary)]" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Pedido #{order.id}</h2>
              <p className="text-sm text-[var(--bp-text-tertiary)] mt-1">{fmtDate(order.createdAt)} • {order.items.length} productos</p>
            </div>

            <div className="bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--bp-surface)] border border-[var(--bp-border)] rounded-lg flex items-center justify-center">
                  <s.icon size={20} className="text-[var(--bp-accent)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--bp-text-primary)]">{s.label}</p>
                  <p className="text-xs text-[var(--bp-text-tertiary)]">Estado actual del pedido</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[var(--bp-text-tertiary)] font-medium uppercase tracking-wide">Productos</p>
              {order.items.map((item, idx) => {
                const product = products.find((p) => p.id === item.productId);
                const colorImage = product?.colors.find((c) => c.name === item.colorName)?.imageUrl;
                return (
                  <div key={idx} className="border border-[var(--bp-border)] rounded-xl overflow-hidden bg-[var(--bp-bg-elevated)]">
                    <div className="px-4 py-3 border-b border-[var(--bp-border)] flex items-center justify-between">
                      <span className="font-semibold text-[var(--bp-text-primary)] text-sm">{product?.name || item.productId}</span>
                      <span className="text-xs text-[var(--bp-text-tertiary)]">{item.colorName}</span>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-4">
                      <TechnicalPreview
                        imageUrl={colorImage || product?.imageUrl}
                        text={item.frontText} text2={item.frontText2}
                        fontName={item.frontFontName}
                        fontCss={fonts.find((f) => f.id === item.frontFontId)?.cssFamily || ''}
                        logos={item.frontLogos}
                        designState={item.frontDesignState}
                        designState2={item.frontDesignState2}
                        sideLabel="FRENTE"
                      />
                      <TechnicalPreview
                        imageUrl={colorImage || product?.imageUrl}
                        text={item.backText} text2={item.backText2}
                        fontName={item.backFontName}
                        fontCss={fonts.find((f) => f.id === item.backFontId)?.cssFamily || ''}
                        logos={item.backLogos}
                        designState={item.backDesignState}
                        designState2={item.backDesignState2}
                        sideLabel="DORSO"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--bp-border)] space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--bp-text-secondary)]">Subtotal</span>
                <span className="text-[var(--bp-text-primary)] font-medium">{fmtMoney(order.total + (order.discountAmount || 0))}</span>
              </div>
              {order.discountAmount ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--bp-text-secondary)]">Descuento empresa</span>
                  <span className="text-[var(--bp-success)] font-medium">-{fmtMoney(order.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-base pt-2 border-t border-[var(--bp-border)]">
                <span className="font-semibold text-[var(--bp-text-primary)]">Total</span>
                <span className="font-bold text-[var(--bp-text-primary)]">{fmtMoney(order.total)}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--bp-border)] flex gap-3">
              <button onClick={onChat} className="bp-btn bp-btn-primary flex-1 py-3">
                Contactar representante
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

// ------------------------------------------------------------------
// Main Shell
// ------------------------------------------------------------------
export const BusinessPortal: React.FC<BusinessPortalProps> = ({
  user, businessAccount, orders, products, fonts, storeConfig, pricing, isDarkMode: propIsDarkMode, toggleTheme: propToggleTheme,
  onProductSelect, onSelectFontForCustomizer,
}) => {
  const [activeTab, setActiveTab] = useState<BusinessTab>('home');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<BusinessChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`lm_business_chat_${businessAccount.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`lm_business_favorites_${businessAccount.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`lm_business_recent_${businessAccount.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`lm_business_audit_${businessAccount.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [invoices] = useState<BusinessInvoice[]>(() => {
    return [
      { id: 'INV-001', businessId: businessAccount.id, orderId: '1001', invoiceNumber: 'A-0001', amount: 1300, paidAmount: 1300, status: 'PAID', dueDate: '2024-02-28', issuedAt: '2024-02-21', paidAt: '2024-02-22' },
      { id: 'INV-002', businessId: businessAccount.id, orderId: '1002', invoiceNumber: 'A-0002', amount: 1900, paidAmount: 0, status: 'PENDING', dueDate: '2024-03-15', issuedAt: '2024-03-01' },
    ];
  });

  const [localDarkMode, setLocalDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return document.documentElement.classList.contains('dark');
    return false;
  });

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : localDarkMode;

  const toggleTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      const next = !localDarkMode;
      setLocalDarkMode(next);
      document.documentElement.classList.toggle('dark', next);
    }
  };

  useEffect(() => {
    try { localStorage.setItem(`lm_business_chat_${businessAccount.id}`, JSON.stringify(chatMessages)); } catch {}
  }, [chatMessages, businessAccount.id]);

  useEffect(() => {
    try { localStorage.setItem(`lm_business_favorites_${businessAccount.id}`, JSON.stringify(favorites)); } catch {}
  }, [favorites, businessAccount.id]);

  useEffect(() => {
    try { localStorage.setItem(`lm_business_recent_${businessAccount.id}`, JSON.stringify(recentlyViewed.slice(0, 10))); } catch {}
  }, [recentlyViewed, businessAccount.id]);

  useEffect(() => {
    try { localStorage.setItem(`lm_business_audit_${businessAccount.id}`, JSON.stringify(auditLogs)); } catch {}
  }, [auditLogs, businessAccount.id]);

  const addAuditLog = (action: AuditLogEntry['action'], metadata?: Record<string, any>) => {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now()}`,
      businessId: businessAccount.id,
      userId: user.id,
      userName: user.name,
      action,
      timestamp: new Date().toISOString(),
      metadata,
    };
    setAuditLogs((prev) => [entry, ...prev].slice(0, 100));
  };

  const myOrders = useMemo(() => {
    return orders
      .filter((o) => o.customerEmail?.toLowerCase() === user.email?.toLowerCase() || o.customerPhone === businessAccount.representativePhone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, user.email, businessAccount.representativePhone]);

  const stats = useMemo(() => {
    const total = myOrders.length;
    const completed = myOrders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const pending = myOrders.filter((o) => o.status === OrderStatus.RECEIVED || o.status === OrderStatus.IN_PRODUCTION || o.status === OrderStatus.WAITING_APPROVAL).length;
    const spent = myOrders.filter((o) => o.status !== OrderStatus.CANCELLED).reduce((sum, o) => sum + o.total, 0);
    return { total, completed, pending, spent };
  }, [myOrders]);

  const tier = TIER_META[businessAccount.discountTier] || TIER_META.NONE;
  const creditAvailable = Math.max(0, businessAccount.creditLimit - businessAccount.creditUsed);
  const creditPercent = businessAccount.creditLimit > 0 ? (businessAccount.creditUsed / businessAccount.creditLimit) * 100 : 0;

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      addAuditLog('PROFILE_UPDATED', { type: 'favorite', productId: id, added: !prev.includes(id) });
      return next;
    });
  };

  const markViewed = (id: string) => {
    setRecentlyViewed((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)];
      return next.slice(0, 10);
    });
  };

  const onReorder = (order: Order) => {
    addAuditLog('ORDER_CREATED', { type: 'reorder', orderId: order.id });
    alert(`Reordenando pedido ${order.id} — en una implementación real, esto copiaría los items a un nuevo borrador.`);
  };

  const onInviteUser = (email: string, role: 'ADMIN' | 'USER') => {
    addAuditLog('USER_INVITED', { email, role });
    alert(`Invitación enviada a ${email} con rol ${role}`);
  };

  const handleBulkSubmit = (items: BulkOrderItem[], poNumber: string, notes: string) => {
    addAuditLog('ORDER_CREATED', { type: 'bulk', items: items.length, poNumber, total: items.reduce((s, i) => s + i.subtotal, 0) });
    alert(`Pedido masivo enviado. PO: ${poNumber || 'N/A'}. Items: ${items.length}`);
  };

  const handleSaveDraft = (draft: DraftOrder) => {
    addAuditLog('DRAFT_SAVED', { draftId: draft.id, items: draft.items.length });
  };

  const userRole = businessAccount.users.find((u) => u.email === user.email)?.role || 'USER';

  const sidebarItems: { id: BusinessTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'orders', label: 'Pedidos', icon: Package },
    { id: 'bulk', label: 'Pedido masivo', icon: ShoppingBag },
    { id: 'catalog', label: 'Catálogo', icon: Grid3X3 },
    { id: 'fonts', label: 'Fuentes', icon: Type },
    { id: 'chat', label: 'Mensajes', icon: MessageCircle, badge: 0 },
    { id: 'account', label: 'Cuenta', icon: Building2 },
  ];

  const visibleTabs = sidebarItems.filter((item) => {
    if (userRole === 'ADMIN') return true;
    return ['home', 'orders', 'bulk', 'catalog', 'fonts', 'chat', 'account'].includes(item.id);
  });

  return (
    <div className={`business-portal min-h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      <AtmosphereBackground />

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-20 lg:w-56 flex-col shrink-0 h-screen sticky top-0 z-30 relative"
        style={{
          background: 'color-mix(in srgb, var(--bp-bg) 75%, transparent)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid var(--bp-border)',
        }}
      >
        <div className="h-16 flex items-center px-5 border-b border-[var(--bp-border)]">
          <div className="w-8 h-8 bg-[var(--bp-accent)] rounded-lg flex items-center justify-center shadow-sm">
            <Building2 size={18} className="text-[var(--bp-text-inverse)]" />
          </div>
          <span className="hidden lg:block ml-3 font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Portal Empresarial</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {visibleTabs.map((item) => (
            <SidebarItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              badge={item.badge}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--bp-border)]">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--bp-text-secondary)] hover:text-[var(--bp-text-primary)] hover:bg-[var(--bp-bg-elevated)] transition-colors"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="hidden lg:block">{isDarkMode ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <div className="mt-3 flex items-center gap-3 px-3">
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-[var(--bp-border)] bg-[var(--bp-bg-elevated)]" />
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-medium text-[var(--bp-text-primary)] truncate">{user.name}</p>
              <p className="text-[10px] text-[var(--bp-text-tertiary)] truncate">{businessAccount.companyName}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{
          background: 'color-mix(in srgb, var(--bp-bg) 80%, transparent)',
          backdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: '1px solid var(--bp-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--bp-accent)] rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-[var(--bp-text-inverse)]" />
          </div>
          <span className="font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Portal Empresarial</span>
        </div>
        <button onClick={toggleTheme} className="p-2 text-[var(--bp-text-secondary)]">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-around px-1"
        style={{
          background: 'color-mix(in srgb, var(--bp-bg) 90%, transparent)',
          backdropFilter: 'blur(16px) saturate(180%)',
          borderTop: '1px solid var(--bp-border)',
        }}
      >
        {visibleTabs.slice(0, 5).map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full ${active ? 'text-[var(--bp-accent)]' : 'text-[var(--bp-text-tertiary)]'}`}
            >
              <item.icon size={20} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-16 md:pb-0 relative">
        <div className="h-full overflow-y-auto bp-scrollbar">
          <div className="max-w-6xl mx-auto p-5 lg:p-8">
            <div key={activeTab} className="bp-tab-content">
              {activeTab === 'home' && (
                <HomeTab
                  stats={stats}
                  tier={tier}
                  businessAccount={businessAccount}
                  myOrders={myOrders}
                  setSelectedOrder={setSelectedOrder}
                  setActiveTab={setActiveTab}
                  creditAvailable={creditAvailable}
                  creditPercent={creditPercent}
                />
              )}
              {activeTab === 'orders' && <OrdersTab myOrders={myOrders} setSelectedOrder={setSelectedOrder} onReorder={onReorder} />}
              {activeTab === 'bulk' && (
                <BulkOrderConfigurator
                  businessAccount={businessAccount}
                  user={user}
                  products={products}
                  discountPercent={tier.percent}
                  pricing={pricing}
                  onSubmit={handleBulkSubmit}
                  onSaveDraft={handleSaveDraft}
                />
              )}
              {activeTab === 'catalog' && (
                <CatalogTab
                  products={products}
                  tier={tier}
                  onProductSelect={onProductSelect}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  recentlyViewed={recentlyViewed}
                  markViewed={markViewed}
                />
              )}
              {activeTab === 'fonts' && <FontsTab fonts={fonts} businessAccount={businessAccount} onSelectFontForCustomizer={onSelectFontForCustomizer} />}
              {activeTab === 'chat' && <ChatTab businessAccount={businessAccount} user={user} chatMessages={chatMessages} setChatMessages={setChatMessages} lastOrder={myOrders[0]} stats={{ total: stats.total, spent: stats.spent }} />
              {activeTab === 'account' && <AccountTab businessAccount={businessAccount} user={user} auditLogs={auditLogs} onInviteUser={onInviteUser} />}
            </div>
          </div>
        </div>
      </main>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          fonts={fonts}
          products={products}
          onClose={() => setSelectedOrder(null)}
          onChat={() => { setSelectedOrder(null); setActiveTab('chat'); }}
        />
      )}
    </div>
  );
};

export default BusinessPortal;

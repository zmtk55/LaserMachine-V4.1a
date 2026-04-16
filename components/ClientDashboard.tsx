import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, User, OrderStatus, Product, FontOption, Coupon } from '../types';
import {
  Package, Clock, Search, Percent, Phone, MapPin,
  ChevronRight, Star, Copy, CheckCircle2, Truck,
  Sparkles, Zap, Calendar, MessageCircle, Home, Grid3X3,
  Type, ChevronDown, ExternalLink, RefreshCcw, X,
  AlertTriangle, CheckCircle, Clock4, PackageCheck,
  Gift, TrendingUp, Bell, Sun, Moon, Ticket, Wallet,
  History, Award, ArrowUpRight, MinusCircle, PlusCircle,
  ArrowRight, ShoppingBag, Heart
} from 'lucide-react';
import { TechnicalPreview } from './TechnicalPreview';
import { useLaserPoints } from '../hooks/useLaserPoints';
import { useMockupNotifications } from '../hooks/useMockupNotifications';
import { formatPoints, formatPointsValue } from '../services/pointsService';
import { MockupApprovalModal } from './client/MockupApprovalModal';
import { requiresMockupApproval } from '../services/mockupApprovalService';
import { StatusBadge, OrderTimeline, EmptyState, BottomNav, getStatusConfig } from './client/dashboard';

interface ClientDashboardProps {
  user: User;
  orders: Order[];
  products: Product[];
  fonts: FontOption[];
  coupons?: Coupon[];
  onReorder?: (order: Order) => void;
  onApproveMockup?: (orderId: string, approved: boolean) => void;
  contentConfig?: ContentConfig;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  onBackToAdmin?: () => void;
  onProductSelect?: (product: Product) => void;
  onSelectFontForCustomizer?: (fontId: number, text: string) => void;
}

interface ContentConfig {
  banners: Banner[];
  promotions: Promotion[];
}

interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  image: string;
  validUntil: string;
  code?: string;
  active: boolean;
}

type TabType = 'home' | 'orders' | 'fonts' | 'catalog' | 'coupons';

const DEFAULT_BANNERS: Banner[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=400&fit=crop',
    title: 'Personalización Premium',
    subtitle: 'Grabados láser de alta calidad',
    active: true
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=400&fit=crop',
    title: 'Nueva Colección',
    subtitle: 'Descubre los nuevos modelos',
    active: true
  }
];

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: '1',
    title: '2x1 en Grabados',
    description: 'Compra un termo y el segundo grabado es GRATIS',
    discount: '50% OFF',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    validUntil: '2026-03-15',
    code: 'GRABADO2X1',
    active: true
  }
];

function readClientContentFromStorage(): ContentConfig | undefined {
  try {
    const raw = localStorage.getItem('lm_content_config');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as ContentConfig;
    if (parsed && (Array.isArray(parsed.banners) || Array.isArray(parsed.promotions))) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user, orders, products, fonts, coupons = [], onReorder, onApproveMockup,
  contentConfig, isDarkMode: propIsDarkMode, toggleTheme: propToggleTheme,
  onBackToAdmin, onProductSelect, onSelectFontForCustomizer
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [storedContentConfig, setStoredContentConfig] = useState<ContentConfig | undefined>(() =>
    readClientContentFromStorage()
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deliveredSectionOpen, setDeliveredSectionOpen] = useState(false);
  const [showCopied, setShowCopied] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [mockupOrder, setMockupOrder] = useState<Order | null>(null);

  const userId = user.email || user.phone || 'guest';
  const {
    totalPoints,
    pointsValue,
    formattedPoints,
    recentTransactions,
    pointsSummary,
    processOrder
  } = useLaserPoints(userId);

  const {
    pendingApprovals,
    hasPendingApprovals
  } = useMockupNotifications(orders, userId);

  const processedOrderIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const completedOrders = orders.filter(o =>
      o.status === OrderStatus.COMPLETED &&
      !processedOrderIds.current.has(o.id) &&
      !pointsSummary?.recentTransactions.some(t => t.orderId === o.id)
    );

    completedOrders.forEach(order => {
      processedOrderIds.current.add(order.id);
      processOrder(order);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const [localDarkMode, setLocalDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : localDarkMode;

  const toggleLocalTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      const newMode = !localDarkMode;
      setLocalDarkMode(newMode);
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    const refresh = () => setStoredContentConfig(readClientContentFromStorage());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lm_content_config' || e.key === null) refresh();
    };
    window.addEventListener('lm-content-config-updated', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('lm-content-config-updated', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const mergedContent = contentConfig ?? storedContentConfig;
  const activeBanners = mergedContent?.banners?.filter(b => b.active) ?? [];
  const activePromos = mergedContent?.promotions?.filter(p => p.active) ?? [];
  const banners = activeBanners.length > 0 ? activeBanners : DEFAULT_BANNERS.filter(b => b.active);
  const promotions = activePromos.length > 0 ? activePromos : DEFAULT_PROMOTIONS.filter(p => p.active);

  const myOrders = useMemo(() => {
    const filtered = user.isGuest
      ? orders.filter(o => o.customerPhone === user.phone)
      : orders.filter(o => o.customerEmail?.toLowerCase() === user.email?.toLowerCase());

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, user]);

  const stats = useMemo(() => {
    const totalOrders = myOrders.length;
    const completedOrders = myOrders.filter(o => o.status === OrderStatus.COMPLETED).length;
    const pendingOrders = myOrders.filter(o =>
      o.status === OrderStatus.RECEIVED ||
      o.status === OrderStatus.IN_PRODUCTION ||
      o.status === OrderStatus.WAITING_APPROVAL
    ).length;
    return { totalOrders, completedOrders, pendingOrders };
  }, [myOrders]);

  const activeOrdersList = useMemo(
    () => myOrders.filter((o) => o.status !== OrderStatus.COMPLETED),
    [myOrders]
  );
  const completedOrdersList = useMemo(
    () => myOrders.filter((o) => o.status === OrderStatus.COMPLETED),
    [myOrders]
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setShowCopied(code);
    setTimeout(() => setShowCopied(null), 2000);
  };

  const openWhatsApp = (message: string) => {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/5210000000000?text=${text}`, '_blank');
  };

  const activeCouponsCount = useMemo(() => {
    return coupons.filter(c =>
      c.active &&
      (!c.expiryDate || new Date(c.expiryDate) > new Date()) &&
      (c.maxUses === -1 || (c.usedCount || 0) < c.maxUses)
    ).length;
  }, [coupons]);

  // ============================================
  // HOME TAB
  // ============================================
  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-6 text-white shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-[60px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <img
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=facc15&color=000000&size=128`}
                alt={user.name}
                className="w-16 h-16 rounded-2xl border-2 border-amber-400 object-cover shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Bienvenido de vuelta</p>
              <h2 className="font-bold text-xl">¡Hola, {user.name.split(' ')[0]}!</h2>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border border-amber-500/30 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400/90 mb-1 flex items-center gap-1.5 font-medium">
                  <Award size={14} />
                  Tus puntos acumulados
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-amber-400 tracking-tight">{formattedPoints}</span>
                  <span className="text-sm text-amber-400/80 font-medium">pts</span>
                </div>
                <p className="text-xs text-white/60 mt-1.5">
                  Equivalente a <span className="text-white font-semibold">{pointsValue}</span> de descuento
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Star size={28} className="text-black" />
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setActiveTab('coupons')}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Wallet size={14} /> Canjear
              </button>
              <button
                onClick={() => document.getElementById('points-history')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <History size={14} /> Historial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Package, value: stats.totalOrders, label: 'Pedidos', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: CheckCircle2, value: stats.completedOrders, label: 'Completados', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Clock4, value: stats.pendingOrders, label: 'En proceso', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group bg-white dark:bg-zinc-900/80 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 text-center transition-all hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-95"
            onClick={() => setActiveTab('orders')}
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] text-zinc-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Banners Carousel */}
      {banners.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
              <Bell size={16} className="text-amber-500" />
              Novedades
            </h3>
            <span className="text-xs text-zinc-400">{banners.length} destacados</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-hide -mx-4 px-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="flex-shrink-0 w-[300px] snap-start"
              >
                <div className="relative h-40 rounded-2xl overflow-hidden shadow-lg group cursor-pointer">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="font-bold text-white text-lg">{banner.title}</h4>
                    {banner.subtitle && (
                      <p className="text-xs text-zinc-300">{banner.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Preview */}
      {myOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Pedidos recientes</h3>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {myOrders.slice(0, 2).map((order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="group bg-white dark:bg-zinc-900/80 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${status.bg} ${status.border} border rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <StatusIcon size={18} className={status.text} />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-zinc-900 dark:text-white block">Pedido #{order.id.slice(-6)}</span>
                        <span className="text-[10px] text-zinc-500">{formatShortDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <StatusBadge status={order.status} size="sm" showIcon={false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <Package size={14} className="text-zinc-400" />
                      <span>{order.items.length} producto{order.items.length > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
            <Percent size={16} className="text-amber-500" />
            Promociones activas
          </h3>
          {promotions.slice(0, 2).map((promo) => (
            <div
              key={promo.id}
              className="group bg-white dark:bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="flex">
                <div className="w-28 h-28 flex-shrink-0 overflow-hidden">
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{promo.title}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-1">{promo.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xl font-black text-amber-500">{promo.discount}</span>
                    {promo.code && (
                      <button
                        onClick={() => copyCode(promo.code!)}
                        className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors active:scale-95"
                      >
                        {showCopied === promo.code ? (
                          <><CheckCircle2 size={12} className="text-emerald-500" /> Copiado</>
                        ) : (
                          <><Copy size={12} /> {promo.code}</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Points History */}
      {recentTransactions.length > 0 && (
        <div id="points-history" className="space-y-3">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
            <History size={16} className="text-amber-500" />
            Historial de Puntos
          </h3>
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {recentTransactions.slice(0, 5).map((transaction, index) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 ${
                  index !== recentTransactions.slice(0, 5).length - 1
                    ? 'border-b border-zinc-100 dark:border-zinc-800'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    transaction.points > 0
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.points > 0 ? <PlusCircle size={20} /> : <MinusCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{transaction.description}</p>
                    <p className="text-xs text-zinc-500">{formatShortDate(transaction.createdAt)}</p>
                  </div>
                </div>
                <span className={`font-bold ${
                  transaction.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.points > 0 ? '+' : ''}{formatPoints(transaction.points)}
                </span>
              </div>
            ))}
          </div>
          {recentTransactions.length > 5 && (
            <button className="w-full text-center text-xs text-amber-600 dark:text-amber-400 font-bold py-2 hover:underline">
              Ver historial completo →
            </button>
          )}
        </div>
      )}

      {/* Support CTA */}
      <button
        onClick={() => openWhatsApp(`Hola LaserMachine, soy ${user.name} y tengo una pregunta sobre mi pedido.`)}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
      >
        <MessageCircle size={20} />
        Chatear con nosotros
      </button>
    </div>
  );

  // ============================================
  // ORDERS TAB
  // ============================================
  const renderOrders = () => {
    const renderOrderCard = (order: Order) => {
      const status = getStatusConfig(order.status);
      const StatusIcon = status.icon;
      const isExpanded = expandedOrder === order.id;
      const needsApproval = order.status === OrderStatus.WAITING_APPROVAL && requiresMockupApproval(order);

      return (
              <div
                key={order.id}
                className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                {/* Order Header */}
                <div
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 ${status.bg} ${status.border} border rounded-xl flex items-center justify-center transition-transform`}>
                        <StatusIcon size={20} className={status.text} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-sm">
                          Pedido #{order.id.slice(-6)}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {formatDate(order.createdAt)} • {order.items.length} producto{order.items.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(order.total)}</span>
                      <ChevronDown
                        size={18}
                        className={`text-zinc-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge status={order.status} size="sm" pulse={needsApproval} />
                    <OrderTimeline currentStatus={order.status} compact />
                  </div>

                  {order.estimatedDeliveryDate && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/50 px-3 py-2 rounded-lg w-fit">
                      <Truck size={14} className="text-zinc-400" />
                      <span>Entrega estimada: <span className="font-medium text-zinc-900 dark:text-white">{formatDate(order.estimatedDeliveryDate)}</span></span>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-5">
                    {/* Timeline */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Estado del pedido</p>
                      <OrderTimeline currentStatus={order.status} />
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Productos</p>
                      {order.items.map((item, itemIdx) => {
                        const product = products.find(p => p.id === item.productId);
                        const productImage = product?.colors.find(c => c.name === item.colorName)?.imageUrl || product?.imageUrl;

                        return (
                          <div key={itemIdx} className="flex gap-3 bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0">
                              {productImage ? (
                                <img src={productImage} alt={item.productId} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={20} className="text-zinc-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                {product?.name || item.productId}
                              </p>
                              <p className="text-xs text-zinc-500">{item.colorName} • Cantidad: {item.quantity}</p>
                              <p className="text-xs font-medium text-zinc-900 dark:text-white mt-1">
                                {formatCurrency(item.unitPrice)} c/u
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {needsApproval && (
                        <button
                          onClick={() => setMockupOrder(order)}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95 animate-pulse"
                        >
                          <Sparkles size={14} />
                          Aprobar diseño
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <ExternalLink size={14} />
                        Ver detalles
                      </button>
                      <button
                        onClick={() => openWhatsApp(`Hola, tengo una pregunta sobre mi pedido #${order.id.slice(-6)}`)}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        <MessageCircle size={14} />
                        Consultar
                      </button>
                    </div>
                  </div>
                )}
              </div>
      );
    };

    return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white">Mis Pedidos</h2>
          <p className="text-xs text-zinc-500">{myOrders.length} pedido{myOrders.length !== 1 ? 's' : ''} en total</p>
        </div>
        {stats.pendingOrders > 0 && (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">
            {stats.pendingOrders} activo{stats.pendingOrders > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {myOrders.length === 0 ? (
        <EmptyState
          type="orders"
          action={
            <button
              onClick={() => setActiveTab('catalog')}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-sm font-bold transition-colors"
            >
              Explorar catálogo
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {activeOrdersList.map(renderOrderCard)}
          {completedOrdersList.length > 0 && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDeliveredSectionOpen((v) => !v)}
                aria-expanded={deliveredSectionOpen}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
              >
                <span className="text-sm font-black uppercase text-zinc-700 dark:text-zinc-300">
                  Pedidos entregados <span className="font-bold text-zinc-500">({completedOrdersList.length})</span>
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-zinc-400 transition-transform duration-300 ${deliveredSectionOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {deliveredSectionOpen && (
                <div className="mt-4 space-y-4">
                  {completedOrdersList.map(renderOrderCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    );
  };

  // ============================================
  // CATALOG TAB
  // ============================================
  const renderCatalog = () => {
    const activeProducts = products.filter(p => p.isActive !== false);
    
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white">Catálogo</h2>
          <p className="text-xs text-zinc-500">{activeProducts.length} productos disponibles</p>
        </div>
        
        {activeProducts.length === 0 ? (
          <EmptyState type="catalog" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {activeProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white dark:bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={32} className="text-zinc-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => onProductSelect?.(product)}
                      className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 active:scale-95"
                    >
                      <ShoppingBag size={14} />
                      Personalizar
                    </button>
                  </div>
                  <button className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Heart size={14} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">{product.brand}</p>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate mt-0.5">{product.name}</h3>
                  <p className="text-base font-black text-amber-500 mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // COUPONS TAB
  // ============================================
  const renderCoupons = () => {
    const activeCoupons = coupons.filter(c =>
      (!c.expiryDate || new Date(c.expiryDate) > new Date()) &&
      (c.maxUses === -1 || (c.usedCount || 0) < c.maxUses)
    );

    const expiredCoupons = coupons.filter(c =>
      c.expiryDate && new Date(c.expiryDate) <= new Date()
    );

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white">Mis Cupones</h2>
          <p className="text-xs text-zinc-500">{activeCoupons.length} cupones disponibles</p>
        </div>

        {activeCoupons.length === 0 ? (
          <EmptyState type="coupons" />
        ) : (
          <div className="space-y-4">
            {activeCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-white dark:bg-zinc-900/80 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden transition-all hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-50 dark:bg-black rounded-full" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-50 dark:bg-black rounded-full" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full border-t-2 border-dashed border-zinc-200 dark:border-zinc-700" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Ticket size={24} className="text-amber-500" />
                        <span className="text-3xl font-black text-amber-500">{coupon.discountPercent}%</span>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">OFF</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {coupon.assignedToPhone ? 'Cupón personalizado' : 'Cupón global'}
                      </p>
                    </div>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {showCopied === coupon.code ? (
                        <><CheckCircle2 size={14} /> Copiado</>
                      ) : (
                        <><Copy size={14} /> Copiar</>
                      )}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <code className="inline-block bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg font-mono text-lg font-bold text-zinc-900 dark:text-white tracking-wider">
                      {coupon.code}
                    </code>
                  </div>

                  {coupon.expiryDate && (
                    <p className="text-xs text-zinc-400 mt-3 flex items-center gap-1.5">
                      <Calendar size={12} />
                      Válido hasta: {formatDate(coupon.expiryDate)}
                    </p>
                  )}

                  {coupon.maxUses > 0 && (
                    <p className="text-xs text-zinc-400 mt-1">
                      Usos: {coupon.usedCount || 0} / {coupon.maxUses}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {expiredCoupons.length > 0 && (
          <div className="mt-8">
            <p className="text-sm text-zinc-500 mb-3 font-medium">Cupones expirados</p>
            <div className="space-y-2">
              {expiredCoupons.slice(0, 3).map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket size={16} className="text-zinc-400" />
                      <span className="font-mono text-zinc-500">{coupon.code}</span>
                    </div>
                    <span className="text-xs text-zinc-400">Expirado</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // FONTS TAB
  // ============================================
  const renderFonts = () => {
    const activeFonts = fonts.filter(f => f.isActive !== false);
    const filteredFonts = activeFonts.filter(f =>
      f.name.toLowerCase().includes(fontSearchQuery.toLowerCase()) ||
      f.category?.toLowerCase().includes(fontSearchQuery.toLowerCase())
    );

    const displayText = previewText || 'Tu Nombre';

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
            Fuentes disponibles
          </h2>
          <p className="text-zinc-500 text-sm">
            Escribe tu nombre para ver cómo se ve en cada fuente
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-zinc-900/80 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="relative">
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Escribe tu nombre aquí..."
              maxLength={20}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 py-4 pl-14 pr-4 rounded-xl text-xl font-medium text-zinc-900 dark:text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-zinc-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <span className="text-sm text-zinc-500 whitespace-nowrap font-medium w-12">{fontSize}px</span>
              <input
                type="range"
                min={20}
                max={64}
                step={4}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                value={fontSearchQuery}
                onChange={(e) => setFontSearchQuery(e.target.value)}
                placeholder="Buscar fuente..."
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 py-2.5 pl-10 pr-4 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-zinc-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Fonts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFonts.map((font) => {
            const isSelected = selectedFontId === String(font.id);
            const isPopular = [999, 101, 201].includes(Number(font.id));
            const isNew = [205, 110].includes(Number(font.id));

            return (
              <button
                key={font.id}
                onClick={() => setSelectedFontId(String(font.id))}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-amber-500/50 hover:shadow-md'
                }`}
              >
                <div className="absolute top-3 right-3 flex gap-1">
                  {isPopular && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      POPULAR
                    </span>
                  )}
                  {isNew && (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      NUEVA
                    </span>
                  )}
                </div>

                <div
                  className={`mb-4 truncate ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-200'}`}
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
                >
                  <span className={font.cssFamily}>
                    {displayText}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mb-0.5">
                      #{font.id}
                    </p>
                    <p className={`font-semibold text-sm ${font.cssFamily}`}>
                      {font.name}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {font.category}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-6 h-6 text-amber-500" />
                  )}
                </div>

                {isSelected && onSelectFontForCustomizer && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFontForCustomizer(font.id, displayText);
                      }}
                      className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <ArrowRight size={18} />
                      <span>Usar esta fuente</span>
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredFonts.length === 0 && (
          <EmptyState
            type="fonts"
            title={fontSearchQuery ? 'No se encontraron fuentes' : undefined}
            description={fontSearchQuery ? 'Intenta con otra búsqueda' : undefined}
          />
        )}
      </div>
    );
  };

  // ============================================
  // ORDER DETAILS MODAL
  // ============================================
  if (selectedOrder) {
    const s = getStatusConfig(selectedOrder.status);
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="h-full overflow-y-auto">
          <div className="min-h-full p-4 flex items-start justify-center">
            <div 
              className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 relative my-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors active:scale-95"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                  Pedido #{selectedOrder.id.slice(-6)}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {formatDate(selectedOrder.createdAt)} • {selectedOrder.items.length} producto{selectedOrder.items.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* Status Banner */}
              <div className={`${s.bg} ${s.border} border rounded-2xl p-4 mb-6`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center`}>
                    <s.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <p className={`font-bold ${s.text}`}>{s.label}</p>
                    <p className="text-xs text-zinc-500">{s.description}</p>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="mb-6">
                <OrderTimeline currentStatus={selectedOrder.status} />
              </div>

              {/* Items with previews */}
              <div className="space-y-5">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Detalles del pedido</p>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                        {products.find(p => p.id === item.productId)?.name || item.productId}
                      </h4>
                      <span className="text-xs text-zinc-500">{item.colorName}</span>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-4">
                      <TechnicalPreview
                        imageUrl={products.find(p => p.id === item.productId)?.colors.find(c => c.name === item.colorName)?.imageUrl || products.find(p => p.id === item.productId)?.imageUrl}
                        text={item.frontText} text2={item.frontText2}
                        fontName={item.frontFontName}
                        fontCss={fonts.find(f => f.id === item.frontFontId)?.cssFamily || ''}
                        logos={item.frontLogos}
                        designState={item.frontDesignState}
                        designState2={item.frontDesignState2}
                        sideLabel="FRENTE"
                      />
                      <TechnicalPreview
                        imageUrl={products.find(p => p.id === item.productId)?.colors.find(c => c.name === item.colorName)?.imageUrl || products.find(p => p.id === item.productId)?.imageUrl}
                        text={item.backText} text2={item.backText2}
                        fontName={item.backFontName}
                        fontCss={fonts.find(f => f.id === item.backFontId)?.cssFamily || ''}
                        logos={item.backLogos}
                        designState={item.backDesignState}
                        designState2={item.backDesignState2}
                        sideLabel="DORSO"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="text-zinc-900 dark:text-white font-medium">
                    {formatCurrency(selectedOrder.total + (selectedOrder.discountAmount || 0) + (selectedOrder.pointsRedeemed || 0))}
                  </span>
                </div>
                {selectedOrder.discountAmount ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Descuento</span>
                    <span className="text-emerald-600 font-medium">-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                ) : null}
                {selectedOrder.pointsRedeemed ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Puntos canjeados</span>
                    <span className="text-amber-600 font-medium">-{formatCurrency(selectedOrder.pointsRedeemed)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-lg pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="font-bold text-zinc-900 dark:text-white">Total</span>
                  <span className="font-black text-zinc-900 dark:text-white">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
                <button
                  onClick={() => openWhatsApp(`Hola, tengo una pregunta sobre mi pedido #${selectedOrder.id.slice(-6)}`)}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  <MessageCircle size={18} />
                  Contactar soporte
                </button>
                {selectedOrder.status === OrderStatus.COMPLETED && (
                  <button
                    onClick={() => onReorder?.(selectedOrder)}
                    className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    <RefreshCcw size={18} />
                    Reordenar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Backdrop click to close */}
        <div className="absolute inset-0 -z-10" onClick={() => setSelectedOrder(null)} />
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-lg font-black text-black">LM</span>
              </div>
              <div>
                <h1 className="font-black text-lg text-zinc-900 dark:text-white">LaserMachine</h1>
                <p className="text-[10px] text-zinc-500 font-medium">Panel de cliente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onBackToAdmin && (
                <button
                  onClick={onBackToAdmin}
                  className="hidden sm:flex px-3 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  ← Volver a admin
                </button>
              )}
              <button
                onClick={toggleLocalTheme}
                className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors active:scale-95"
                title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
                aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Pending Approvals Alert Banner */}
      {hasPendingApprovals && (
        <div className="fixed top-[73px] left-0 right-0 z-30 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="font-bold text-sm">
                {pendingApprovals.length} pedido{pendingApprovals.length > 1 ? 's' : ''} esperando aprobación de diseño
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('orders');
                const firstPending = pendingApprovals[0];
                if (firstPending) {
                  setExpandedOrder(firstPending.id);
                }
              }}
              className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
            >
              Ver ahora →
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className={`max-w-5xl mx-auto px-4 py-6 ${hasPendingApprovals ? 'pt-14' : ''}`}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'catalog' && renderCatalog()}
        {activeTab === 'coupons' && renderCoupons()}
        {activeTab === 'fonts' && renderFonts()}
      </main>

      {/* Mockup Approval Modal */}
      {mockupOrder && (
        <MockupApprovalModal
          order={mockupOrder}
          products={products}
          fonts={fonts}
          whatsappNumber="5210000000000"
          onClose={() => setMockupOrder(null)}
          onApproved={() => {
            onApproveMockup?.(mockupOrder.id, true);
          }}
          onRejected={(reason) => {
            onApproveMockup?.(mockupOrder.id, false);
            console.log('Rejection reason:', reason);
          }}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingOrdersCount={stats.pendingOrders}
        activeCouponsCount={activeCouponsCount}
      />
    </div>
  );
};

export default ClientDashboard;

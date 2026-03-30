
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, User, OrderStatus, Product, FontOption, Coupon } from '../types';
import { 
  Package, Clock, Search, Percent, Phone, MapPin, 
  ChevronRight, Star, Copy, CheckCircle2, Truck,
  Sparkles, Zap, Calendar, MessageCircle, Home, Grid3X3,
  Type, ChevronDown, ExternalLink, RefreshCcw, X,
  AlertTriangle, CheckCircle, Clock4, PackageCheck,
  Gift, TrendingUp, Bell, Sun, Moon, Ticket, Wallet,
  History, Award, ArrowUpRight, MinusCircle, PlusCircle
} from 'lucide-react';
import { TechnicalPreview } from './TechnicalPreview';
import { Button, Card, Tooltip } from './ui';
import { useLaserPoints } from '../hooks/useLaserPoints';
import { useMockupNotifications } from '../hooks/useMockupNotifications';
import { formatPoints, formatPointsValue, calculatePotentialPoints } from '../services/pointsService';
import { MockupApprovalModal } from './client/MockupApprovalModal';
import { requiresMockupApproval } from '../services/mockupApprovalService';
// Removed unused FontShowcase import

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

// Default content - will be replaced by admin configuration
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

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  user, orders, products, fonts, coupons = [], onReorder, onApproveMockup,
  contentConfig, isDarkMode: propIsDarkMode, toggleTheme: propToggleTheme 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState<string | null>(null);
  // State for previewing font text in the Fonts tab
  const [previewText, setPreviewText] = useState('');
  // State for mockup approval modal
  const [mockupOrder, setMockupOrder] = useState<Order | null>(null);
  
  // Points system
  const userId = user.email || user.phone || 'guest';
  const {
    totalPoints,
    pointsValue,
    formattedPoints,
    recentTransactions,
    pointsSummary,
    processOrder
  } = useLaserPoints(userId);
  
  // Mockup notifications
  const { 
    permission: notificationPermission, 
    requestPermission: requestNotificationPermission,
    pendingApprovals,
    hasPendingApprovals 
  } = useMockupNotifications(orders, userId);
  
  // Process completed orders for points - FIXED: prevent infinite loop
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
  }, [orders]); // Only depend on orders, not processOrder or pointsSummary
  
  // Theme - use props if provided, otherwise local state
  const [localDarkMode, setLocalDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Load custom fonts from FontOption.fileData (Base64) to enable preview in the Fonts tab
  useEffect(() => {
    // Remove any previously injected custom font styles
    const existing = document.getElementById('client-dashboard-custom-fonts');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'client-dashboard-custom-fonts';
    let css = '';
    fonts.forEach(font => {
      if (font.fileData && font.cssFamily) {
        const dataUrl = font.fileData.startsWith('data:') ? font.fileData : `data:font/truetype;base64,${font.fileData}`;
        css += `@font-face {
          font-family: '${font.cssFamily}';
          src: url('${dataUrl}') format('truetype');
          font-weight: normal;
          font-style: normal;
        }\n`;
      }
    });
    if (css) {
      style.textContent = css;
      document.head.appendChild(style);
    }
  }, [fonts]);

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : localDarkMode;
  
  const toggleTheme = () => {
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

  // Get active content from config or defaults
  const banners = contentConfig?.banners?.filter(b => b.active) || DEFAULT_BANNERS.filter(b => b.active);
  const promotions = contentConfig?.promotions?.filter(p => p.active) || DEFAULT_PROMOTIONS.filter(p => p.active);

  // Filter user orders
  const myOrders = useMemo(() => {
    const filtered = user.isGuest 
      ? orders.filter(o => o.customerPhone === user.phone)
      : orders.filter(o => o.customerEmail?.toLowerCase() === user.email?.toLowerCase());
    
    return filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  const getStatusConfig = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.COMPLETED: 
        return { 
          color: 'bg-green-500', 
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800',
          icon: CheckCircle,
          label: 'Entregado',
          description: 'Tu pedido fue entregado exitosamente'
        };
      case OrderStatus.READY: 
        return { 
          color: 'bg-blue-500', 
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-400', 
          border: 'border-blue-200 dark:border-blue-800',
          icon: PackageCheck,
          label: 'Listo para entrega',
          description: 'Puedes pasar a recoger tu pedido'
        };
      case OrderStatus.IN_PRODUCTION: 
        return { 
          color: 'bg-amber-500', 
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800',
          icon: Zap,
          label: 'En producción',
          description: 'Estamos personalizando tu producto'
        };
      case OrderStatus.WAITING_APPROVAL: 
        return { 
          color: 'bg-purple-500', 
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          text: 'text-purple-700 dark:text-purple-400',
          border: 'border-purple-200 dark:border-purple-800',
          icon: Sparkles,
          label: 'Esperando tu aprobación',
          description: 'Revisa y aprueba el diseño'
        };
      default: 
        return { 
          color: 'bg-zinc-500', 
          bg: 'bg-zinc-50 dark:bg-zinc-800',
          text: 'text-zinc-700 dark:text-zinc-400',
          border: 'border-zinc-200 dark:border-zinc-700',
          icon: Clock4,
          label: 'Recibido',
          description: 'Tu pedido está en cola'
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
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

  // Render bottom navigation
  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 z-50 safe-area-pb">
      <div className="max-w-5xl mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'home', label: 'Inicio', icon: Home },
            { id: 'orders', label: 'Pedidos', icon: Package, badge: stats.pendingOrders },
            { id: 'catalog', label: 'Catálogo', icon: Grid3X3 },
            { id: 'fonts', label: 'Fuentes', icon: Type },
            { id: 'coupons', label: 'Cupones', icon: Ticket, badge: coupons.filter(c => c.active && (!c.expiryDate || new Date(c.expiryDate) > new Date())).length },
          ].map((item) => (
            <Button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              variant="ghost"
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'text-yellow-500'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  // HOME TAB
  const renderHome = () => (
    <Card className="space-y-6 p-6 bg-white dark:bg-zinc-950 rounded-2xl">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-black rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-[60px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=facc15&color=000000`}
              alt={user.name}
              className="w-14 h-14 rounded-2xl border-2 border-yellow-400"
            />
            <div>
              <h2 className="font-bold text-lg">¡Hola, {user.name.split(' ')[0]}!</h2>
              <p className="text-xs text-zinc-400">Bienvenido a LaserMachine</p>
            </div>
          </div>
          
          {/* Enhanced Points Card */}
          <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent backdrop-blur rounded-2xl p-4 mt-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-400/80 mb-1 flex items-center gap-1">
                  <Award size={12} /> Tus puntos acumulados
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-yellow-400">{formattedPoints}</span>
                  <span className="text-sm text-yellow-400/80">pts</span>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  = {pointsValue} de descuento
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Star size={24} className="text-black" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => setActiveTab('coupons')}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Wallet size={14} /> Canjear
              </button>
              <button 
                onClick={() => document.getElementById('points-history')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <History size={14} /> Historial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banners Carousel */}
      {banners.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Bell size={16} className="text-yellow-500" />
            Novedades
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {banners.map((banner) => (
              <div 
                key={banner.id}
                className="flex-shrink-0 w-[280px] snap-start"
              >
                <div className="relative h-36 rounded-2xl overflow-hidden">
                  <img 
                    src={banner.image} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="font-bold text-white">{banner.title}</h4>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 text-center">
          <Package size={20} className="mx-auto text-blue-500 mb-2" />
          <p className="text-xl font-black text-zinc-900 dark:text-white">{stats.totalOrders}</p>
          <p className="text-[10px] text-zinc-500">Pedidos</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 text-center">
          <CheckCircle2 size={20} className="mx-auto text-green-500 mb-2" />
          <p className="text-xl font-black text-zinc-900 dark:text-white">{stats.completedOrders}</p>
          <p className="text-[10px] text-zinc-500">Completados</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 text-center">
          <Clock4 size={20} className="mx-auto text-amber-500 mb-2" />
          <p className="text-xl font-black text-zinc-900 dark:text-white">{stats.pendingOrders}</p>
          <p className="text-[10px] text-zinc-500">En proceso</p>
        </div>
      </div>

      {/* Points History */}
      {recentTransactions.length > 0 && (
        <div id="points-history" className="space-y-3">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <History size={16} className="text-yellow-500" />
            Historial de Puntos
          </h3>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.points > 0 ? (
                      <PlusCircle size={20} />
                    ) : (
                      <MinusCircle size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(transaction.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`font-bold ${
                  transaction.points > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.points > 0 ? '+' : ''}{formatPoints(transaction.points)}
                </span>
              </div>
            ))}
          </div>
          {recentTransactions.length > 5 && (
            <button className="w-full text-center text-xs text-yellow-500 font-bold py-2">
              Ver historial completo →
            </button>
          )}
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Percent size={16} className="text-yellow-500" />
            Promociones activas
          </h3>
          {promotions.slice(0, 2).map((promo) => (
            <div 
              key={promo.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0">
                  <img 
                    src={promo.image} 
                    alt={promo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{promo.title}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-1">{promo.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-yellow-500">{promo.discount}</span>
                    {promo.code && (
                      <button
                        onClick={() => copyCode(promo.code!)}
                        className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
                      >
                        {showCopied === promo.code ? (
                          <><CheckCircle2 size={12} /> Copiado</>
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

      {/* Recent Orders Preview */}
      {myOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-white">Pedidos recientes</h3>
            <button 
              onClick={() => setActiveTab('orders')}
              className="text-xs text-yellow-500 font-bold flex items-center gap-1"
            >
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          {myOrders.slice(0, 2).map((order) => {
            const status = getStatusConfig(order.status);
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Pedido #{order.id.slice(-6)}</span>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${status.bg} ${status.text} ${status.border} border`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">{formatDate(order.createdAt)}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <StatusIcon size={14} className={status.text} />
                  <span>{status.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Support Button */}
      <button 
        onClick={() => openWhatsApp(`Hola LaserMachine, soy ${user.name} y tengo una pregunta sobre mi pedido.`)}
        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <MessageCircle size={20} />
        Chatear con nosotros
      </button>
    </Card>
  );

  // ORDERS TAB
  const renderOrders = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-zinc-900 dark:text-white">Mis Pedidos</h2>
      
      {myOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-zinc-300 mb-4" />
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Sin pedidos aún</h3>
          <p className="text-sm text-zinc-500">¡Haz tu primera compra!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myOrders.map((order) => {
            const status = getStatusConfig(order.status);
            const StatusIcon = status.icon;
            const isExpanded = expandedOrder === order.id;
            
            return (
              <Card
                key={order.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                {/* Order Header */}
                <div 
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${status.bg} ${status.border} border rounded-xl flex items-center justify-center`}>
                        <StatusIcon size={18} className={status.text} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-sm">
                          Pedido #{order.id.slice(-6)}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronDown 
                      size={18} 
                      className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                  
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${status.bg} ${status.text} ${status.border} border`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${status.color}`}></div>
                      {status.label}
                    </span>
                  </div>
                  
                  {/* Estimated Delivery */}
                  {order.estimatedDeliveryDate && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
                      <Truck size={14} />
                      <span>Entrega estimada: {formatDate(order.estimatedDeliveryDate)}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-4">
                    {/* Status Timeline */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-zinc-500 uppercase">Estado del pedido</p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <CheckCircle size={14} className="text-green-500" />
                          <span>Recibido</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-700"></div>
                        <div className={`flex items-center gap-1 ${order.status === OrderStatus.IN_PRODUCTION || order.status === OrderStatus.READY || order.status === OrderStatus.COMPLETED ? 'text-green-500' : 'text-zinc-400'}`}>
                          <CheckCircle size={14} />
                          <span>Producción</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-700"></div>
                        <div className={`flex items-center gap-1 ${order.status === OrderStatus.READY || order.status === OrderStatus.COMPLETED ? 'text-green-500' : 'text-zinc-400'}`}>
                          <CheckCircle size={14} />
                          <span>Listo</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-700"></div>
                        <div className={`flex items-center gap-1 ${order.status === OrderStatus.COMPLETED ? 'text-green-500' : 'text-zinc-400'}`}>
                          <CheckCircle size={14} />
                          <span>Entregado</span>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {order.items.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        const productImage = product?.colors.find(c => c.name === item.colorName)?.imageUrl || product?.imageUrl;
                        
                        return (
                          <div key={idx} className="flex gap-3">
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
                                {item.productId}
                              </p>
                              <p className="text-xs text-zinc-500">{item.colorName} • x{item.quantity}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {order.status === OrderStatus.WAITING_APPROVAL && requiresMockupApproval(order) && (
                        <button 
                          onClick={() => setMockupOrder(order)}
                          className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors animate-pulse"
                        >
                          <Sparkles size={14} />
                          Aprobar diseño
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Ver detalles
                      </button>
                      <button 
                        onClick={() => openWhatsApp(`Hola, tengo una pregunta sobre mi pedido #${order.id.slice(-6)}`)}
                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageCircle size={14} />
                        Consultar
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // CATALOG TAB
  const renderCatalog = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-zinc-900 dark:text-white">Catálogo</h2>
      <div className="grid grid-cols-2 gap-3">
        {products.filter(p => p.isActive !== false).map((product) => (
          <div 
            key={product.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={32} className="text-zinc-400" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{product.name}</h3>
              <p className="text-xs text-zinc-500">{product.brand}</p>
              <p className="text-sm font-black text-yellow-500 mt-1">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // COUPONS TAB
  const renderCoupons = () => {
    // Show all coupons, even if not marked as active, to ensure visibility for testing
    const activeCoupons = coupons.filter(c =>
      (!c.expiryDate || new Date(c.expiryDate) > new Date()) &&
      (c.maxUses === -1 || (c.usedCount || 0) < c.maxUses)
    );

    const expiredCoupons = coupons.filter(c => 
      c.expiryDate && new Date(c.expiryDate) <= new Date()
    );

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-zinc-900 dark:text-white">Mis Cupones</h2>
        
        {/* Active Coupons */}
        {activeCoupons.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">Cupones disponibles</p>
            {activeCoupons.map((coupon) => (
              <div 
                key={coupon.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden"
              >
                {/* Decorative circles for ticket effect */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-50 dark:bg-black rounded-full"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-50 dark:bg-black rounded-full"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full border-t-2 border-dashed border-zinc-200 dark:border-zinc-700"></div>
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Ticket size={20} className="text-yellow-500" />
                        <span className="text-2xl font-black text-yellow-500">{coupon.discountPercent}%</span>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">OFF</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {coupon.assignedToPhone ? 'Cupón personalizado' : 'Cupón global'}
                      </p>
                    </div>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      {showCopied === coupon.code ? (
                        <><CheckCircle2 size={14} /> Copiado</>
                      ) : (
                        <><Copy size={14} /> Copiar</>
                      )}
                    </button>
                  </div>
                  
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg font-mono text-lg font-bold text-zinc-900 dark:text-white tracking-wider">
                      {coupon.code}
                    </code>
                  </div>
                  
                  {coupon.expiryDate && (
                    <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                      <Calendar size={12} />
                      Válido hasta: {new Date(coupon.expiryDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
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
        ) : (
          <div className="text-center py-8">
            <Ticket size={48} className="mx-auto text-zinc-300 mb-3" />
            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">No tienes cupones activos</h3>
            <p className="text-sm text-zinc-500">Vuelve pronto para nuevas promociones</p>
          </div>
        )}

        {/* Expired Coupons */}
        {expiredCoupons.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-zinc-500 mb-3">Cupones expirados</p>
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

  // Load fonts dynamically
  useEffect(() => {
    if (!fonts.length) return;
    
    let styleTag = document.getElementById('dashboard-fonts') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dashboard-fonts';
      document.head.appendChild(styleTag);
    }

    let cssRules = '';
    fonts.forEach(font => {
      if (font.isCustom && font.fileData) {
        cssRules += `
          @font-face {
            font-family: '${font.cssFamily}';
            src: url('${font.fileData}') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
        `;
      }
    });

    styleTag.textContent = cssRules;
    
    return () => {
      if (styleTag) styleTag.remove();
    };
  }, [fonts]);

  // FONTS TAB - Simple: solo escribir nombre y ver en todas las fuentes
  const renderFonts = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
          Fuentes disponibles
        </h2>
        <p className="text-zinc-500">
          Escribe tu nombre para ver cómo se ve en cada fuente
        </p>
      </div>
      
      {/* Text Input - Solo esto */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
        <div className="relative">
          <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Escribe tu nombre aquí..."
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 py-4 pl-14 pr-4 rounded-xl text-xl font-medium text-zinc-900 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-400"
          />
        </div>
      </div>
      
      {/* Fonts Grid - Nombre de fuente escrito con esa fuente */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fonts.filter(f => f.isActive !== false).map((font) => (
          <div
            key={font.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* Preview: Nombre del usuario en esta fuente */}
            <div className="h-32 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4">
              <p
                className="text-2xl text-zinc-800 dark:text-zinc-200 text-center break-all leading-tight"
                style={{ fontFamily: font.cssFamily, fontWeight: 'normal' }}
              >
                {previewText || 'Tu nombre'}
              </p>
            </div>
            
            {/* Info: Nombre de la fuente en esa fuente */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mb-1">
                #{font.id}
              </p>
              <h3 
                className="text-lg text-zinc-900 dark:text-white truncate"
                style={{ fontFamily: font.cssFamily }}
              >
                {font.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ORDER DETAILS MODAL
  if (selectedOrder) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md">
        <div className="h-full overflow-y-auto">
          <div className="min-h-full p-4 flex items-start justify-center">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 relative my-4">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                  Pedido #{selectedOrder.id.slice(-6)}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              {/* Status */}
              {(() => {
                const s = getStatusConfig(selectedOrder.status);
                return (
                  <div className={`${s.bg} ${s.border} border rounded-2xl p-4 mb-6`}>
                    <div className="flex items-center gap-3">
                      <s.icon size={24} className={s.text} />
                      <div>
                        <p className={`font-bold ${s.text}`}>{s.label}</p>
                        <p className="text-xs text-zinc-500">{s.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Items with previews */}
              <div className="space-y-6">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                      <h4 className="font-bold text-zinc-900 dark:text-white">
                        {item.productId} - {item.colorName}
                      </h4>
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

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
                <button 
                  onClick={() => openWhatsApp(`Hola, tengo una pregunta sobre mi pedido #${selectedOrder.id.slice(-6)}`)}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={18} />
                  Contactar soporte
                </button>
                {selectedOrder.status === OrderStatus.COMPLETED && (
                  <button 
                    onClick={() => onReorder?.(selectedOrder)}
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCcw size={18} />
                    Reordenar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <span className="text-lg font-black text-black">LM</span>
              </div>
              <div>
                <h1 className="font-black text-lg text-zinc-900 dark:text-white">LaserMachine</h1>
                <p className="text-[10px] text-zinc-500">Panel de cliente</p>
              </div>
            </div>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'catalog' && renderCatalog()}
        {activeTab === 'coupons' && renderCoupons()}
        {activeTab === 'fonts' && renderFonts()}
      </div>

      {/* Pending Approvals Alert Banner */}
      {hasPendingApprovals && (
        <div className="fixed top-[73px] left-0 right-0 z-30 bg-purple-500 text-white px-4 py-3">
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
                // Scroll to first pending order
                const firstPending = pendingApprovals[0];
                if (firstPending) {
                  setExpandedOrder(firstPending.id);
                }
              }}
              className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Ver ahora →
            </button>
          </div>
        </div>
      )}

      {/* Mockup Approval Modal */}
      {mockupOrder && (
        <MockupApprovalModal
          order={mockupOrder}
          products={products}
          fonts={fonts}
          whatsappNumber="5210000000000" // Replace with actual number from config
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
      {renderBottomNav()}
    </div>
  );
};

export default ClientDashboard;

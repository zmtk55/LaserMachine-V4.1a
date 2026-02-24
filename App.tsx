

import React, { useState, useEffect, useCallback } from 'react';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { CartProvider, useCartPanel } from './contexts/CartContext';
import { NavBar } from './components/NavBar';
import { AdminDashboard } from './components/AdminDashboard';
import CommandAssistant from './components/CommandAssistant';
import { ClientDashboard } from './components/ClientDashboard';
import { ProductVisualizer } from './components/ProductVisualizer';
import { FontShowcase } from './components/FontShowcase';
import { TechnicalPreview } from './components/TechnicalPreview';
import { AuthModal } from './components/AuthModal';
import { PublicTracking } from './components/PublicTracking';
import { LandingPage } from './components/LandingPage';
import { NotificationPanel } from './components/NotificationPanel';
import { NotificationManager } from './components/NotificationManager';
import { CartPanel } from './components/CartPanel';
// import { LottieAnimation } from './components/LottieAnimation';
import { ViewState, User, Product, ProductColor, OrderItem, UserRole, PricingConfig, StoreConfig, Order, OrderStatus, FontOption, PaymentStatus, DeliveryMethod, PaymentMethod, Coupon, PointTransaction } from './types';
import { PRODUCTS as CONST_PRODUCTS, FONTS as CONST_FONTS, ADMIN_USER, MOCK_ORDERS } from './constants';
import { ShoppingBag, Trash2, Zap, ArrowRight, Plus, Search, Edit2, X, Star, CreditCard, QrCode, Ticket, Eye, Banknote, CreditCard as CardIcon, Play, ShieldCheck, Users, Wallet, TrendingUp, Loader2 } from 'lucide-react';
import { onAuthChange, logoutUser, isFirebaseConfigured } from './services/auth';

// Import Lottie animation
// import playfulAnimation from './src/lotties/playful.json';

// --- FIXED PRICING ---
const DEFAULT_PRICING: PricingConfig = {
  baseEngravingPrice: 100, // Fixed to $100
  extraSidePrice: 50,      // Fixed to $50
  logoSurcharge: 50
};

// 17 Basic Colors
const DEFAULT_COLORS = [
    { name: 'NEGRO', hex: '#000000' },
    { name: 'BLANCO', hex: '#FFFFFF' },
    { name: 'ACERO', hex: '#C0C0C0' },
    { name: 'AZUL MARINO', hex: '#000080' },
    { name: 'AZUL REY', hex: '#4169E1' },
    { name: 'CELESTE', hex: '#87CEEB' },
    { name: 'ROJO', hex: '#FF0000' },
    { name: 'VINO', hex: '#800000' },
    { name: 'ROSA PASTEL', hex: '#FFD1DC' },
    { name: 'FUCSIA', hex: '#FF00FF' },
    { name: 'MORADO', hex: '#800080' },
    { name: 'LILA', hex: '#C8A2C8' },
    { name: 'AMARILLO', hex: '#FFFF00' },
    { name: 'NARANJA', hex: '#FFA500' },
    { name: 'VERDE MILITAR', hex: '#4B5320' },
    { name: 'VERDE BOTELLA', hex: '#006A4E' },
    { name: 'AQUA', hex: '#00FFFF' },
];

const DEFAULT_GALLERY_ASSETS = [
    { id: 'ast-1', url: 'https://cdn-icons-png.flaticon.com/512/25/25231.png', name: 'GitHub', type: 'CLIPART' }, 
    { id: 'ast-2', url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png', name: 'Star', type: 'CLIPART' },
    { id: 'ast-3', url: 'https://cdn-icons-png.flaticon.com/512/833/833472.png', name: 'Heart', type: 'CLIPART' },
    { id: 'ast-4', url: 'https://cdn-icons-png.flaticon.com/512/740/740845.png', name: 'Lightning', type: 'CLIPART' },
];

const DEFAULT_STORE: StoreConfig = {
  businessName: 'LASERMACHINE',
  logoUrl: '',
  accentColor: '#facc15',
  themeDarkModeBg: '#000000',
  bgPattern: 'dots',
  nextOrderId: 1000,
  productCategories: ['Tumblers', 'Botellas', 'Tazas', 'Accesorios', 'Termos'],
  adminEmails: [],
  pointsPercentage: 5, // Default 5%
  whatsapp: '5216371321998',
  instagramUrl: 'lasermachine_mx',
  facebookUrl: 'lasermachinemexico',
  bankInfo: '🏦 BBVA MÉXICO\nCLABE: 012345678901234567\nTITULAR: LASERMACHINE S.A. DE C.V.',
  shippingInfo: '',
  coupons: [],
  globalColors: DEFAULT_COLORS,
  brandingAssets: [],
  galleryAssets: DEFAULT_GALLERY_ASSETS as any,
  messageTemplates: {
      confirmation: "Hola {NOMBRE}, tu orden #{ID} ha sido recibida. Total: {TOTAL}. Seguimiento: {LINK}",
      production: "Hola {NOMBRE}, ¡Tu orden #{ID} está en producción! 🛠️. Sigue tu pedido aquí: {LINK}",
      ready: "Hola {NOMBRE}, tu pedido #{ID} está LISTO ✅. Recógelo o consulta detalles: {LINK}"
  }
};

const ShopProductCard = ({ product, onClick }: { product: Product, onClick: () => void, key?: React.Key }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div onClick={onClick} className="group cursor-pointer rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="aspect-square bg-white dark:bg-zinc-950 relative overflow-hidden flex items-center justify-center p-4">
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 z-10 animate-pulse">
                        <Loader2 className="animate-spin text-zinc-400 w-5 h-5"/>
                    </div>
                )}
                <img 
                    src={product.imageUrl} 
                    onLoad={() => setLoaded(true)}
                    className={`max-w-[85%] max-h-[85%] object-contain group-hover:scale-105 transition-transform duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} 
                />
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{product.brand}</span>
                <h3 className="font-bold text-sm uppercase tracking-tight mt-1 text-zinc-900 dark:text-white truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                    <p className="font-black text-base text-zinc-900 dark:text-white">${product.price}</p>
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Diseñar</span>
                </div>
            </div>
        </div>
    );
};

const App = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  // TEMPORAL: Auth desactivado para desarrollo - usar admin por defecto
  const [user, setUser] = useState<User | null>({
    id: 'admin-temp',
    name: 'Admin',
    email: 'admin@lasermachine.com',
    role: UserRole.ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=facc15&color=000000',
    laserPoints: 0,
    pointsHistory: []
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [preSelectedOrderId, setPreSelectedOrderId] = useState<string | null>(null);
  
  // Admin Dashboard Tab State (for NavBar title)
  const [adminActiveTab, setAdminActiveTab] = useState<string>('DASHBOARD');
  
  // Command Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');
  
  // Open assistant with optional query
  const openAssistant = useCallback((query?: string) => {
    if (query) setAssistantQuery(query);
    setIsAssistantOpen(true);
  }, []);
  
  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAssistantOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsAssistantOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Persistent State Initialization
  // Bumped to v13 to force image refresh with YETI product images
  const [products, setProducts] = useState<Product[]>(() => {
      try {
          const saved = localStorage.getItem('lm_products_v13');
          if (saved) {
              // Merge saved products with default images to ensure images are updated
              const parsed = JSON.parse(saved);
              return parsed.map((savedProduct: Product) => {
                  const defaultProduct = CONST_PRODUCTS.find(p => p.id === savedProduct.id);
                  if (defaultProduct) {
                      // Update images from default while preserving stock and other data
                      return {
                          ...savedProduct,
                          imageUrl: defaultProduct.imageUrl,
                          colors: savedProduct.colors.map((savedColor: ProductColor) => {
                              const defaultColor = defaultProduct.colors.find(c => c.name === savedColor.name);
                              return defaultColor ? { ...savedColor, imageUrl: defaultColor.imageUrl } : savedColor;
                          })
                      };
                  }
                  return savedProduct;
              });
          }
          return CONST_PRODUCTS;
      } catch (e) { return CONST_PRODUCTS; }
  });
  
  const [orders, setOrders] = useState<Order[]>(() => {
      try {
          const saved = localStorage.getItem('lm_orders_v10');
          return saved ? JSON.parse(saved) : MOCK_ORDERS;
      } catch (e) { return MOCK_ORDERS; }
  });

  const [fonts, setFonts] = useState<FontOption[]>(() => {
      try {
          const saved = localStorage.getItem('lm_fonts_v10');
          return saved ? JSON.parse(saved) : CONST_FONTS;
      } catch (e) { return CONST_FONTS; }
  });

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
      try {
          const saved = localStorage.getItem('lm_store_v10');
          let parsed = saved ? JSON.parse(saved) : DEFAULT_STORE;
          if (!parsed.messageTemplates) parsed.messageTemplates = DEFAULT_STORE.messageTemplates;
          if (!parsed.globalColors || parsed.globalColors.length === 0) parsed.globalColors = DEFAULT_COLORS;
          if (!parsed.brandingAssets) parsed.brandingAssets = [];
          if (!parsed.galleryAssets) parsed.galleryAssets = DEFAULT_GALLERY_ASSETS;
          if (parsed.pointsPercentage === undefined) parsed.pointsPercentage = 5;
          if (!parsed.themeDarkModeBg) parsed.themeDarkModeBg = DEFAULT_STORE.themeDarkModeBg;
          if (!parsed.nextOrderId) parsed.nextOrderId = 1000;
          if (!parsed.productCategories) parsed.productCategories = DEFAULT_STORE.productCategories;
          if (!parsed.adminEmails) parsed.adminEmails = [];
          return parsed;
      } catch (e) { return DEFAULT_STORE; }
  });

  const [pricing, setPricing] = useState<PricingConfig>(() => {
      try {
          const saved = localStorage.getItem('lm_pricing_v10');
          return saved ? JSON.parse(saved) : DEFAULT_PRICING;
      } catch (e) { return DEFAULT_PRICING; }
  });
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', notes: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  
  // CHECKOUT STATE
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [showMercadoPagoModal, setShowMercadoPagoModal] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.PICKUP);
  
  // EDITING & PREVIEW STATE
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [previewItem, setPreviewItem] = useState<OrderItem | null>(null); // For Modal Preview

  // New state for font flow
  const [preSelectedFontId, setPreSelectedFontId] = useState<number | null>(null);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('lm_products_v13', JSON.stringify(products));
    localStorage.setItem('lm_orders_v10', JSON.stringify(orders));
    localStorage.setItem('lm_store_v10', JSON.stringify(storeConfig));
    localStorage.setItem('lm_pricing_v10', JSON.stringify(pricing));
    localStorage.setItem('lm_fonts_v10', JSON.stringify(fonts));
  }, [products, orders, storeConfig, pricing, fonts]);

  // Inject Fonts CSS & Theme Colors
  useEffect(() => {
    // 1. Fonts Injection
    const styleId = 'custom-fonts-injection';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    let cssRules = '';
    // Product Fonts
    fonts.forEach(font => {
      if (font.isCustom && font.fileData) {
        const familyName = font.cssFamily; 
        cssRules += `
          @font-face {
            font-family: '${familyName}';
            src: url('${font.fileData}') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          .${familyName} { font-family: '${familyName}', sans-serif !important; }
        `;
      }
    });

    // System Branding Font
    if (storeConfig.customLogoFontData) {
        cssRules += `
          @font-face {
            font-family: 'custom-sys-font';
            src: url('${storeConfig.customLogoFontData}') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          .custom-sys-font { font-family: 'custom-sys-font', sans-serif !important; }
        `;
    }

    // 2. Theme Injection (Global Colors Override)
    if (storeConfig.themeDarkModeBg && storeConfig.themeDarkModeBg !== '#000000') {
        cssRules += `
            .dark, .dark body, .dark main { background-color: ${storeConfig.themeDarkModeBg} !important; }
            .dark .bg-black { background-color: ${storeConfig.themeDarkModeBg} !important; }
        `;
    }

    styleTag.textContent = cssRules;
  }, [fonts, storeConfig.themeDarkModeBg, storeConfig.customLogoFontData]);

  // Session Persistence Listener - DESACTIVADO para desarrollo
  // TODO: Reactivar cuando se termine de probar
  // useEffect(() => {
  //   const unsubscribe = onAuthChange((userData) => {
  //     setUser(userData);
  //   });
  //   return () => unsubscribe();
  // }, []);

  // Handle URL Parameters for Tracking
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    const orderIdParam = urlParams.get('id');
    
    if (viewParam === 'TRACKING' && orderIdParam) {
      setView('PUBLIC_TRACKING');
      setPreSelectedOrderId(orderIdParam);
    }
  }, []);

  // Notification Navigation Handler
  useEffect(() => {
    const handleNotificationNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string; data?: any }>;
      const { url, data } = customEvent.detail || {};
      
      if (url === '#inventory') {
        setView('ADMIN');
        // Small delay to ensure view is set first
        setTimeout(() => {
          // Trigger inventory tab via custom event
          window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'INVENTORY' }));
        }, 100);
      } else if (url === '#orders') {
        setView('ADMIN');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'ORDERS' }));
        }, 100);
      }
    };

    window.addEventListener('notificationNavigate', handleNotificationNavigate);
    return () => window.removeEventListener('notificationNavigate', handleNotificationNavigate);
  }, []);

  // Auth Guard - Redirect to login if accessing protected routes without user
  useEffect(() => {
    const protectedViews = ['SHOP', 'FONTS_SHOWCASE', 'CUSTOMIZER', 'CLIENT_DASHBOARD', 'ADMIN_DASHBOARD'];
    if (protectedViews.includes(view) && !user) {
      setView('LANDING');
      setIsLoginOpen(true);
    }
  }, [view, user]);

  // Handle login from LoginModal - now receives properly formatted User
  const handleAuth = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsLoginOpen(false);
    
    if (view === 'LANDING') {
        if (loggedInUser.role === UserRole.ADMIN) {
            setView('ADMIN_DASHBOARD');
        } else {
            setView('CLIENT_DASHBOARD');
        }
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setView('LANDING');
  };

  const handleApplyCoupon = () => {
      if (!couponCode.trim()) return;
      const found = storeConfig.coupons?.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
      
      if (!found) {
          alert("Cupón no válido.");
          setAppliedCoupon(null);
          return;
      }
      
      if (!found.active) {
          alert("Este cupón ya no está activo.");
          setAppliedCoupon(null);
          return;
      }

      if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
          alert("Este cupón ha expirado.");
          setAppliedCoupon(null);
          return;
      }

      if (found.maxUses !== -1 && (found.usedCount || 0) >= (found.maxUses || 1)) {
          alert("Este cupón ha alcanzado su límite de usos.");
          setAppliedCoupon(null);
          return;
      }

      if (found.assignedToPhone && customerInfo.phone && found.assignedToPhone !== customerInfo.phone) {
          alert(`Este cupón es exclusivo para el usuario con teléfono: ${found.assignedToPhone}`);
          if(!customerInfo.phone) {
              alert("Por favor ingresa tu teléfono en la información del cliente para validar este cupón exclusivo.");
              return;
          }
          setAppliedCoupon(null);
          return;
      }

      setAppliedCoupon(found);
      alert(`¡Cupón ${found.code} aplicado! ${found.discountPercent}% de descuento.`);
  };

  const handleCreateReferral = (code: string) => {
      if (!user) return;
      const cleanCode = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      
      if (storeConfig.coupons.some(c => c.code === cleanCode)) {
          alert("Este código ya existe. Por favor elige otro.");
          return;
      }

      const newCoupon: Coupon = {
          code: cleanCode,
          discountPercent: 10, 
          active: true,
          referrerUserId: user.id,
          maxUses: -1,
          createdAt: new Date().toISOString()
      };

      setStoreConfig({ ...storeConfig, coupons: [...storeConfig.coupons, newCoupon] });
      alert(`¡Código ${cleanCode} creado con éxito! Compártelo para ganar puntos.`);
  };

  const handleFinalCheckout = () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Error: Identificación incompleta. Por favor ingrese nombre y teléfono.");
      return;
    }

    if (selectedPaymentMethod === PaymentMethod.MERCADOPAGO) {
        setShowMercadoPagoModal(true);
        setTimeout(() => {
            processOrderCreation();
            setShowMercadoPagoModal(false);
        }, 3000);
        return;
    }

    processOrderCreation();
  };

  const processOrderCreation = () => {
    const subtotal = cart.reduce((a, b) => a + b.totalPrice, 0);
    const pointsDiscount = (usePoints && user?.laserPoints) ? user.laserPoints : 0;
    
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
        couponDiscountAmount = (subtotal * appliedCoupon.discountPercent) / 100;
    }

    const totalDiscount = pointsDiscount + couponDiscountAmount;
    const finalTotal = Math.max(0, subtotal - totalDiscount);
    
    // Calculate new points earned based on CONFIG Percentage
    const pointsPercentage = storeConfig.pointsPercentage || 5; 
    const pointsEarned = Math.floor(finalTotal * (pointsPercentage / 100));

    if (appliedCoupon) {
        const updatedCoupons = storeConfig.coupons.map(c => {
            if (c.code === appliedCoupon.code) {
                return { ...c, usedCount: (c.usedCount || 0) + 1 };
            }
            return c;
        });
        setStoreConfig({ ...storeConfig, coupons: updatedCoupons });
    }

    const currentId = storeConfig.nextOrderId || 1000;
    const newOrderId = `LM-${currentId}`;
    
    const newOrder: Order = {
      id: newOrderId,
      userId: user?.id || 'guest',
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email, 
      shippingAddress: customerInfo.notes,
      items: [...cart],
      total: finalTotal,
      pointsRedeemed: pointsDiscount,
      couponUsed: appliedCoupon?.code,
      discountAmount: couponDiscountAmount,
      status: OrderStatus.RECEIVED,
      deliveryMethod: deliveryMethod, 
      paymentMethod: selectedPaymentMethod, 
      history: [{ timestamp: new Date().toISOString(), status: OrderStatus.RECEIVED, operator: 'SYSTEM' }],
      createdAt: new Date().toISOString(),
      paymentStatus: selectedPaymentMethod === PaymentMethod.MERCADOPAGO ? PaymentStatus.PAID : PaymentStatus.PENDING,
      amountPaid: selectedPaymentMethod === PaymentMethod.MERCADOPAGO ? finalTotal : 0
    };
    
    setStoreConfig({ ...storeConfig, nextOrderId: currentId + 1 });

    // Update User Points (Subtract used, Add earned, Add History)
    if (user) {
        const remainingPoints = usePoints ? 0 : user.laserPoints || 0;
        const newBalance = remainingPoints + pointsEarned;
        
        let newHistory = user.pointsHistory || [];
        
        // Record Redemption
        if (usePoints && user.laserPoints && user.laserPoints > 0) {
            newHistory = [...newHistory, {
                id: Date.now().toString() + '-redeem',
                type: 'REDEEMED',
                amount: user.laserPoints,
                date: new Date().toISOString(),
                orderId: newOrderId,
                description: 'Canje en Orden #' + newOrderId
            }];
        }

        // Record Earnings
        if (pointsEarned > 0) {
            newHistory = [...newHistory, {
                id: Date.now().toString() + '-earn',
                type: 'EARNED',
                amount: pointsEarned,
                date: new Date().toISOString(),
                orderId: newOrderId,
                description: `Premio ${pointsPercentage}% compra`
            }];
        }

        setUser({ ...user, laserPoints: newBalance, pointsHistory: newHistory }); 
    }
    
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode('');
    setView('LANDING');
    
    let msg = `ORDEN REGISTRADA EXITOSAMENTE: #${newOrder.id}\n`;
    if (user && pointsEarned > 0) msg += `¡Has ganado ${pointsEarned} LaserPoints!\n`;
    if (selectedPaymentMethod !== PaymentMethod.MERCADOPAGO) {
        msg += `\nNos pondremos en contacto vía WhatsApp.`;
    }
    alert(msg);
  };

  const handleEditCartItem = (item: OrderItem) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
          setSelectedProduct(product);
          setEditingItem(item); 
          setCart(prev => prev.filter(i => i.id !== item.id)); 
          setView('CUSTOMIZER');
      }
  };

  const updateClientDetails = (originalPhone: string, newName: string, newPhone: string, newEmail: string) => {
      setOrders(prevOrders => prevOrders.map(o => {
          if (o.customerPhone === originalPhone) {
              return { ...o, customerName: newName, customerPhone: newPhone, customerEmail: newEmail };
          }
          return o;
      }));
  };

  const deleteClientHistory = (phone: string) => {
      if(confirm('¿Estás seguro de borrar el historial de este cliente? Esto ocultará sus ordenes pasadas.')) {
          setOrders(prev => prev.filter(o => o.customerPhone !== phone));
      }
  };

  const handleResetOrdersAndClients = () => {
    if(confirm("ESTA ACCIÓN BORRARÁ TODOS LOS PEDIDOS Y CLIENTES. ¿ESTÁS SEGURO?")) {
        setOrders([]);
    }
  };

  const handleResetInventoryCounts = () => {
     if(confirm("¿RESETAR STOCK A CERO?")) {
        setProducts(products.map(p => ({
            ...p,
            colors: p.colors.map(c => ({ ...c, stock: 0 }))
        })));
     }
  };

  const handleResetProducts = () => {
    localStorage.removeItem('lm_products_v12');
    localStorage.removeItem('lm_products_v11');
    localStorage.removeItem('lm_products_v10');
    setProducts(CONST_PRODUCTS);
    alert("Productos reseteados a valores por defecto. Recarga la página para ver los cambios.");
  };

  const filteredCustomers = customerSearch 
    ? Array.from(new Set(orders.map(o => JSON.stringify({name: o.customerName, phone: o.customerPhone, email: o.customerEmail || ''}))))
        .map(s => JSON.parse(s as string))
        .filter((c: any) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
    : [];

  const getPatternClass = () => {
      switch(storeConfig.bgPattern) {
          case 'dots': return 'bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px]';
          case 'grid': return 'bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] [background-size:20px_20px]';
          case 'lines': return 'bg-[repeating-linear-gradient(45deg,#e4e4e7_0,#e4e4e7_1px,transparent_0,transparent_50%)] dark:bg-[repeating-linear-gradient(45deg,#27272a_0,#27272a_1px,transparent_0,transparent_50%)] [background-size:10px_10px]';
          default: return '';
      }
  };

    // Apply dark class to document for global theming
    React.useEffect(() => {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, [isDarkMode]);

    return (
      <NotificationProvider>
        <CartProvider>
        <BackgroundProvider>
          <div className={`min-h-screen flex flex-col font-mono-tech bg-zinc-50 dark:bg-zinc-950 ${isDarkMode ? 'dark' : ''}`}>
      {/* Notification Manager - Solo cuando hay usuario logueado */}
      {user && <NotificationManager products={products} orders={orders} user={user} />}
      
      {view !== 'CUSTOMIZER' && view !== 'PUBLIC_TRACKING' && (
        <NavBar 
          user={user} cartCount={cart.length} 
          onNavigate={setView} 
          onLogin={() => setIsLoginOpen(true)} 
          onLogout={handleLogout}
          isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} 
          storeConfig={storeConfig}
          currentView={view}
          adminActiveTab={adminActiveTab}
        />
      )}
      
    <main className={`flex-1 w-full overflow-y-auto no-scrollbar bg-transparent ${getPatternClass()}`}>
        {view === 'LANDING' && (
          <LandingPage 
            storeConfig={storeConfig}
            products={products}
            onNavigate={(view) => setView(view)}
            onLogin={() => setIsLoginOpen(true)}
          />
        )}

        {view === 'PUBLIC_TRACKING' && (
            <PublicTracking orders={orders} onBack={() => setView('LANDING')} preSelectedOrderId={preSelectedOrderId} />
        )}

        {view === 'SHOP' && (
          <div className="max-w-[95%] mx-auto px-6 md:px-10 py-24 animate-in fade-in duration-700 bg-white/90 dark:bg-black/80 backdrop-blur-sm min-h-full">
            {preSelectedFontId && (
                <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 shadow-sm">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14}/> Tipografía #{preSelectedFontId} seleccionada.
                    </span>
                    <button onClick={() => setPreSelectedFontId(null)} className="text-[10px] font-black uppercase underline hover:text-black dark:hover:text-white">Cancelar</button>
                </div>
            )}
            {/* Título removido - ahora en NavBar */}
            
            {/* CATALOG GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {products.map(p => (
                <ShopProductCard 
                    key={p.id}
                    product={p} 
                    onClick={() => { setSelectedProduct(p); setEditingItem(null); setView('CUSTOMIZER'); }}
                />
              ))}
            </div>
          </div>
        )}

        {view === 'FONTS_SHOWCASE' && (
            <FontShowcase 
                fonts={fonts} 
                onSelectFont={(id) => {
                    setPreSelectedFontId(id);
                    setView('SHOP');
                }}
            />
        )}

        {view === 'CUSTOMIZER' && selectedProduct && (
          <ProductVisualizer 
            product={selectedProduct} fonts={fonts} pricing={pricing}
            availableColors={storeConfig.globalColors}
            initialFontId={preSelectedFontId || undefined}
            initialState={editingItem}
            galleryAssets={storeConfig.galleryAssets || []}
            storeConfig={storeConfig}
            onBack={() => setView('SHOP')} 
            onSwitchProduct={(p) => { setSelectedProduct(p); setEditingItem(null); }}
            onSave={(config, goToCart) => { 
              const fontName = fonts.find(f => f.id === config.frontFontId)?.name || 'Default';
              const backFontName = fonts.find(f => f.id === config.backFontId)?.name || 'Default';
              
              const newItem: OrderItem = {
                id: Date.now().toString(),
                productId: selectedProduct.id,
                colorName: config.color,
                frontText: config.frontText,
                frontText2: config.frontText2, 
                frontFontId: config.frontFontId,
                frontFontId2: config.frontFontId2,
                frontFontName: fontName,
                frontDesignState: config.frontDesign,
                frontDesignState2: config.frontDesign2,
                frontLogos: config.frontLogos,
                backText: config.backText,
                backText2: config.backText2,
                backFontId: config.backFontId,
                backFontId2: config.backFontId2,
                backFontName: backFontName,
                backDesignState: config.backDesign,
                backDesignState2: config.backDesign2,
                backLogos: config.backLogos,
                quantity: config.quantity,
                unitPrice: config.priceTotal,
                totalPrice: config.priceTotal * config.quantity,
                notes: '',
                isClientItem: config.isClientItem,
                clientItemBrand: config.clientItemBrand,
                clientItemColor: config.clientItemColor,
                customBackgroundImage: config.customBackgroundImage
              };

              setCart([...cart, newItem]); 
              setPreSelectedFontId(null); 
              setEditingItem(null); 
              
              if (goToCart) {
                  setView('CART');
              } else {
                  alert("Diseño agregado al carrito. Puedes continuar diseñando.");
                  setView('SHOP'); 
              }
            }}
            onGoToCart={() => setView('CART')}
            isDarkMode={isDarkMode}
          />
        )}

        {view === 'CART' && (
          <div className="max-w-[95%] mx-auto px-4 md:px-10 py-12 md:py-24 min-h-screen bg-white/90 dark:bg-black/80 backdrop-blur-sm">
            <h2 className="nike-title text-4xl md:text-5xl italic mb-10 text-zinc-900 dark:text-white uppercase tracking-tighter">Checkout Final</h2>
            {cart.length === 0 ? (
               <div className="py-40 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/10 rounded-3xl">
                  <ShoppingBag size={64} className="mx-auto text-zinc-400 dark:text-zinc-800 mb-8" />
                  <p className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-500 dark:text-zinc-600 mb-8">Cola de activos vacía</p>
                  <button onClick={() => setView('SHOP')} className="text-amber-500 dark:text-amber-500 uppercase font-black text-[10px] tracking-[0.4em] border-b border-amber-500 dark:border-amber-500 pb-2">Regresar al catálogo</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                  {/* Left Column: Items */}
                  <div className="lg:col-span-2 space-y-6">
                    {cart.map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      const color = prod?.colors.find(c => c.name === item.colorName);
                      // Calculate individual breakdown
                      const basePrice = item.isClientItem ? 0 : (prod?.price || 0);
                      const unitCustomPrice = item.unitPrice - basePrice;
                      
                      return (
                        <div key={item.id} className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col md:flex-row gap-6 items-center rounded-2xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-all backdrop-blur-md relative overflow-hidden group">
                           <div className="w-24 h-24 md:w-32 md:h-32 product-container rounded-xl shrink-0 overflow-hidden bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 relative">
                              <img src={color?.imageUrl || prod?.imageUrl} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-xl" style={{backgroundColor: color?.hex}}></div>
                           </div>
                           <div className="flex-1 w-full text-left">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                    <h4 className="font-black text-zinc-900 dark:text-white uppercase text-xl tracking-tight leading-none">{prod?.name}</h4>
                                    <p className="text-sm font-bold text-zinc-500 uppercase mt-1">{item.isClientItem ? `PROPIO: ${item.clientItemBrand} ${item.clientItemColor}` : `${item.colorName}`}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-black text-xl text-zinc-900 dark:text-white">${item.totalPrice}</span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">x{item.quantity} Unid.</span>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex flex-wrap gap-2">
                                  <button onClick={() => setPreviewItem(item)} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-500 hover:text-black border border-amber-500/50 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                                      <Eye size={12}/> Ver Diseño Final
                                  </button>
                                  <button onClick={() => handleEditCartItem(item)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                                      <Edit2 size={12}/> Editar
                                  </button>
                                  <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                                      <Trash2 size={12}/> Borrar
                                  </button>
                              </div>

                              {/* Price Breakdown Mini */}
                              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                                  <span>Base Unit: <b className="text-zinc-900 dark:text-white">${basePrice}</b></span>
                                  <span>+</span>
                                  <span>Personalización: <b className="text-zinc-900 dark:text-white">${unitCustomPrice}</b></span>
                              </div>
                           </div>
                        </div>
                      );
                    })}
                    <button onClick={() => setView('SHOP')} className="w-full py-5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-bold uppercase text-xs hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                        <Plus size={16}/> Agregar otro producto
                    </button>
                  </div>
                  
                  {/* Right Column: Checkout Summary (Sticky) */}
                  <div className="relative">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl sticky top-24 shadow-2xl space-y-8 backdrop-blur-md">
                        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-6">
                            <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white">Datos del Pedido</h3>
                            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">{cart.length} Items</span>
                        </div>

                        {/* Customer Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-zinc-500 uppercase block mb-2 tracking-widest">Nombre Completo*</label>
                                <input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value.toUpperCase()})} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold uppercase text-sm outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-700" placeholder="NOMBRE Y APELLIDO"/>
                            </div>
                            <div>
                                <label className="text-xs font-black text-zinc-500 uppercase block mb-2 tracking-widest">WhatsApp / Teléfono*</label>
                                <input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold uppercase text-sm outline-none focus:border-amber-500 transition-colors font-mono placeholder:text-zinc-300 dark:placeholder:text-zinc-700" type="tel" placeholder="10 DÍGITOS"/>
                            </div>
                            <div>
                                <label className="text-xs font-black text-zinc-500 uppercase block mb-2 tracking-widest">Email (Opcional)</label>
                                <input value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold text-sm outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-700" type="email" placeholder="PARA REGISTRO CLIENTE"/>
                            </div>
                        </div>

                        {/* Payment & Coupons */}
                        <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <div>
                                <label className="text-xs font-black text-zinc-500 uppercase block mb-3 tracking-widest">Método de Pago</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: PaymentMethod.CASH, label: 'Efectivo', icon: Banknote },
                                        { id: PaymentMethod.TRANSFER, label: 'Transferencia', icon: ArrowRight },
                                        { id: PaymentMethod.CARD, label: 'Tarjeta', icon: CardIcon },
                                        { id: PaymentMethod.MERCADOPAGO, label: 'MercadoPago', icon: QrCode },
                                    ].map(m => (
                                        <button 
                                            key={m.id}
                                            onClick={() => setSelectedPaymentMethod(m.id)}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${selectedPaymentMethod === m.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400'}`}
                                        >
                                            <m.icon size={16}/> {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* LASER POINTS REDEMPTION UI */}
                            {user && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-500 flex items-center gap-2">
                                            <Wallet size={14}/> LaserPoints
                                        </span>
                                        <p className="text-[10px] text-zinc-500 font-bold mt-1">
                                            Disponibles: {user.laserPoints} pts (${user.laserPoints})
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setUsePoints(!usePoints)}
                                        disabled={user.laserPoints <= 0}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${usePoints ? 'bg-amber-500 text-black shadow-lg' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
                                    >
                                        {usePoints ? 'Canjeados' : 'Canjear'}
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-black text-zinc-500 uppercase block mb-3 tracking-widest">Cupón de Descuento</label>
                                <div className="flex gap-2">
                                    <input 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl font-bold uppercase text-xs outline-none focus:border-amber-500"
                                        placeholder="CÓDIGO"
                                    />
                                    <button onClick={handleApplyCoupon} className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white px-4 rounded-xl font-bold text-xs uppercase"><Ticket size={16}/></button>
                                </div>
                                {appliedCoupon && (
                                    <div className="mt-2 text-xs font-bold text-green-500 flex items-center gap-2">
                                        <Zap size={12}/> Cupón {appliedCoupon.code} aplicado ({appliedCoupon.discountPercent}%)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 font-bold uppercase">Subtotal</span>
                                <span className="font-bold text-zinc-900 dark:text-white">${cart.reduce((a, b) => a + b.totalPrice, 0)}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-sm text-green-500">
                                    <span className="font-bold uppercase">Descuento Cupón</span>
                                    <span className="font-bold">-${(cart.reduce((a, b) => a + b.totalPrice, 0) * appliedCoupon.discountPercent / 100).toFixed(2)}</span>
                                </div>
                            )}
                            {usePoints && user?.laserPoints && user.laserPoints > 0 && (
                                <div className="flex justify-between text-sm text-amber-600 dark:text-amber-500">
                                    <span className="font-bold uppercase">Canje Puntos</span>
                                    <span className="font-bold">-${user.laserPoints.toFixed(2)}</span>
                                </div>
                            )}
                            {/* Points to Earn Display */}
                            <div className="flex justify-between text-xs text-blue-500 font-bold">
                                <span className="uppercase flex items-center gap-1"><TrendingUp size={12}/> Puntos por ganar ({storeConfig.pointsPercentage}%)</span>
                                <span>+{Math.floor((Math.max(0, cart.reduce((a, b) => a + b.totalPrice, 0) * (appliedCoupon ? (1 - appliedCoupon.discountPercent/100) : 1) - (usePoints && user?.laserPoints ? user.laserPoints : 0))) * (storeConfig.pointsPercentage ? storeConfig.pointsPercentage/100 : 0.05))} pts</span>
                            </div>

                            <div className="flex justify-between items-end pt-4">
                                <span className="text-base font-black text-zinc-900 dark:text-white uppercase">Total Final</span>
                                <span className="text-4xl font-black text-zinc-900 dark:text-white leading-none">
                                    ${(Math.max(0, cart.reduce((a, b) => a + b.totalPrice, 0) * (appliedCoupon ? (1 - appliedCoupon.discountPercent/100) : 1) - (usePoints && user?.laserPoints ? user.laserPoints : 0))).toFixed(0)}
                                </span>
                            </div>
                        </div>

                        <button onClick={handleFinalCheckout} className="w-full py-5 bg-yellow-400 text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-yellow-300 shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-3 transition-transform active:scale-95">
                            Confirmar Pedido <ArrowRight size={18}/>
                        </button>
                    </div>
                  </div>
               </div>
            )}
          </div>
        )}

        {/* PREVIEW MODAL */}
        {previewItem && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95">
                <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 relative shadow-2xl">
                    <button onClick={() => setPreviewItem(null)} className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"><X size={20}/></button>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase mb-8">Ficha Técnica de Producción</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <TechnicalPreview 
                            imageUrl={products.find(p => p.id === previewItem.productId)?.colors.find(c => c.name === previewItem.colorName)?.imageUrl || products.find(p => p.id === previewItem.productId)?.imageUrl} 
                            text={previewItem.frontText} text2={previewItem.frontText2} 
                            fontName={previewItem.frontFontName} fontCss={fonts.find(f => f.id === previewItem.frontFontId)?.cssFamily || ''} 
                            logos={previewItem.frontLogos} 
                            designState={previewItem.frontDesignState} designState2={previewItem.frontDesignState2} 
                            sideLabel="LADO A (FRENTE)"
                        />
                        <TechnicalPreview 
                            imageUrl={products.find(p => p.id === previewItem.productId)?.colors.find(c => c.name === previewItem.colorName)?.imageUrl || products.find(p => p.id === previewItem.productId)?.imageUrl} 
                            text={previewItem.backText} text2={previewItem.backText2} 
                            fontName={previewItem.backFontName} fontCss={fonts.find(f => f.id === previewItem.backFontId)?.cssFamily || ''} 
                            logos={previewItem.backLogos} 
                            designState={previewItem.backDesignState} designState2={previewItem.backDesignState2} 
                            sideLabel="LADO B (POSTERIOR)"
                        />
                    </div>
                    
                    <div className="mt-8 text-center">
                        <p className="text-xs text-zinc-500 font-mono">Este es el diseño que se enviará a producción.</p>
                    </div>
                </div>
            </div>
        )}

        {view === 'ADMIN_DASHBOARD' && user?.role === UserRole.ADMIN && (
          <AdminDashboard 
            orders={orders} products={products} fonts={fonts} pricing={pricing}
            storeConfig={storeConfig}
            onUpdatePricing={setPricing} onUpdateStoreConfig={setStoreConfig}
            onUpdateOrder={(updatedOrder) => setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o))}
            onAddOrder={(newOrder) => setOrders([newOrder, ...orders])}
            onUpdateOrderPriority={(id, p) => setOrders(orders.map(o => o.id === id ? {...o, isPriority: p} : o))}
            onAddProduct={p => setProducts([...products, p])}
            onUpdateProduct={p => setProducts(products.map(x => x.id === p.id ? p : x))}
            onDeleteProduct={id => setProducts(products.filter(p => p.id !== id))}
            onAddFont={f => setFonts([...fonts, f])}
            onUpdateFont={(oldId, f) => setFonts(fonts.map(font => font.id === oldId ? f : font))}
            onDeleteFont={id => setFonts(fonts.filter(f => f.id !== id))}
            onUpdateClient={updateClientDetails}
            onDeleteClient={deleteClientHistory}
            onResetOrdersAndClients={handleResetOrdersAndClients}
            onResetInventoryCounts={handleResetInventoryCounts}
            onResetProducts={handleResetProducts}
            onOpenAssistant={openAssistant}
            onTabChange={setAdminActiveTab}
          />
        )}

        {view === 'CLIENT_DASHBOARD' && (user?.role === UserRole.CLIENT || user?.role === UserRole.ADMIN) && (
            <ClientDashboard 
              user={user} 
              orders={orders} 
              coupons={storeConfig.coupons}
              onCreateReferral={handleCreateReferral}
              products={products}
              fonts={fonts}
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
            />
        )}

        {/* Login Modal Integration */}
        <AuthModal 
            isOpen={isLoginOpen} 
            onClose={() => setIsLoginOpen(false)} 
            onLogin={handleAuth} 
        />

        {/* Command Assistant (RAB) */}
        <CommandAssistant
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          initialQuery={assistantQuery}
          orders={orders}
          products={products}
          onNavigate={(tab, opts) => {
            setIsAssistantOpen(false);
            if (tab === 'ORDERS') setView('ADMIN_DASHBOARD');
            if (tab === 'INVENTORY') setView('ADMIN_DASHBOARD');
            if (tab === 'SETTINGS') setView('ADMIN_DASHBOARD');
          }}
        />

        {/* MercadoPago Mock Modal */}
        {showMercadoPagoModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-sm w-full text-center border border-zinc-200 dark:border-zinc-800">
                    <img src="https://logotipoz.com/wp-content/uploads/2021/10/versiones-del-logo-de-mercado-pago-1.png" className="h-8 mx-auto mb-6" alt="MercadoPago"/>
                    <div className="w-48 h-48 bg-zinc-100 dark:bg-zinc-800 mx-auto rounded-xl flex items-center justify-center mb-6">
                        <QrCode size={120} className="text-zinc-800 dark:text-zinc-200"/>
                    </div>
                    <p className="text-zinc-900 dark:text-white font-bold text-lg mb-2">Escanea para pagar</p>
                    <p className="text-zinc-500 text-xs mb-6">Abre tu app de banco o MercadoPago y escanea este código.</p>
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] text-zinc-400 mt-4 uppercase tracking-widest">Esperando confirmación...</p>
                </div>
            </div>
        )}
      </main>
          
          {/* Notification Panel */}
          <NotificationPanel />
          
          {/* Cart Panel */}
          <CartPanel 
            cartItems={cart.map(item => ({
              id: item.id,
              productName: item.productName,
              colorName: item.colorName,
              quantity: item.quantity,
              price: item.price,
              imageUrl: item.imageUrl
            }))}
            onUpdateQuantity={(id, qty) => {
              if (qty === 0) {
                setCart(cart.filter(i => i.id !== id));
              } else {
                setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i));
              }
            }}
            onRemoveItem={(id) => setCart(cart.filter(i => i.id !== id))}
            onCheckout={() => setView('CHECKOUT')}
            total={cart.reduce((sum, i) => sum + i.price * i.quantity, 0)}
          />
          
        </div>
      </BackgroundProvider>
      </CartProvider>
      </NotificationProvider>
  );
};

export default App;
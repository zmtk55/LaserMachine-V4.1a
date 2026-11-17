import{ShopProductCard}from'./components/ShopProductCard';
import {usePersistentCart} from './services/usePersistentCart';
import {commitCartItem} from './utils/cartEditing';
import {checkoutCouponError} from './utils/couponValidation';
import {CloudSaveStatus} from './components/CloudSaveStatus';
import {productPreviewImage,productColorHex,productPreviewLabel} from './utils/productColorPreview';
import {previewImageScale,previewInk} from './utils/designPreview';
import{itemProductLabel,itemColorLabel} from './utils/orderItemDisplay';
import{resolveBundledFonts,BUNDLED_FONTS} from './utils/bundledFonts';
import { GuestOrderPanel } from './components/GuestOrderPanel';
import {CheckoutAttempt,checkoutFingerprint,checkoutAttemptMatches,canClearCheckoutCart,persistCheckoutAttempt,restoreCheckoutAttempt,clearPersistedCheckoutAttempt} from './services/checkoutAttempt';
import {submitSupabaseCheckout,CheckoutRequest} from './services/supabaseCheckout';
import {prepareCheckoutAssets} from './services/prepareCheckoutAssets';
import {hydrateOrderAssets} from './services/orderAssets';
import {updateCustomerProfile} from './utils/customerProfiles';
import {CustomerProfile} from './types';
import { BusinessWorkspace } from './services/businessPersistence';
import { supabase } from './services/supabaseClient';
import {loadPublicWorkspace,EMPTY_CONTENT} from './services/publicWorkspace';


import { createPendingPayment } from './utils/manualPayment';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { CartProvider, useCartPanel } from './contexts/CartContext';
import { OrderHistoryProvider } from './contexts/OrderHistoryContext';
import { ContextMenuProvider } from './contexts/ContextMenuContext';
import ContextMenu from './components/ContextMenu';
import { NavBar } from './components/NavBar';
import { AdminDashboard } from './components/AdminDashboard';
import CommandAssistant from './components/CommandAssistant';
import { ClientDashboard } from './components/ClientDashboard';
import { ProductVisualizer } from './components/ProductVisualizer';
import { FontShowcase } from './components/FontShowcase';
import { TechnicalPreview } from './components/TechnicalPreview';
import { AuthModal } from './components/AuthModal';
import { exchangeAccountCode, readAccountLinkError } from './services/accountAccess';
import { PublicTracking } from './components/PublicTracking';
import { SimpleOrderModal } from './components/SimpleOrderModal';
import { CinematicLanding as LandingPage } from './components/CinematicLanding';
import { NotificationPanel } from './components/NotificationPanel';
import { NotificationManager } from './components/NotificationManager';
import { CartPanel } from './components/CartPanel';
// import { LottieAnimation } from './components/LottieAnimation';
import { ViewState, User, Product, ProductColor, OrderItem, UserRole, PricingConfig, StoreConfig, Order, OrderStatus, FontOption, PaymentStatus, DeliveryMethod, PaymentMethod, Coupon, PointTransaction } from './types';
import { PRODUCTS as CONST_PRODUCTS, FONTS as CONST_FONTS, ADMIN_USER, MOCK_ORDERS } from './constants';
import { ShoppingBag, Trash2, Zap, ArrowRight, Plus, Search, Edit2, X, Star, CreditCard, QrCode, Ticket, Eye, Banknote, CreditCard as CardIcon, Play, ShieldCheck, Users, Wallet, TrendingUp, Loader2 } from 'lucide-react';
import { onAuthChange, logoutUser, isFirebaseConfigured } from './services/supabaseAuth';

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

const DEFAULT_STORE: StoreConfig = {
  businessName: 'LASERMACHINE',
  logoUrl: '',
  accentColor: '#f59e0b',
  themeDarkModeBg: '#000000',
  bgPattern: 'dots',
  nextOrderId: 1000,
  productCategories: ['Tumblers', 'Botellas', 'Tazas', 'Accesorios', 'Termos'],
  adminEmails: [],
  pointsPercentage: 5, // Default 5%
  whatsapp: '+526371247095', // Confirmado por Julian 2026-11-09 (WhatsApp 21:22): número de pedidos
  instagramUrl: 'lasermachine_mx',
  facebookUrl: 'lasermachinemexico',
  bankInfo: 'Transferencia — Mercado Pago W\nTitular: Jocelyne Arellanes Martinez\nCLABE: 7229 6901 0978 7186 42\nEnvía tu comprobante por WhatsApp para confirmar tu pedido.', // Datos entregados por Julian 2026-11-09 (imagen); dígito verificador CLABE válido (sólo estructura, no cuenta existente)
  shippingInfo: '',
  coupons: [],
  globalColors: DEFAULT_COLORS,
  brandingAssets: [],
  galleryAssets: [],
  messageTemplates: {
      confirmation: "Hola {NOMBRE}, tu orden #{ID} ha sido recibida. Total: {TOTAL}. Seguimiento: {LINK}",
      production: "Hola {NOMBRE}, ¡Tu orden #{ID} está en producción! 🛠️. Sigue tu pedido aquí: {LINK}",
      ready: "Hola {NOMBRE}, tu pedido #{ID} está LISTO ✅. Recógelo o consulta detalles: {LINK}"
  }
};

const formatMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);


const App = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [user, setUser] = useState<User | null>(null);
  const [authResolved,setAuthResolved]=useState(false);
  const [trackingOwner,setTrackingOwner]=useState<string|null>(null);
  const [trackingLoad,setTrackingLoad]=useState<'loading'|'ready'|'error'>('loading');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<'reset-password' | undefined>(undefined);
  const [linkNotice, setLinkNotice] = useState('');
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

  // Complete email-link flows: signup confirmation and password recovery land on ?code= (or ?error=)
  useEffect(() => {
    const linkError = readAccountLinkError();
    if (linkError) { setLinkNotice(linkError); return; }
    const code = new URL(window.location.href).searchParams.get('code');
    if (!code) return;
    (async () => {
      try {
        const result = await exchangeAccountCode();
        if (!result) return;
        if (result === 'recovery') {
          setAuthInitialView('reset-password');
          setIsLoginOpen(true);
        } else {
          setLinkNotice('Enlace verificado. Ya tienes la sesión activa.');
        }
      } catch (e) {
        setLinkNotice(e instanceof Error ? e.message : 'El enlace expiró. Solicita otro.');
      }
    })();
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

  const [products, setProducts] = useState<Product[]>([]);
  const [customers,setCustomers]=useState<CustomerProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE);
  const [publicContent,setPublicContent]=useState(EMPTY_CONTENT);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const workspace=useRef<BusinessWorkspace|null>(null);
  const workspaceGeneration=useRef(0);
  const [cloudState,setCloudState]=useState('Cargando conexión');
  const [cloudReady,setCloudReady]=useState(false);
  const [cloudLoadAttempt,setCloudLoadAttempt]=useState(0);
  const [saving,setSaving]=useState(false);
  const initialSnapshot=useRef('');
  const currentSnapshot=JSON.stringify([products,fonts,orders,customers,storeConfig,pricing]);
  const [savedSnapshot,setSavedSnapshot]=useState('');
  useEffect(()=>onAuthChange(next=>{setUser(next);setAuthResolved(true);}),[]);
  useEffect(()=>{
    let alive=true;workspaceGeneration.current++;setCloudReady(false);workspace.current=null;setTrackingLoad('loading');
    if(user?.role!==UserRole.ADMIN){
      setOrders([]);setCustomers([]);setProducts([]);setFonts([]);setStoreConfig(DEFAULT_STORE);setPricing(DEFAULT_PRICING);
      loadPublicWorkspace(Boolean(user?.id)).then(async data=>{if(!alive)return;data.fonts=await resolveBundledFonts(data.fonts);if(!alive)return;setProducts(data.products);setFonts(data.fonts);setStoreConfig({...DEFAULT_STORE,...data.store});setPricing({...DEFAULT_PRICING,...data.pricing});setPublicContent(data.content);setOrders(data.orders);setTrackingOwner(user?.id??'anonymous');setTrackingLoad('ready');void hydrateOrderAssets(data.orders).then(rows=>{if(alive)setOrders(current=>current===data.orders?rows:current);}).catch(()=>{/* Keep the current order list if an original attachment cannot load. */});setCloudState('Catálogo cargado de Supabase');}).catch(()=>{if(alive){setCloudState('No se pudo cargar catálogo de Supabase');setTrackingLoad('error');}});
      return ()=>{alive=false;};
    }
    const w=new BusinessWorkspace();
    w.load().then(async data=>{
      if(!alive)return;
      const p=data.lm_products as Product[],f=await resolveBundledFonts(data.lm_fonts as FontOption[]),o=data.lm_orders as Order[];
      if(!alive)return;
      const st={...DEFAULT_STORE,...((data.lm_store_private[0]??{}) as Partial<StoreConfig>)} as StoreConfig,pr={...DEFAULT_PRICING,...((data.lm_pricing[0]??{}) as Partial<PricingConfig>)} as PricingConfig;
      setProducts(p);setFonts(f);setOrders(o);setCustomers(data.lm_customers as CustomerProfile[]);setStoreConfig(st);setPricing(pr);
      for(const [t,values] of [['lm_products',p],['lm_fonts',f],['lm_orders',o],['lm_customers',data.lm_customers],['lm_store_private',[st]],['lm_pricing',[pr]]] as const)w.trackInitial(t,[...values]);
      initialSnapshot.current=JSON.stringify([p,f,o,data.lm_customers,st,pr]);setSavedSnapshot(initialSnapshot.current);
      workspace.current=w;setCloudReady(true);setTrackingOwner(user?.id??'anonymous');setTrackingLoad('ready');setCloudState('Cargado de Supabase');
    }).catch(()=>{if(alive){setCloudState('Error al cargar Supabase. No se guardarán valores por defecto.');setTrackingLoad('error');}});
    return ()=>{alive=false;};
  },[user?.id,user?.role,cloudLoadAttempt]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(checkoutAttempt.current||(cloudReady&&currentSnapshot!==savedSnapshot)){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[cloudReady,currentSnapshot,savedSnapshot]);
  const saveCloud=async()=>{
    if(!cloudReady||!workspace.current||saving)return;setSaving(true);setCloudState('Guardando en Supabase');
    try{const w=workspace.current;await w.save('lm_products',products);await w.save('lm_fonts',fonts);await w.save('lm_orders',orders);await w.save('lm_customers',customers);await w.save('lm_store_private',[storeConfig]);await w.save('lm_pricing',[pricing]);setSavedSnapshot(currentSnapshot);setCloudState('Guardado confirmado por Supabase');}
    catch(e){setCloudState((e as Error).message+' - cambios conservados en pantalla.');}finally{setSaving(false);}
  };
  const {cart,setCart,cartStorageError}=usePersistentCart();
  const [submittingOrder,setSubmittingOrder]=useState(false);
  const submittingOrderLock=useRef(false);
  const checkoutAttempt=useRef<CheckoutAttempt|null>(null);
  useEffect(()=>{const restored=restoreCheckoutAttempt();if(restored&&!checkoutAttempt.current)checkoutAttempt.current=restored;},[]);
  const visibleCheckout=useRef<{ownerId:string;fingerprint:string}|null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const currentEditorProduct=selectedProduct?products.find(product=>product.id===selectedProduct.id):products[0];
  const editorProduct=trackingLoad==='loading'?(currentEditorProduct||selectedProduct):currentEditorProduct;
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', notes: '' });
  const [customerSearch, setCustomerSearch] = useState('');

  // CHECKOUT STATE
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [usePoints, setUsePoints] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.PICKUP);

  // EDITING & PREVIEW STATE
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [desktopBackground,setDesktopBackground]=useState(9);
  const [navigationDrafts,setNavigationDrafts]=useState<Record<string,OrderItem>>({});
  useEffect(()=>{setNavigationDrafts({});},[user?.id,user?.role]);
  const [customizerDraft,setCustomizerDraft]=useState<OrderItem|null>(null);
  useEffect(()=>{if(view!=='CUSTOMIZER')setCustomizerDraft(null);},[view]);
  const [previewItem, setPreviewItem] = useState<OrderItem | null>(null); // For Modal Preview

  // New state for font flow
  const [preSelectedFontId, setPreSelectedFontId] = useState<number | null>(null);
  const [simpleOrderProduct, setSimpleOrderProduct] = useState<Product | null>(null);
  const currentSimpleProduct=simpleOrderProduct?products.find(product=>product.id===simpleOrderProduct.id):undefined;
  const simpleProduct=trackingLoad==='loading'?(currentSimpleProduct||simpleOrderProduct):currentSimpleProduct;
  const [preSelectedText, setPreSelectedText] = useState<string>('');
  const editorInitialState=editingItem||(customizerDraft?.productId===editorProduct?.id?customizerDraft:null)||(editorProduct?navigationDrafts[editorProduct.id]:null)||(preSelectedText?{frontText:preSelectedText,frontFontId:preSelectedFontId||undefined} as OrderItem:null);

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
    // Product Fonts (archivos propios del taller o bytes oficiales incluidos del frontend)
    fonts.forEach(font => {
      if ((font.isCustom || font.bundled) && font.fileData) {
        const familyName = font.cssFamily;
        const weight = font.bundled ? (BUNDLED_FONTS[font.id]?.weight ?? 'normal') : 'normal';
        cssRules += `
          @font-face {
            font-family: '${familyName}';
            src: url('${font.fileData}') format('truetype');
            font-weight: ${weight};
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

    if (viewParam === 'SHOP') setView('SHOP');
    if (viewParam === 'TRACKING') {
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
        setView('ADMIN_DASHBOARD');
        // Small delay to ensure view is set first
        setTimeout(() => {
          // Trigger inventory tab via custom event
          window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'INVENTORY' }));
        }, 100);
      } else if (url === '#orders') {
        setView('ADMIN_DASHBOARD');
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
    const protectedViews = ['CLIENT_DASHBOARD', 'ADMIN_DASHBOARD']; // SHOP/FONTS_SHOWCASE/CUSTOMIZER son navegación pública (ruta sencilla, 10-nov); la sesión se pide al confirmar el pedido, no al explorar
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

      const error=checkoutCouponError(found,customerInfo.phone);
      if(error){alert(error);setAppliedCoupon(null);return;}

      setAppliedCoupon(found);
      alert(`¡Cupón ${found.code} aplicado! ${found.discountPercent}% de descuento.`);
  };

  const handleCreateReferral = (code: string) => {
      if (!user || user.role!==UserRole.ADMIN) {alert('Los referidos requieren validación segura del taller.');return;}
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

  const visibleCheckoutInput:CheckoutRequest={requestId:'visible-intent-only',customer:{name:customerInfo.name,phone:customerInfo.phone,email:customerInfo.email},items:cart,paymentMethod:selectedPaymentMethod,deliveryMethod,notes:customerInfo.notes,expectedTotal:Math.max(0,cart.reduce((a,b)=>a+b.totalPrice,0)*(appliedCoupon?1-appliedCoupon.discountPercent/100:1)-(usePoints&&!user?.isGuest?(user?.laserPoints||0):0)),couponCode:appliedCoupon?.code??'',pointsRedeemed:usePoints&&!user?.isGuest?(user?.laserPoints||0):0};
  visibleCheckout.current=user?{ownerId:user.id,fingerprint:checkoutFingerprint(visibleCheckoutInput)}:null;

  const handleFinalCheckout = async () => {
    if(submittingOrderLock.current)return;
    if(import.meta.env.VITE_CHECKOUT_ENABLED!=='true'){alert('El envío seguro del pedido sigue en pruebas. No se creó pedido ni cobro.');return;}
    if(!user){alert('Inicia sesión antes de guardar el pedido');setIsLoginOpen(true);return;}
    if(user.role===UserRole.ADMIN&&cloudReady&&currentSnapshot!==savedSnapshot){alert('Guarda o descarta cambios administrativos antes de enviar el pedido');return;}
    if(!customerInfo.name.trim()||!customerInfo.phone.trim()){alert('Escribe nombre y teléfono');return;}
    const requestGeneration=workspaceGeneration.current;
    const isCurrentSession=()=>workspaceGeneration.current===requestGeneration;
    submittingOrderLock.current=true;
    setSubmittingOrder(true);
    try{
      if(checkoutAttempt.current&&checkoutAttempt.current.ownerId!==user.id){alert('Hay un pedido anterior sin confirmar de otra sesión. Vuelve a la cuenta original para resolverlo. No se envió otro pedido.');return;}
      if(checkoutAttempt.current&&!checkoutAttemptMatches(checkoutAttempt.current,user.id,visibleCheckoutInput)&&!confirm('Hay un pedido anterior sin respuesta definitiva y cambiaste el carrito o sus datos. ¿Reintentar SOLO el pedido anterior con su misma referencia? El carrito actual se conservará. No se crea otro pedido ni se cobra.'))return;
      if(!checkoutAttempt.current){
        const input={...structuredClone(visibleCheckoutInput),requestId:crypto.randomUUID()};
        checkoutAttempt.current={ownerId:user.id,fingerprint:checkoutFingerprint(input),cache:new Map(),input};
      }
      const attempt=checkoutAttempt.current;
      if(!attempt.prepared)attempt.prepared=await prepareCheckoutAssets(attempt.input,attempt.cache);
      if(!isCurrentSession())return;
      persistCheckoutAttempt(attempt);
      const result=await submitSupabaseCheckout(attempt.prepared);
      if(result.state!=='received'){if(!isCurrentSession())return;alert('El servidor no confirmó el pedido. Conservamos carrito y referencia para reintentar sin duplicar. No hubo cobro.');return;}
      const clearCart=canClearCheckoutCart(attempt,visibleCheckout.current);
      checkoutAttempt.current=null;clearPersistedCheckoutAttempt();
      if(!isCurrentSession())return;
      if(clearCart){setCart([]);setAppliedCoupon(null);setCouponCode('');setUsePoints(false);}
      else alert('El pedido anterior fue recibido. Conservamos el carrito actual porque cambió; no fue enviado.');
      let receiptVisible=false;
      try{const data=await loadPublicWorkspace(true);if(!isCurrentSession())return;setProducts(data.products);const hydrated=await hydrateOrderAssets(data.orders);if(!isCurrentSession())return;setOrders(hydrated);receiptVisible=hydrated.some(o=>o.id===result.receipt.orderId&&o.userId===user.id);}catch{if(!isCurrentSession())return;setCloudState('Pedido recibido; recarga de catálogo pendiente');}
      if(clearCart)setView(user.role===UserRole.ADMIN?'SHOP':'CLIENT_DASHBOARD');
      if(user.isGuest){if(!clearCart||!receiptVisible)alert(`Solicitud ${result.receipt.orderId} recibida. Guarda este folio. Julián revisa tu pedido y te confirma por WhatsApp; aún no hay pago ni confirmación.`);if(user.role===UserRole.ADMIN&&clearCart)window.location.reload();return;}
      alert(result.receipt.reviewRequired?`Solicitud ${result.receipt.orderId} guardada. Pendiente de revisión del taller: total y entrega sin confirmar. No se descontaron puntos ni se confirmó pago.`:`Pedido ${result.receipt.orderId} guardado en Supabase. Total $${result.receipt.total}. Pago pendiente, sin cobro en línea.`);
      if(user.role===UserRole.ADMIN&&clearCart)window.location.reload();
    }catch(error){if(isCurrentSession())alert((error as Error).message+' - carrito conservado, sin cobro.');}finally{submittingOrderLock.current=false;setSubmittingOrder(false);}
  };

  const handleEditCartItem = (item: OrderItem) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
          setSelectedProduct(product);
          setEditingItem(navigationDrafts[item.productId]?.id===item.id?navigationDrafts[item.productId]:item);
          setView('CUSTOMIZER');
      }
  };

  const updateClientDetails = (originalPhone: string, newName: string, newPhone: string, newEmail: string) => {
      setCustomers(prev=>updateCustomerProfile(prev,orders,originalPhone,newName,newPhone,newEmail));
  };

  const deleteClientHistory = (phone: string) => {
      if(confirm('¿Archivar este perfil de cliente? Sus pedidos e historial se conservan.')) {
          setCustomers(prev=>{const next=updateCustomerProfile(prev,orders,phone,prev.find(p=>p.phone===phone)?.name??orders.find(o=>o.customerPhone===phone)?.customerName??'',phone,prev.find(p=>p.phone===phone)?.email??'');return next.map(p=>p.phone===phone?{...p,archived:true}:p);});
      }
  };

  const handleResetOrdersAndClients = () => {
    if(confirm("ESTA ACCIÓN BORRARÁ TODOS LOS PEDIDOS Y CLIENTES. ¿ESTÁS SEGURO?")) {
        setOrders([]);setCustomers([]);
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

  const handleResetProducts = () => { alert('No se cargan productos de ejemplo. Crea o edita productos reales desde Inventario.'); };

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
        <BackgroundProvider backgroundUrl={storeConfig.backgroundUrl} backgroundPatternOn={storeConfig.backgroundPatternOn ?? true} status={cloudState} onChange={patch=>{if(user?.role==='ADMIN')setStoreConfig(prev=>({...prev,...patch}));}}>
        <OrderHistoryProvider>
        <ContextMenuProvider>
          <div className={`lm-app lm-ui min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 ${isDarkMode ? 'dark' : ''}`}>
      {/* Notification Manager - Solo cuando hay usuario logueado */}
      {user && <NotificationManager businessReady={cloudReady} products={products} orders={orders} user={user} />}

      {view !== 'ADMIN_DASHBOARD' && view !== 'CUSTOMIZER' && view !== 'PUBLIC_TRACKING' && view !== 'CLIENT_DASHBOARD' && (
        <NavBar
          user={user} cartCount={cart.length}
          onNavigate={(newView) => {
            // Auto-select first product when navigating to customizer without a product
            if (newView === 'CUSTOMIZER' && !selectedProduct && products.length > 0) {
              setSelectedProduct(products[0]);
            }
            setView(newView);
          }}
          onLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)}
          storeConfig={storeConfig}
          currentView={view}
          adminActiveTab={adminActiveTab}
        />
      )}

    <main className={`flex-1 w-full ${view === 'LANDING' ? 'overflow-visible' : 'overflow-y-auto'} no-scrollbar bg-transparent ${getPatternClass()}`}>
        {view === 'LANDING' && (
          <LandingPage
            storeConfig={storeConfig}
            products={products}
            onNavigate={(view) => {
              if (view === 'CUSTOMIZER' && !selectedProduct && products.length > 0) {
                setSelectedProduct(products[0]);
              }
              setView(view);
            }}
            onLogin={() => setIsLoginOpen(true)}
          />
        )}

        {view === 'PUBLIC_TRACKING' && (
            <PublicTracking loading={!authResolved||trackingLoad==='loading'||(trackingLoad!=='error'&&trackingOwner!==(user?.id??'anonymous'))} loadError={authResolved&&trackingLoad==='error'} orders={user?orders.filter(o=>o.userId===user.id):[]} onBack={() => setView('LANDING')} preSelectedOrderId={preSelectedOrderId} />
        )}

        {view === 'SHOP' && (
          <div className="lm-shop-section max-w-[95%] mx-auto px-6 md:px-10 py-10 md:py-16 animate-in fade-in duration-700 bg-white/90 dark:bg-black/80 backdrop-blur-sm min-h-full">
            {preSelectedFontId && (
                <div className="lm-shop-font-notice mb-8 p-4 bg-amber-500/10 border border-amber-500 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 shadow-sm">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14}/> Letra seleccionada.
                    </span>
                    <button aria-label="Quitar fuente seleccionada" onClick={() => setPreSelectedFontId(null)} className="text-[10px] font-black uppercase underline hover:text-black dark:hover:text-white">Cancelar</button>
                </div>
            )}
            {/* Título removido - ahora en NavBar */}

            {trackingLoad==='loading'&&<div role="status" className="lm-catalog-state"><Loader2 className="animate-spin" size={22}/><h1>Cargando catálogo</h1></div>}
            {trackingLoad==='error'&&<div role="alert" className="lm-catalog-state"><h1>No se pudo cargar el catálogo</h1><p>Revisa tu conexión y vuelve a intentar. No se añadieron productos al pedido.</p><button onClick={()=>window.location.reload()}>Volver a intentar</button></div>}
            {trackingLoad==='ready'&&!products.length&&<div role="status" className="lm-catalog-state"><h1>No hay productos disponibles</h1><p>El taller aún no tiene productos publicados.</p></div>}
            {/* CATALOG GRID */}
            <div className={`lm-shop-grid grid gap-5 ${products.length === 1 ? 'grid-cols-1 max-w-[240px] mx-auto' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
              {trackingLoad==='ready'&&products.map(p => (
                <ShopProductCard
                    key={p.id}
                    product={p}
                    onClick={() => { setSelectedProduct(p); setEditingItem(null); if (preSelectedFontId && preSelectedText) { setSimpleOrderProduct(p); } else { setView('CUSTOMIZER'); } }}
                />
              ))}
            </div>
          </div>
        )}

        {view === 'FONTS_SHOWCASE' && (
          <FontShowcase
            fonts={fonts}
            initialText={preSelectedText || ''}
            onSelectFont={(id, text) => {
              setPreSelectedFontId(id);
              setPreSelectedText(text || '');
              const target=products.length===1?products[0]:null;
              setView('SHOP');if(target){setSelectedProduct(target);setSimpleOrderProduct(target);}
            }}
            onBack={() => setView('SHOP')}
          />
        )}

        {simpleOrderProduct && preSelectedFontId && preSelectedText && (simpleProduct ? (
          <fieldset disabled={trackingLoad!=='ready'} className="contents">
          <SimpleOrderModal
            product={simpleProduct}
            fonts={fonts}
            pricing={pricing}
            fontId={preSelectedFontId}
            text={preSelectedText}
            storeConfig={storeConfig}
            onAddToCart={(item) => { if(!currentSimpleProduct||trackingLoad!=='ready')return;setCart([...cart, item]); setSimpleOrderProduct(null); setPreSelectedFontId(null); setPreSelectedText(''); setView('CART'); }}
            onOpenFullEditor={(draft) => {if(!currentSimpleProduct||trackingLoad!=='ready')return;setCustomizerDraft(draft);setSelectedProduct(currentSimpleProduct);setSimpleOrderProduct(null);setEditingItem(null);setView('CUSTOMIZER');}}
            onChangeFont={() => { setSimpleOrderProduct(null); setView('FONTS_SHOWCASE'); }}
            onClose={() => setSimpleOrderProduct(null)}
          />
          </fieldset>
        ) : (
          <section role="status" className="mx-auto max-w-xl p-6 text-zinc-900 dark:text-white">
            <h2 className="text-xl font-bold mb-3">{trackingLoad==='loading'?'Cargando catálogo':trackingLoad==='error'?'No se pudo verificar el catálogo':'Producto no disponible en el catálogo actual'}</h2>
            <p className="mb-5">Elige otro producto del catálogo para continuar. No se añadió ningún producto al carrito.</p>
            <button onClick={()=>{setSimpleOrderProduct(null);setView('SHOP');}} className="px-4 py-3 rounded-lg bg-yellow-400 text-black font-bold">Elegir otro producto</button>
          </section>
        ))}

        {view === 'CUSTOMIZER' && (editorProduct ? (
          <fieldset disabled={trackingLoad!=='ready'} className="contents">
          <ProductVisualizer
            key={editorProduct.id}
            desktopBackground={desktopBackground}
            onDesktopBackground={setDesktopBackground}
            products={products}
            historyOwner={user?.id||'guest'}
            historyEnabled={authResolved&&trackingLoad==='ready'}
            product={editorProduct}
            fonts={fonts}
            pricing={pricing}
            availableColors={storeConfig.globalColors}
            initialFontId={preSelectedFontId || undefined}
            initialState={editorInitialState}
            galleryAssets={storeConfig.galleryAssets || []}
            storeConfig={storeConfig}
            onBack={(draft) => { if(draft)setNavigationDrafts(prev=>({...prev,[draft.productId]:draft}));setView('SHOP'); setPreSelectedText(''); setEditingItem(null); }}
            onSwitchProduct={(p,draft) => { if(draft)setNavigationDrafts(prev=>({...prev,[draft.productId]:draft}));setSelectedProduct(p); setEditingItem(null);setCustomizerDraft(null); }}
            onSave={(config, goToCart) => {
              const fontName = fonts.find(f => f.id === config.frontFontId)?.name || 'Default';
              const backFontName = fonts.find(f => f.id === config.backFontId)?.name || 'Default';
              const productToUse = currentEditorProduct;
              if(!productToUse||trackingLoad!=='ready')return;

              const newItem: OrderItem = {
                id: Date.now().toString(),
                productId: productToUse.id,
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

              setCart(prev=>commitCartItem(prev,newItem,editingItem?.id||(prev.some(item=>item.id===editorInitialState?.id)?editorInitialState?.id:undefined)));
              setNavigationDrafts(prev=>{const next={...prev};delete next[productToUse.id];return next;});
              setPreSelectedFontId(null);
              setPreSelectedText('');
              setEditingItem(null);

              if (goToCart) {
                  setView('CART');
              } else {
                  alert("Diseño agregado al carrito. Puedes continuar diseñando.");
                  setView('SHOP');
              }
            }}
            onGoToCart={(draft) => {if(draft)setNavigationDrafts(prev=>({...prev,[draft.productId]:draft}));setEditingItem(null);setView('CART');}}
            isDarkMode={isDarkMode}
          />
          </fieldset>
        ) : (
          <section className="mx-auto max-w-xl p-6 text-zinc-900 dark:text-white" aria-live="polite">
            <h2 className="text-xl font-bold mb-3">{trackingLoad==='loading'?'Cargando catálogo':trackingLoad==='error'?'No se pudo verificar el catálogo':'Producto no disponible en el catálogo actual'}</h2>
            <p className="mb-5">{trackingLoad==='loading'?'Espera un momento antes de continuar diseñando.':'Vuelve al catálogo y elige el producto que quieres personalizar.'}</p>
            <button onClick={()=>setView('SHOP')} className="px-4 py-3 rounded-lg bg-yellow-400 text-black font-bold">Volver al catálogo</button>
          </section>
        ))}

        {cartStorageError&&<aside className="lm-cart-save-warning" role="alert">{cartStorageError}</aside>}

        {view === 'CART' && (
          <div className="lm-checkout w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 min-h-screen bg-white/90 dark:bg-black/80 backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-zinc-900 dark:text-white uppercase tracking-tighter">Tu pedido</h2>
            {!cartStorageError&&cart.length>0&&<p className="lm-cart-local-note">Carrito conservado en este navegador. No es un pedido enviado. Revisa precios y disponibilidad antes de continuar.</p>}
            {import.meta.env.VITE_CHECKOUT_ENABLED!=='true'&&<aside className="lm-intake-notice" role="status"><strong>Recepción de pedidos cerrada por ahora</strong><p>Puedes probar tu diseño y revisar el precio. Todavía no se envían pedidos ni se hacen cobros.</p></aside>}
            {cart.length === 0 ? (
               <div className="py-40 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/10 rounded-3xl">
                  <ShoppingBag size={64} className="mx-auto text-zinc-400 dark:text-zinc-800 mb-8" />
                  <p className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-500 dark:text-zinc-600 mb-8">Tu pedido está vacío</p>
                  <button onClick={() => setView('SHOP')} className="text-amber-500 dark:text-amber-500 uppercase font-black text-[10px] tracking-[0.4em] border-b border-amber-500 dark:border-amber-500 pb-2">Regresar al catálogo</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
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
                              <img alt={productPreviewLabel(prod,item.colorName)||prod?.name||'Producto'} src={productPreviewImage(prod, item.colorName,item.customBackgroundImage) || prod?.imageUrl} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-xl" style={{backgroundColor: color?.hex}}></div>
                           </div>
                           <div className="flex-1 w-full text-left">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                    <h4 className="font-black text-zinc-900 dark:text-white uppercase text-xl tracking-tight leading-none">{item.isClientItem?'Grabado en tu termo':prod?.name}</h4>
                                    <p className="text-sm font-bold text-zinc-500 uppercase mt-1">{item.isClientItem ? `PROPIO: ${item.clientItemBrand==='OTRO'?'MARCA POR CONFIRMAR':item.clientItemBrand} ${item.clientItemColor}` : `${item.colorName}`}</p>{productPreviewLabel(prod,item.colorName,item.customBackgroundImage)&&<p className="text-xs text-zinc-500 mt-1">{productPreviewLabel(prod,item.colorName,item.customBackgroundImage)}</p>}
                                </div>
                                <div className="text-right">
                                    <span className="block font-black text-xl text-zinc-900 dark:text-white">{formatMXN(item.totalPrice)}</span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">x{item.quantity} {item.quantity === 1 ? 'pieza' : 'piezas'}</span>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                   <button onClick={() => setPreviewItem(item)} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-500 hover:text-black border border-amber-500/50 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer">
                                       <Eye size={12}/> Ver Diseño Final
                                   </button>
                                   <button onClick={() => handleEditCartItem(item)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer">
                                       <Edit2 size={12}/> Editar
                                   </button>
                                   <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer">
                                       <Trash2 size={12}/> Borrar
                                   </button>
                              </div>

                              {/* Price Breakdown Mini */}
                              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                                  <span>Base: <b className="text-zinc-900 dark:text-white">{formatMXN(basePrice)}</b></span>
                                  <span>+</span>
                                  <span>Personalización: <b className="text-zinc-900 dark:text-white">{formatMXN(unitCustomPrice)}</b></span>
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
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 lm-panel p-6 md:p-8 rounded-3xl sticky top-24 shadow-2xl space-y-8 backdrop-blur-md">
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                            <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white min-w-0">Datos del Pedido</h3>
                            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">{cart.length} {cart.length === 1 ? 'artículo' : 'artículos'}</span>
                        </div>

                        {/* Customer Form */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="customer-name" className="lm-field-label block mb-2">Nombre Completo*</label>
                                <input
                                    id="customer-name"
                                    value={customerInfo.name}
                                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value.toUpperCase()})}
                                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold uppercase text-base outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                    placeholder="NOMBRE Y APELLIDO"
                                    aria-required="true"
                                />
                            </div>
                            <div>
                                <label htmlFor="customer-phone" className="lm-field-label block mb-2">WhatsApp / Teléfono*</label>
                                <input
                                    id="customer-phone"
                                    value={customerInfo.phone}
                                    onChange={e => {setCustomerInfo({...customerInfo, phone:e.target.value});if(appliedCoupon?.assignedToPhone&&checkoutCouponError(appliedCoupon,e.target.value))setAppliedCoupon(null);}}
                                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold uppercase text-base outline-none focus:border-amber-500 transition-colors font-mono placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                    type="tel"
                                    placeholder="10 DÍGITOS"
                                    aria-required="true"
                                />
                            </div>
                            <div>
                                <label htmlFor="customer-email" className="lm-field-label block mb-2">Email (Opcional)</label>
                                <input
                                    id="customer-email"
                                    value={customerInfo.email}
                                    onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold text-base outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                    type="email"
                                    placeholder="correo@ejemplo.mx"
                                />
                            </div>
                        </div>

                        {/* Payment & Coupons */}
                        <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <div>
                                <label className="text-xs font-black text-zinc-500 uppercase block mb-3 tracking-widest">Método de Pago</label>
                                <div className="lm-payment-methods grid grid-cols-2 gap-2">
                                    {[
                                        { id: PaymentMethod.CASH, label: 'Pago en el taller', icon: Banknote },
                                        { id: PaymentMethod.TRANSFER, label: 'Transferencia', icon: ArrowRight },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedPaymentMethod(m.id)}
                                            aria-label={`Seleccionar método de pago: ${m.label}`}
                                            aria-pressed={selectedPaymentMethod === m.id}
                                            className={`lm-payment-option p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-black uppercase transition-all cursor-pointer ${selectedPaymentMethod === m.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400'}`}
                                        >
                                            <m.icon size={16}/> {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedPaymentMethod === PaymentMethod.TRANSFER && storeConfig.bankInfo && (
                                <div className="lm-payment-help whitespace-pre-line rounded-xl border border-zinc-200 dark:border-zinc-800 p-4" data-testid="bank-info">{storeConfig.bankInfo}</div>
                            )}

                            <p className="lm-payment-help">No hay cobro en línea. El pago queda pendiente hasta que el taller lo confirme.{selectedPaymentMethod === PaymentMethod.TRANSFER && !storeConfig.bankInfo ? ' Para transferencia, solicita los datos de pago al taller.' : ''}</p>

                            {/* LASER POINTS REDEMPTION UI */}
                            {user && !user.isGuest && (
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
                                        aria-label={usePoints ? `Canjeando ${user.laserPoints} puntos` : `Canjear ${user.laserPoints} puntos disponibles`}
                                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${usePoints ? 'bg-amber-500 text-black shadow-lg' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
                                    >
                                        {usePoints ? 'Canjeados' : 'Canjear'}
                                    </button>
                                </div>
                            )}

                            <div>
                                <label htmlFor="coupon-code" className="text-xs font-black text-zinc-500 uppercase block mb-3 tracking-widest">Cupón de Descuento</label>
                                <div className="flex gap-2">
                                    <input
                                        id="coupon-code"
                                        value={couponCode}
                                        onChange={(e) => {setCouponCode(e.target.value.toUpperCase());setAppliedCoupon(null);}}
                                        className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl font-bold uppercase text-sm outline-none focus:border-amber-500"
                                        placeholder="CÓDIGO"
                                        aria-describedby="coupon-help"
                                    />
                                    <button onClick={handleApplyCoupon} aria-label="Aplicar cupón de descuento" className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white px-4 rounded-xl font-bold text-xs uppercase cursor-pointer"><Ticket size={16}/></button>
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
                                <span className="font-bold text-zinc-900 dark:text-white">{formatMXN(cart.reduce((a, b) => a + b.totalPrice, 0))}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-sm text-green-500">
                                    <span className="font-bold uppercase">Descuento Cupón</span>
                                    <span className="font-bold">-{formatMXN(cart.reduce((a, b) => a + b.totalPrice, 0) * appliedCoupon.discountPercent / 100)}</span>
                                </div>
                            )}
                            {usePoints && !user?.isGuest && user?.laserPoints && user.laserPoints > 0 && (
                                <div className="flex justify-between text-sm text-amber-600 dark:text-amber-500">
                                    <span className="font-bold uppercase">Canje Puntos</span>
                                    <span className="font-bold">-${user.laserPoints.toFixed(2)}</span>
                                </div>
                            )}
                            {/* Points to Earn Display */}


                            <div className="flex justify-between items-end pt-4">
                                <span className="text-base font-black text-zinc-900 dark:text-white uppercase">Total Final</span>
                                <span className="text-4xl font-black text-zinc-900 dark:text-white leading-none">
                                    {formatMXN(Math.max(0, cart.reduce((a, b) => a + b.totalPrice, 0) * (appliedCoupon ? (1 - appliedCoupon.discountPercent/100) : 1) - (usePoints && !user?.isGuest && user?.laserPoints ? user.laserPoints : 0)))}
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-500">Envío, puntos o cupón personal requieren revisión del taller. El total mostrado puede ser estimado. No se acredita nada hasta confirmar el pago.</p>
                        <button disabled={submittingOrder||import.meta.env.VITE_CHECKOUT_ENABLED!=='true'} onClick={handleFinalCheckout} className="lm-primary w-full py-5 bg-yellow-400 text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-yellow-300 shadow-lg dark:shadow-none flex items-center justify-center gap-3 transition-transform active:scale-95">
                            {import.meta.env.VITE_CHECKOUT_ENABLED!=='true'?'Recepción cerrada':submittingOrder?'Guardando...':'Enviar solicitud'} <ArrowRight size={18}/>
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
                    <button aria-label="Cerrar ficha técnica" onClick={() => setPreviewItem(null)} className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"><X size={20}/></button>
                    <h3 className="text-xl sm:text-2xl pr-10 font-black text-zinc-900 dark:text-white uppercase mb-8">Vista previa de tu diseño</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <TechnicalPreview
                            referenceLabel={productPreviewLabel(products.find(p=>p.id===previewItem.productId),previewItem.colorName,previewItem.customBackgroundImage)}
                            imageScale={previewImageScale(products.find(p=>p.id===previewItem.productId)?.illustrativeImage,previewItem.customBackgroundImage)}
                            inkColor={previewInk(productColorHex(products.find(p=>p.id===previewItem.productId),previewItem.colorName))}
                            font2Css={fonts.find(f=>f.id===previewItem.frontFontId2)?.cssFamily}
                            imageUrl={productPreviewImage(products.find(p => p.id === previewItem.productId),previewItem.colorName,previewItem.customBackgroundImage)}
                            text={previewItem.frontText} text2={previewItem.frontText2}
                            fontName={previewItem.frontFontName} fontId={previewItem.frontFontId} hideElementCounts fontCss={fonts.find(f => f.id === previewItem.frontFontId)?.cssFamily || ''}
                            logos={previewItem.frontLogos}
                            designState={previewItem.frontDesignState} designState2={previewItem.frontDesignState2}
                            sideLabel="LADO A (FRENTE)"
                        />
                        <TechnicalPreview
                            referenceLabel={productPreviewLabel(products.find(p=>p.id===previewItem.productId),previewItem.colorName,previewItem.customBackgroundImage)}
                            imageScale={previewImageScale(products.find(p=>p.id===previewItem.productId)?.illustrativeImage,previewItem.customBackgroundImage)}
                            inkColor={previewInk(productColorHex(products.find(p=>p.id===previewItem.productId),previewItem.colorName))}
                            font2Css={fonts.find(f=>f.id===previewItem.backFontId2)?.cssFamily}
                            imageUrl={productPreviewImage(products.find(p => p.id === previewItem.productId),previewItem.colorName,previewItem.customBackgroundImage)}
                            text={previewItem.backText} text2={previewItem.backText2}
                            fontName={previewItem.backFontName} fontId={previewItem.backFontId} hideElementCounts fontCss={fonts.find(f => f.id === previewItem.backFontId)?.cssFamily || ''}
                            logos={previewItem.backLogos}
                            designState={previewItem.backDesignState} designState2={previewItem.backDesignState2}
                            sideLabel="LADO B (POSTERIOR)"
                        />
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-zinc-500 font-mono">Vista orientativa. El taller confirma los detalles antes de fabricar.</p>
                    </div>
                </div>
            </div>
        )}

        {view === 'ADMIN_DASHBOARD' && user?.role === UserRole.ADMIN && (
          <>{!cloudReady&&<div className="p-4 border-b"><CloudSaveStatus ready={false} dirty={false} saving={false} status={cloudState} onSave={()=>{}} onRetryLoad={()=>setCloudLoadAttempt(n=>n+1)}/></div>}<fieldset disabled={!cloudReady} className={!cloudReady?'pointer-events-none opacity-40':''}><AdminDashboard
            cloudStatus={<CloudSaveStatus ready={cloudReady} dirty={cloudReady && currentSnapshot!==savedSnapshot} saving={saving} status={cloudState} onSave={saveCloud}/>}
            shellActions={[{label:'Ver tienda',onClick:()=>setView('SHOP')},{label:'Vista cliente',onClick:()=>setView('CLIENT_DASHBOARD')},{label:`Carrito (${cart.length})`,onClick:()=>setView('CART')},{label:'Cambiar tema',onClick:()=>setIsDarkMode(!isDarkMode)},{label:'Cerrar sesión',onClick:handleLogout}]} onSaveCloud={saveCloud} customers={customers} orders={orders} products={products} fonts={fonts} pricing={pricing}
            storeConfig={storeConfig}
            user={user} setUser={setUser}
            onUpdatePricing={setPricing} onUpdateStoreConfig={setStoreConfig}
            onUpdateOrder={(updatedOrder) => setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o))}
            onAddOrder={(newOrder) => setOrders([newOrder, ...orders])}
            onUpdateOrderPriority={(id, p) => setOrders(orders.map(o => o.id === id ? {...o, isPriority: p} : o))}
            onAddProduct={p => setProducts([...products, p])}
            onUpdateProduct={p => setProducts(products.map(x => x.id === p.id ? p : x))}
            onDeleteProduct={id => setProducts(products.filter(p => p.id !== id))}
            onAddFont={f => setFonts([...fonts, f])}
            onUpdateFont={(oldId, f) => { setFonts(prev => prev.map(font => font.id === oldId ? f : font)); }}
            onDeleteFont={id => setFonts(fonts.filter(f => f.id !== id))}
            onUpdateClient={updateClientDetails}
            onDeleteClient={deleteClientHistory}
            onResetOrdersAndClients={handleResetOrdersAndClients}
            onResetInventoryCounts={handleResetInventoryCounts}
            onResetProducts={handleResetProducts}
            onOpenAssistant={openAssistant}
            onTabChange={setAdminActiveTab}
          /></fieldset></>
        )}

        {view === 'CLIENT_DASHBOARD' && (user?.role === UserRole.CLIENT || user?.role === UserRole.ADMIN) && (
          <div
            className="fixed inset-0 z-[9999] overflow-auto"
            style={{ backgroundColor: isDarkMode ? '#09090b' : '#ffffff' }}
          >
            {user.isGuest ? <GuestOrderPanel user={user} orders={orders} onContinue={() => setView('SHOP')} /> : <ClientDashboard
              user={user}
              orders={orders}
              storeConfig={storeConfig}
              contentConfig={publicContent}
              coupons={storeConfig.coupons}
              onCreateReferral={handleCreateReferral}
              products={products}
              fonts={fonts}
              isDarkMode={isDarkMode}
              toggleTheme={() => setIsDarkMode(!isDarkMode)}
              onBackToAdmin={user?.role === UserRole.ADMIN ? () => setView('ADMIN_DASHBOARD') : undefined}
              onBackToStore={() => setView('SHOP')}
              onProductSelect={(product) => {
                setSelectedProduct(product);
                setEditingItem(null);
                setView('CUSTOMIZER');
              }}
            />} 
          </div>
        )}

        {linkNotice && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[180] flex items-center gap-3 rounded-xl border border-amber-500 bg-zinc-950 p-3 text-xs text-white" role="status">
            <span>{linkNotice}</span>
            <button onClick={() => setLinkNotice('')} className="underline font-bold">Cerrar</button>
          </div>
        )}

        {/* Login Modal Integration */}
        <AuthModal
            isOpen={isLoginOpen}
            onClose={() => { setIsLoginOpen(false); setAuthInitialView(undefined); }}
            onLogin={handleAuth}
            initialView={authInitialView}
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
            setView('ADMIN_DASHBOARD');
            setAdminActiveTab(tab==='FINANCE'?'DASHBOARD':tab as any);
            setTimeout(()=>window.dispatchEvent(new CustomEvent('adminNavigate',{detail:{tab:tab==='FINANCE'?'DASHBOARD':tab,...opts}})),0);
          }}
        />

      </main>

{/* Notification Panel */}
          <NotificationPanel />

          {/* Context Menu */}
          <ContextMenu />

          {/* Cart Panel */}
          <CartPanel
            cartItems={cart.map(item => ({
              id: item.id,
              productName: item.isClientItem ? itemProductLabel(item) : (products.find(p=>p.id===item.productId)?.name ?? item.productId),
              colorName: itemColorLabel(item),
              quantity: item.quantity,
              price: item.unitPrice,
              imageUrl: productPreviewImage(products.find(p=>p.id===item.productId), item.colorName, item.customBackgroundImage) ?? products.find(p=>p.id===item.productId)?.imageUrl
            }))}
            onUpdateQuantity={(id, qty) => {
              if (qty === 0) {
                setCart(cart.filter(i => i.id !== id));
              } else {
                setCart(cart.map(i => i.id === id ? { ...i, quantity: qty,totalPrice:i.unitPrice*qty } : i));
              }
            }}
            onRemoveItem={(id) => setCart(cart.filter(i => i.id !== id))}
            onCheckout={() => setView('CART')}
            total={cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)}
          />

        </div>
      </ContextMenuProvider>
      </OrderHistoryProvider>
      </BackgroundProvider>
      </CartProvider>
      </NotificationProvider>

  );
};

export default App;

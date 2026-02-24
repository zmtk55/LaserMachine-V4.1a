

export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  GUEST = 'GUEST'
}

export interface PointTransaction {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'ADJUSTMENT';
  amount: number;
  date: string;
  orderId?: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  laserPoints?: number; // Sistema de Lealtad
  pointsHistory?: PointTransaction[]; // Historial de puntos
  phone?: string; // Teléfono para usuarios invitados
  isGuest?: boolean; // Indica si es usuario invitado
}

export enum ProductBrand {
  YETI = 'YETI',
  OWALA = 'OWALA',
  STANLEY = 'STANLEY',
  HYDROFLASK = 'HYDROFLASK',
  GENERIC = 'GENÉRICO',
  OTHER = 'OTRA'
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  imageUrl?: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  brand: ProductBrand;
  category: string;
  price: number;
  stockThreshold: number;
  colors: ProductColor[];
  imageUrl: string;
  laserPresetId?: string;
  sku?: string;
}

export interface PricingConfig {
  baseEngravingPrice: number;
  extraSidePrice: number;
  logoSurcharge: number;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  active: boolean;
  assignedToPhone?: string; 
  referrerUserId?: string; // Nuevo: Vincula el cupón a un cliente (Embajador)
  expiryDate?: string; 
  maxUses?: number; 
  usedCount?: number; 
  createdAt: string;
}

export interface ColorPreset {
  name: string;
  hex: string;
}

export interface MessageTemplates {
  confirmation: string;
  production: string;
  ready: string;
  approvalRequest?: string; // Aprobación de Mockup
}

export interface CustomTemplate {
  id: string;
  name: string;
  text: string;
}

export interface BrandingAsset {
  id: string;
  name: string;
  url: string; // Base64 o URL
  type: 'LOGO' | 'ICON' | 'ILUSTRACION' | 'FORMS' | 'OTHER' | 'CLIPART';
}

export interface StoreConfig {
  businessName: string;
  slogan?: string;       
  logoUrl: string;
  logoFont?: string; // Nombre de tipografía
  customLogoFontData?: string; // Base64 para fuente personalizada del sistema
  bannerUrl?: string;    
  faviconUrl?: string;
  
  // Lógica
  nextOrderId?: number; // Lógica de ID secuencial
  productCategories?: string[]; // Categorías dinámicas
  adminEmails?: string[]; // Acceso admin dinámico
  pointsPercentage?: number; // Porcentaje de compra que se convierte en puntos (0-100)
  pointValue?: number; // Valor de 1 punto en moneda local (MXN)
  
  // Contacto y Redes
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string;
  address?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;

  // Temas
  accentColor: string; 
  themeDarkModeBg: string; 
  bgPattern: 'dots' | 'grid' | 'lines' | 'none';
  
  bankInfo: string;
  shippingInfo: string;
  coupons: Coupon[];
  globalColors: ColorPreset[];
  messageTemplates: MessageTemplates;
  customTemplates?: CustomTemplate[]; 
  brandingAssets: BrandingAsset[]; 
  galleryAssets?: BrandingAsset[]; // Nueva galería de clipart
  
  // Desarrollador / API
  webhookUrl?: string;
  apiKey?: string;
}

export type FontCategory = 'DEPORTE' | 'CURSIVA' | 'FONTS 2026' | 'KIDS' | 'BASICAS';

export interface FontOption {
  id: number;
  name: string;
  cssFamily: string;
  category?: FontCategory; 
  isCustom?: boolean;
  fileData?: string; // Base64 de .ttf/.otf
  active?: boolean; // Nuevo: Control de visibilidad
}

export interface DesignState {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export interface LogoItem {
  id: string;
  url: string;
  originalUrl?: string; // NEW: Holds the raw image without filters
  mimeType?: string;
  state: DesignState;
  isVectorized?: boolean; // Estado de vectorización IA
}

export interface OrderItem {
  id: string;
  productId: string;
  colorName: string;
  // FRENTE
  frontText: string;
  frontText2?: string;
  frontFontId: number;
  frontFontId2?: number; 
  frontFontName: string;
  frontDesignState: DesignState;
  frontDesignState2?: DesignState; 
  frontLogos: LogoItem[];
  // DORSO
  backText: string;
  backText2?: string;
  backFontId: number;
  backFontId2?: number; 
  backFontName?: string;
  backDesignState: DesignState;
  backDesignState2?: DesignState; 
  backLogos: LogoItem[];
  
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  isClientItem?: boolean; 
  clientItemBrand?: string; 
  clientItemColor?: string; 
  customBackgroundImage?: string;
}

export enum OrderStatus {
  RECEIVED = 'RECIBIDO',
  WAITING_APPROVAL = 'ESPERANDO_APROBACIÓN',
  IN_PRODUCTION = 'EN_PRODUCCIÓN',
  READY = 'LISTO',
  COMPLETED = 'ENTREGADO',
  CANCELLED = 'CANCELADO'
}

export enum PaymentStatus {
  PENDING = 'PENDIENTE',
  PARTIAL = 'PARCIAL',
  PAID = 'PAGADO',
  REFUNDED = 'REEMBOLSADO'
}

export enum PaymentMethod {
  CASH = 'EFECTIVO',
  TRANSFER = 'TRANSFERENCIA',
  CARD = 'TARJETA',
  MERCADOPAGO = 'MERCADOPAGO',
  OTHER = 'OTRO'
}

export enum DeliveryMethod {
  PICKUP = 'RECOLECCIÓN_TIENDA',
  SHIPPING = 'ENVÍO_DOMICILIO',
  LOCAL_DELIVERY = 'ENTREGA_LOCAL'
}

export interface OrderEvent {
  timestamp: string;
  status: OrderStatus;
  operator?: string;
  note?: string;
}

export interface OrderInternalNote {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerCompany?: string; 
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  couponUsed?: string;
  discountAmount?: number;
  pointsRedeemed?: number; // Puntos usados
  total: number;
  // Financiero
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  amountPaid: number;
  // Logística
  deliveryMethod?: DeliveryMethod;
  deliveryDate?: string; 
  deliveryTime?: string; 
  shippingProvider?: string;
  shippingTracking?: string;
  shippingAddress?: string;
  // Sistema
  status: OrderStatus;
  isPriority?: boolean;
  history: OrderEvent[];
  createdAt: string;
  mockupUrl?: string; // URL para aprobación visual
  internalNotes?: OrderInternalNote[]; // Notas internas del staff
}

export interface CustomerProfile {
  id?: string;
  phone: string;
  name: string;
  company?: string; 
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastOrderDate: string;
  tags: string[];
}

export type ViewState = 'LANDING' | 'SHOP' | 'CUSTOMIZER' | 'CART' | 'ADMIN_DASHBOARD' | 'CLIENT_DASHBOARD' | 'FONTS_SHOWCASE' | 'PUBLIC_TRACKING' | 'TRACKING';
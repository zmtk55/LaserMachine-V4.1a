
import { FontOption, Product, ProductBrand, Order, OrderStatus, User, UserRole, PaymentStatus, DeliveryMethod, PaymentMethod } from './types';

export const FONTS: FontOption[] = [
  // BASICAS
  { id: 999, name: 'Google Sans Flex', cssFamily: 'font-google', category: 'BASICAS' },
  { id: 101, name: 'Industrial Sans', cssFamily: 'font-industrial', category: 'BASICAS' },
  { id: 105, name: 'Minimal Mono', cssFamily: 'font-mono', category: 'BASICAS' },
  { id: 107, name: 'Classic Typewriter', cssFamily: 'font-mono', category: 'BASICAS' },
  
  // DEPORTE
  { id: 104, name: 'Condensed Impact', cssFamily: 'font-display1', category: 'DEPORTE' },
  { id: 108, name: 'Modern Geometric', cssFamily: 'font-bold1', category: 'DEPORTE' },
  
  // CURSIVA
  { id: 102, name: 'Signature Script', cssFamily: 'font-script1', category: 'CURSIVA' },
  { id: 106, name: 'Elegant Cursive', cssFamily: 'font-script2', category: 'CURSIVA' },
  
  // FONTS 2026
  { id: 103, name: 'Luxury Serif', cssFamily: 'font-serif1', category: 'FONTS 2026' },
  { id: 110, name: 'Technical Slab', cssFamily: 'font-serif1', category: 'FONTS 2026' },
  
  // KIDS
  { id: 109, name: 'Artistic Brush', cssFamily: 'font-script1', category: 'KIDS' },
];

// Product image URLs - Local images from public folder
// YETI Rambler Images
const IMG_YETI_20OZ_COPPER = '/images/products/yeti/YETI_Rambler_20oz_Copper.jpg';
const IMG_YETI_20OZ_GRAPHITE = '/images/products/yeti/YETI_Rambler_20oz_Graphite.jpg';
const IMG_YETI_30OZ_BLACK = '/images/products/yeti/YETI_Rambler_30oz_Black.jpg';
const IMG_YETI_30OZ_NAVY = '/images/products/yeti/YETI_Rambler_30oz_Navy.png';
const IMG_YETI_30OZ_WHITE = '/images/products/yeti/YETI_Rambler_30oz_White.jpg';
const IMG_YETI_30OZ_STEEL = '/images/products/yeti/YETI_Rambler_30oz_Stainless_Steel.jpg';
const IMG_YETI_30OZ_CHARCOAL = '/images/products/yeti/YETI_Rambler_30oz_Charcoal.jpg';
const IMG_YETI_30OZ_GREEN = '/images/products/yeti/YETI_Rambler_30oz_Black_Forest_Green.jpg';
const IMG_YETI_30OZ_TAUPE = '/images/products/yeti/YETI_Rambler_30oz_Taupe.jpg';
const IMG_YETI_30OZ_CAPE_TAUPE = '/images/products/yeti/YETI_Rambler_30oz_Cape_Taupe.jpg';
const IMG_YETI_30OZ_KEY_LIME = '/images/products/yeti/YETI_Rambler_30oz_Key_Lime.jpg';
const IMG_YETI_30OZ_RIDGE = '/images/products/yeti/YETI_Rambler_30oz_Ridgeline.jpg';

// Placeholders for other brands (until we get real images)
const IMG_TUMBLER_BLACK = 'https://placehold.co/400x500/1a1a1a/FFF?text=Tumbler';
const IMG_TUMBLER_WHITE = 'https://placehold.co/400x500/f5f5f5/333?text=Tumbler';
const IMG_TUMBLER_CHARCOAL = 'https://placehold.co/400x500/374151/FFF?text=Charcoal';
const IMG_TUMBLER_CREAM = 'https://placehold.co/400x500/faf9f6/333?text=Stanley';
const IMG_TUMBLER_ROSE = 'https://placehold.co/400x500/fda4af/333?text=Rose+Quartz';
const IMG_TUMBLER_GREY = 'https://placehold.co/400x500/6b7280/FFF?text=Fog+Grey';
const IMG_TUMBLER_TEAL = 'https://placehold.co/400x500/0d9488/FFF?text=Teal';
const IMG_BOTTLE_BLACK = 'https://placehold.co/400x500/1a1a1a/FFF?text=Bottle';
const IMG_BOTTLE_BLUE = 'https://placehold.co/400x500/1e40af/FFF?text=Blue+Bottle';
const IMG_BOTTLE_GREEN = 'https://placehold.co/400x500/3f6212/FFF?text=Green+Bottle';
const IMG_BOTTLE_YELLOW = 'https://placehold.co/400x500/fbbf24/333?text=Yellow';
const IMG_BOTTLE_PINK = 'https://placehold.co/400x500/be185d/FFF?text=Pink';
const IMG_MUG_STONE = 'https://placehold.co/400x400/78716c/FFF?text=Mug';
const IMG_MUG_WHITE = 'https://placehold.co/400x400/fafafa/333?text=White+Mug';
const IMG_MUG_BLACK = 'https://placehold.co/400x400/1a1a1a/FFF?text=Black+Mug';
const IMG_MUG_PINK = 'https://placehold.co/400x400/ec4899/FFF?text=Pink+Mug';
const IMG_SKINNY_BLACK = 'https://placehold.co/400x500/1a1a1a/FFF?text=Skinny';
const IMG_SKINNY_WHITE = 'https://placehold.co/400x500/ffffff/333?text=Skinny';
const IMG_SKINNY_ROSE = 'https://placehold.co/400x500/fb7185/333?text=Rose+Gold';
const IMG_SKINNY_HOLO = 'https://placehold.co/400x500/c084fc/333?text=Holo';
const IMG_WINE_WHITE = 'https://placehold.co/400x400/fafafa/333?text=Wine';
const IMG_WINE_BLACK = 'https://placehold.co/400x400/1a1a1a/FFF?text=Wine';
const IMG_WINE_TEAL = 'https://placehold.co/400x400/14b8a6/FFF?text=Wine';
const IMG_WINE_MINT = 'https://placehold.co/400x400/6ee7b7/333?text=Wine';

export const PRODUCTS: Product[] = [
  // 1. YETI Rambler 20oz - Using real product images
  {
    id: 'p1',
    name: 'Rambler 20oz',
    brand: ProductBrand.YETI,
    category: 'Tumblers',
    price: 850,
    stockThreshold: 10,
    imageUrl: IMG_YETI_20OZ_GRAPHITE,
    colors: [
      { id: 'p1-graphite', name: 'Graphite', hex: '#374151', stock: 20, imageUrl: IMG_YETI_20OZ_GRAPHITE },
      { id: 'p1-copper', name: 'Copper', hex: '#b87333', stock: 15, imageUrl: IMG_YETI_20OZ_COPPER }
    ]
  },
  // 2. YETI Travel Mug 30oz - Using real product images
  {
    id: 'p2',
    name: 'Travel Mug 30oz',
    brand: ProductBrand.YETI,
    category: 'Travel',
    price: 950,
    stockThreshold: 8,
    imageUrl: IMG_YETI_30OZ_BLACK,
    colors: [
      { id: 'p2-black', name: 'Black', hex: '#1a1a1a', stock: 15, imageUrl: IMG_YETI_30OZ_BLACK },
      { id: 'p2-navy', name: 'Navy', hex: '#1e3a5f', stock: 12, imageUrl: IMG_YETI_30OZ_NAVY },
      { id: 'p2-white', name: 'White', hex: '#f5f5f5', stock: 10, imageUrl: IMG_YETI_30OZ_WHITE },
      { id: 'p2-steel', name: 'Stainless', hex: '#9ca3af', stock: 8, imageUrl: IMG_YETI_30OZ_STEEL },
      { id: 'p2-charcoal', name: 'Charcoal', hex: '#4b5563', stock: 10, imageUrl: IMG_YETI_30OZ_CHARCOAL },
      { id: 'p2-forest', name: 'Forest Green', hex: '#1a3d1a', stock: 6, imageUrl: IMG_YETI_30OZ_GREEN },
      { id: 'p2-taupe', name: 'Taupe', hex: '#8b7355', stock: 8, imageUrl: IMG_YETI_30OZ_TAUPE },
      { id: 'p2-cape', name: 'Cape Taupe', hex: '#a08060', stock: 5, imageUrl: IMG_YETI_30OZ_CAPE_TAUPE },
      { id: 'p2-lime', name: 'Key Lime', hex: '#c7d64c', stock: 7, imageUrl: IMG_YETI_30OZ_KEY_LIME },
      { id: 'p2-ridge', name: 'Ridgeline', hex: '#6b8e6b', stock: 4, imageUrl: IMG_YETI_30OZ_RIDGE }
    ]
  },
  // 3. STANLEY Quencher 40oz
  {
    id: 'p3',
    name: 'Quencher H2.0 40oz',
    brand: ProductBrand.STANLEY,
    category: 'Tumblers',
    price: 1200,
    stockThreshold: 5,
    imageUrl: IMG_TUMBLER_CREAM,
    colors: [
      { id: 'p3-cream', name: 'Cream', hex: '#faf9f6', stock: 50, imageUrl: IMG_TUMBLER_CREAM },
      { id: 'p3-rose', name: 'Rose Quartz', hex: '#fda4af', stock: 30, imageUrl: IMG_TUMBLER_ROSE },
      { id: 'p3-fog', name: 'Fog Grey', hex: '#6b7280', stock: 20, imageUrl: IMG_TUMBLER_GREY },
      { id: 'p3-black', name: 'Black', hex: '#1a1a1a', stock: 15, imageUrl: IMG_TUMBLER_BLACK }
    ]
  },
  // 4. STANLEY IceFlow 30oz
  {
    id: 'p4',
    name: 'IceFlow Flip 30oz',
    brand: ProductBrand.STANLEY,
    category: 'Bottles',
    price: 980,
    stockThreshold: 6,
    imageUrl: IMG_TUMBLER_CHARCOAL,
    colors: [
      { id: 'p4-charcoal', name: 'Charcoal', hex: '#374151', stock: 10, imageUrl: IMG_TUMBLER_CHARCOAL },
      { id: 'p4-white', name: 'Polar White', hex: '#f9fafb', stock: 12, imageUrl: IMG_TUMBLER_WHITE },
      { id: 'p4-teal', name: 'Lagoon', hex: '#0d9488', stock: 8, imageUrl: IMG_TUMBLER_TEAL }
    ]
  },
  // 5. HYDROFLASK Wide Mouth 32oz
  {
    id: 'p5',
    name: 'Wide Mouth 32oz',
    brand: ProductBrand.HYDROFLASK,
    category: 'Bottles',
    price: 890,
    stockThreshold: 10,
    imageUrl: IMG_BOTTLE_BLACK,
    colors: [
      { id: 'p5-black', name: 'Black', hex: '#1a1a1a', stock: 25, imageUrl: IMG_BOTTLE_BLACK },
      { id: 'p5-blue', name: 'Pacific', hex: '#1e40af', stock: 15, imageUrl: IMG_BOTTLE_BLUE },
      { id: 'p5-green', name: 'Olive', hex: '#3f6212', stock: 10, imageUrl: IMG_BOTTLE_GREEN },
      { id: 'p5-white', name: 'White', hex: '#f5f5f5', stock: 8, imageUrl: IMG_TUMBLER_WHITE }
    ]
  },
  // 6. HYDROFLASK Coffee Mug 12oz
  {
    id: 'p6',
    name: 'Coffee Mug 12oz',
    brand: ProductBrand.HYDROFLASK,
    category: 'Mugs',
    price: 650,
    stockThreshold: 8,
    imageUrl: IMG_MUG_STONE,
    colors: [
      { id: 'p6-stone', name: 'Stone', hex: '#78716c', stock: 12, imageUrl: IMG_MUG_STONE },
      { id: 'p6-black', name: 'Black', hex: '#1a1a1a', stock: 15, imageUrl: IMG_MUG_BLACK },
      { id: 'p6-pink', name: 'Carnation', hex: '#ec4899', stock: 5, imageUrl: IMG_MUG_PINK }
    ]
  },
  // 7. OWALA FreeSip 24oz
  {
    id: 'p7',
    name: 'FreeSip 24oz',
    brand: ProductBrand.OWALA,
    category: 'Bottles',
    price: 720,
    stockThreshold: 5,
    imageUrl: IMG_BOTTLE_YELLOW,
    colors: [
      { id: 'p7-yellow', name: 'Retro Boardwalk', hex: '#fbbf24', stock: 10, imageUrl: IMG_BOTTLE_YELLOW },
      { id: 'p7-blue', name: 'Denim', hex: '#1e40af', stock: 8, imageUrl: IMG_BOTTLE_BLUE },
      { id: 'p7-pink', name: 'Very Berry', hex: '#be185d', stock: 12, imageUrl: IMG_BOTTLE_PINK }
    ]
  },
  // 8. OWALA FreeSip 32oz
  {
    id: 'p8',
    name: 'FreeSip 32oz',
    brand: ProductBrand.OWALA,
    category: 'Bottles',
    price: 820,
    stockThreshold: 5,
    imageUrl: IMG_BOTTLE_BLACK,
    colors: [
      { id: 'p8-black', name: 'All Black', hex: '#171717', stock: 10, imageUrl: IMG_BOTTLE_BLACK },
      { id: 'p8-white', name: 'Shy Marshmallow', hex: '#fafafa', stock: 10, imageUrl: IMG_TUMBLER_WHITE },
      { id: 'p8-teal', name: 'Teal', hex: '#14b8a6', stock: 5, imageUrl: IMG_TUMBLER_TEAL }
    ]
  },
  // 9. GENERIC Skinny Tumbler 20oz
  {
    id: 'p9',
    name: 'Skinny Tumbler 20oz',
    brand: ProductBrand.GENERIC,
    category: 'Tumblers',
    price: 350,
    stockThreshold: 20,
    imageUrl: IMG_SKINNY_BLACK,
    colors: [
      { id: 'p9-black', name: 'Matte Black', hex: '#1a1a1a', stock: 100, imageUrl: IMG_SKINNY_BLACK },
      { id: 'p9-white', name: 'Glossy White', hex: '#ffffff', stock: 100, imageUrl: IMG_SKINNY_WHITE },
      { id: 'p9-rose', name: 'Rose Gold', hex: '#fb7185', stock: 50, imageUrl: IMG_SKINNY_ROSE },
      { id: 'p9-holo', name: 'Holographic', hex: '#c084fc', stock: 20, imageUrl: IMG_SKINNY_HOLO }
    ]
  },
  // 10. GENERIC Wine Tumbler 12oz
  {
    id: 'p10',
    name: 'Wine Tumbler 12oz',
    brand: ProductBrand.GENERIC,
    category: 'Barware',
    price: 280,
    stockThreshold: 15,
    imageUrl: IMG_WINE_WHITE,
    colors: [
      { id: 'p10-white', name: 'White', hex: '#fafafa', stock: 40, imageUrl: IMG_WINE_WHITE },
      { id: 'p10-black', name: 'Black', hex: '#1a1a1a', stock: 40, imageUrl: IMG_WINE_BLACK },
      { id: 'p10-teal', name: 'Teal', hex: '#14b8a6', stock: 20, imageUrl: IMG_WINE_TEAL },
      { id: 'p10-mint', name: 'Mint', hex: '#6ee7b7', stock: 15, imageUrl: IMG_WINE_MINT }
    ]
  }
];

export const ADMIN_USER: User = {
  id: 'u1',
  name: 'Admin Lasermachine',
  email: 'admin@lasermachine.com',
  role: UserRole.ADMIN,
  avatarUrl: 'https://picsum.photos/100/100'
};

export const MOCK_ORDERS: Order[] = [
  {
    id: 'LM-1001',
    userId: 'u-guest-1',
    customerName: 'Sofia Martinez',
    customerPhone: '5512345678',
    customerEmail: 'sofia@mail.com',
    items: [
      {
        id: 'itm-1',
        productId: 'p3',
        colorName: 'Rose Quartz',
        frontText: 'Sofia',
        frontFontId: 102,
        frontFontName: 'Signature Script',
        frontDesignState: { x: 50, y: 50, scale: 1, rotate: 0 },
        frontLogos: [],
        backText: '',
        backFontId: 999,
        backDesignState: { x: 50, y: 50, scale: 1, rotate: 0 },
        backLogos: [],
        quantity: 1,
        unitPrice: 1300,
        totalPrice: 1300
      }
    ],
    total: 1300,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.TRANSFER,
    status: OrderStatus.COMPLETED,
    history: [
       { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), status: OrderStatus.RECEIVED, operator: 'SYSTEM' },
       { timestamp: new Date(Date.now() - 86400000).toISOString(), status: OrderStatus.READY, operator: 'ADMIN' },
       { timestamp: new Date().toISOString(), status: OrderStatus.COMPLETED, operator: 'ADMIN' }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    amountPaid: 1300,
    deliveryMethod: DeliveryMethod.PICKUP
  },
  {
    id: 'LM-1002',
    userId: 'u-guest-2',
    customerName: 'Carlos Ruiz',
    customerPhone: '8187654321',
    items: [
      {
        id: 'itm-2',
        productId: 'p1',
        colorName: 'Black',
        frontText: 'CR7',
        frontFontId: 104,
        frontFontName: 'Condensed Impact',
        frontDesignState: { x: 50, y: 40, scale: 1.2, rotate: 0 },
        frontLogos: [],
        backText: '',
        backFontId: 999,
        backDesignState: { x: 50, y: 50, scale: 1, rotate: 0 },
        backLogos: [],
        quantity: 2,
        unitPrice: 950,
        totalPrice: 1900
      }
    ],
    total: 1900,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.CASH,
    status: OrderStatus.IN_PRODUCTION,
    history: [
       { timestamp: new Date().toISOString(), status: OrderStatus.RECEIVED, operator: 'SYSTEM' },
       { timestamp: new Date().toISOString(), status: OrderStatus.IN_PRODUCTION, operator: 'ADMIN' }
    ],
    createdAt: new Date().toISOString(),
    amountPaid: 0,
    deliveryMethod: DeliveryMethod.PICKUP
  }
];

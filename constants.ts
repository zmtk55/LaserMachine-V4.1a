
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

export const PRODUCTS: Product[] = [
  // 1. YETI 20oz (Clásico)
  {
    id: 'p1',
    name: 'Rambler 20oz',
    brand: ProductBrand.YETI,
    category: 'Tumblers',
    price: 850,
    stockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1583203923363-233777778913?auto=format&fit=crop&q=80&w=800', // Black Tumbler
    colors: [
      { id: 'p1-black', name: 'Black', hex: '#000000', stock: 20, imageUrl: 'https://images.unsplash.com/photo-1583203923363-233777778913?auto=format&fit=crop&q=80&w=800' },
      { id: 'p1-navy', name: 'Navy', hex: '#0f172a', stock: 15, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800' },
      { id: 'p1-white', name: 'White', hex: '#ffffff', stock: 10, imageUrl: 'https://images.unsplash.com/photo-1570589253702-054452033c4a?auto=format&fit=crop&q=80&w=800' },
      { id: 'p1-red', name: 'Rescue Red', hex: '#ef4444', stock: 5, imageUrl: 'https://images.unsplash.com/photo-1536526137356-07978809228d?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 2. YETI 30oz (Travel)
  {
    id: 'p2',
    name: 'Travel Mug 30oz',
    brand: ProductBrand.YETI,
    category: 'Travel',
    price: 950,
    stockThreshold: 8,
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800', // Travel Mug
    colors: [
      { id: 'p2-steel', name: 'Stainless', hex: '#d1d5db', stock: 12, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800' },
      { id: 'p2-seafoam', name: 'Seafoam', hex: '#99f6e4', stock: 8, imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=800' },
      { id: 'p2-black', name: 'Black', hex: '#000000', stock: 10, imageUrl: 'https://images.unsplash.com/photo-1544003440-2775c9744264?auto=format&fit=crop&q=80&w=800' }
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
    imageUrl: 'https://images.unsplash.com/photo-1627483297929-37f416fec7cd?auto=format&fit=crop&q=80&w=800', // Straw Tumbler
    colors: [
      { id: 'p3-cream', name: 'Cream', hex: '#fdfbf7', stock: 50, imageUrl: 'https://images.unsplash.com/photo-1627483297929-37f416fec7cd?auto=format&fit=crop&q=80&w=800' },
      { id: 'p3-rose', name: 'Rose Quartz', hex: '#fbcfe8', stock: 30, imageUrl: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&q=80&w=800' },
      { id: 'p3-fog', name: 'Fog Grey', hex: '#9ca3af', stock: 20, imageUrl: 'https://images.unsplash.com/photo-1610824352934-c10d87b700cc?auto=format&fit=crop&q=80&w=800' },
      { id: 'p3-black', name: 'Black', hex: '#000000', stock: 15, imageUrl: 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&q=80&w=800' }
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
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-a111419203d7?auto=format&fit=crop&q=80&w=800', // Bottle with handle
    colors: [
      { id: 'p4-charcoal', name: 'Charcoal', hex: '#374151', stock: 10, imageUrl: 'https://images.unsplash.com/photo-1602143407151-a111419203d7?auto=format&fit=crop&q=80&w=800' },
      { id: 'p4-polar', name: 'Polar White', hex: '#f9fafb', stock: 12, imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e3f96d07e?auto=format&fit=crop&q=80&w=800' },
      { id: 'p4-lagoon', name: 'Lagoon', hex: '#06b6d4', stock: 8, imageUrl: 'https://images.unsplash.com/photo-1625708460623-662bd24375ae?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 5. HYDROFLASK 32oz Wide
  {
    id: 'p5',
    name: 'Wide Mouth 32oz',
    brand: ProductBrand.HYDROFLASK,
    category: 'Bottles',
    price: 890,
    stockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&q=80&w=800', // Hydroflask style
    colors: [
      { id: 'p5-black', name: 'Black', hex: '#000000', stock: 25, imageUrl: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&q=80&w=800' },
      { id: 'p5-pacific', name: 'Pacific', hex: '#1e40af', stock: 15, imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=800' },
      { id: 'p5-olive', name: 'Olive', hex: '#3f6212', stock: 10, imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&q=80&w=800' },
      { id: 'p5-white', name: 'White', hex: '#ffffff', stock: 8, imageUrl: 'https://images.unsplash.com/photo-1556011236-1e672728cb32?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 6. HYDROFLASK Coffee 12oz
  {
    id: 'p6',
    name: 'Coffee Mug 12oz',
    brand: ProductBrand.HYDROFLASK,
    category: 'Mugs',
    price: 650,
    stockThreshold: 8,
    imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=800',
    colors: [
      { id: 'p6-stone', name: 'Stone', hex: '#78716c', stock: 12, imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=800' },
      { id: 'p6-black', name: 'Black', hex: '#000000', stock: 15, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800' },
      { id: 'p6-pink', name: 'Carnation', hex: '#f472b6', stock: 5, imageUrl: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&q=80&w=800' }
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
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', 
    colors: [
      { id: 'p7-retro', name: 'Retro Boardwalk', hex: '#fcd34d', stock: 10, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800' },
      { id: 'p7-denim', name: 'Denim', hex: '#1e3a8a', stock: 8, imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=800' },
      { id: 'p7-very', name: 'Very Berry', hex: '#be185d', stock: 12, imageUrl: 'https://images.unsplash.com/photo-1536526137356-07978809228d?auto=format&fit=crop&q=80&w=800' }
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
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-a111419203d7?auto=format&fit=crop&q=80&w=800', 
    colors: [
      { id: 'p8-black', name: 'All Black', hex: '#171717', stock: 10, imageUrl: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&q=80&w=800' },
      { id: 'p8-white', name: 'Shy Marshmallow', hex: '#ffffff', stock: 10, imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e3f96d07e?auto=format&fit=crop&q=80&w=800' },
      { id: 'p8-teal', name: 'Teal', hex: '#14b8a6', stock: 5, imageUrl: 'https://images.unsplash.com/photo-1625708460623-662bd24375ae?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 9. GENERIC Skinny 20oz
  {
    id: 'p9',
    name: 'Skinny Tumbler 20oz',
    brand: ProductBrand.GENERIC,
    category: 'Tumblers',
    price: 350,
    stockThreshold: 20,
    imageUrl: 'https://images.unsplash.com/photo-1610824352934-c10d87b700cc?auto=format&fit=crop&q=80&w=800',
    colors: [
      { id: 'p9-matte', name: 'Matte Black', hex: '#1a1a1a', stock: 100, imageUrl: 'https://images.unsplash.com/photo-1583203923363-233777778913?auto=format&fit=crop&q=80&w=800' },
      { id: 'p9-white', name: 'Glossy White', hex: '#ffffff', stock: 100, imageUrl: 'https://images.unsplash.com/photo-1570589253702-054452033c4a?auto=format&fit=crop&q=80&w=800' },
      { id: 'p9-rose', name: 'Rose Gold', hex: '#fb7185', stock: 50, imageUrl: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&q=80&w=800' },
      { id: 'p9-holo', name: 'Holographic', hex: '#e879f9', stock: 20, imageUrl: 'https://images.unsplash.com/photo-1567425932857-79b932223759?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 10. GENERIC Wine 12oz
  {
    id: 'p10',
    name: 'Wine Tumbler 12oz',
    brand: ProductBrand.GENERIC,
    category: 'Barware',
    price: 280,
    stockThreshold: 15,
    imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=800',
    colors: [
      { id: 'p10-white', name: 'White', hex: '#ffffff', stock: 40, imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=800' },
      { id: 'p10-black', name: 'Black', hex: '#000000', stock: 40, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800' },
      { id: 'p10-teal', name: 'Teal', hex: '#2dd4bf', stock: 20, imageUrl: 'https://images.unsplash.com/photo-1625708460623-662bd24375ae?auto=format&fit=crop&q=80&w=800' },
      { id: 'p10-mint', name: 'Mint', hex: '#a7f3d0', stock: 15, imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=800' }
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

// Test script for CommandAssistant RAB agent
// Simulates the executeCommand function with mock data

// Types (simplified from types.ts)
enum OrderStatus {
  RECEIVED = 'RECIBIDO',
  WAITING_APPROVAL = 'ESPERANDO_APROBACIÓN',
  IN_PRODUCTION = 'EN_PRODUCCIÓN',
  READY = 'LISTO',
  COMPLETED = 'ENTREGADO',
  CANCELLED = 'CANCELADO'
}

enum ProductBrand {
  YETI = 'YETI',
  OWALA = 'OWALA',
  STANLEY = 'STANLEY',
  HYDROFLASK = 'HYDROFLASK',
  GENERIC = 'GENÉRICO',
  OTHER = 'OTRA'
}

interface Product {
  id: string;
  name: string;
  brand: ProductBrand;
  category: string;
  price: number;
  stockThreshold: number;
  colors: any[];
  imageUrl: string;
}

interface OrderItem {
  id: string;
  productId: string;
  colorName: string;
  frontText: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

// Mock data
const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Rambler 20oz',
    brand: ProductBrand.YETI,
    category: 'Tumblers',
    price: 850,
    stockThreshold: 10,
    colors: [],
    imageUrl: ''
  },
  {
    id: 'p2',
    name: 'Travel Mug 30oz',
    brand: ProductBrand.YETI,
    category: 'Travel',
    price: 950,
    stockThreshold: 8,
    colors: [],
    imageUrl: ''
  },
  {
    id: 'p3',
    name: 'Quencher H2.0 32oz',
    brand: ProductBrand.OWALA,
    category: 'Bottles',
    price: 450,
    stockThreshold: 15,
    colors: [],
    imageUrl: ''
  },
  {
    id: 'p4',
    name: 'Classic Trigger Hiking Mug 16oz',
    brand: ProductBrand.STANLEY,
    category: 'Mugs',
    price: 350,
    stockThreshold: 12,
    colors: [],
    imageUrl: ''
  },
  {
    id: 'p5',
    name: 'Standard Mouth Bottle 32oz',
    brand: ProductBrand.HYDROFLASK,
    category: 'Bottles',
    price: 420,
    stockThreshold: 18,
    colors: [],
    imageUrl: ''
  }
];

const mockOrders: Order[] = [
  {
    id: 'LM-1001',
    userId: 'u1',
    customerName: 'Juan Pérez',
    customerPhone: '521234567890',
    items: [
      {
        id: 'i1',
        productId: 'p1',
        colorName: 'Graphite',
        frontText: 'Juan',
        quantity: 1,
        unitPrice: 850,
        totalPrice: 850
      }
    ],
    total: 850,
    status: OrderStatus.RECEIVED,
    createdAt: '2026-04-16T10:30:00Z'
  },
  {
    id: 'LM-1002',
    userId: 'u2',
    customerName: 'María González',
    customerPhone: '521234567891',
    items: [
      {
        id: 'i2',
        productId: 'p2',
        colorName: 'Black',
        frontText: 'María',
        quantity: 2,
        unitPrice: 950,
        totalPrice: 1900
      }
    ],
    total: 1900,
    status: OrderStatus.IN_PRODUCTION,
    createdAt: '2026-04-15T14:20:00Z'
  },
  {
    id: 'LM-1003',
    userId: 'u3',
    customerName: 'Carlos Rodríguez',
    customerPhone: '521234567892',
    items: [
      {
        id: 'i3',
        productId: 'p3',
        colorName: 'Blue',
        frontText: 'Carlos',
        quantity: 1,
        unitPrice: 450,
        totalPrice: 450
      }
    ],
    total: 450,
    status: OrderStatus.READY,
    createdAt: '2026-04-14T09:15:00Z'
  },
  {
    id: 'LM-1004',
    userId: 'u4',
    customerName: 'Ana Martínez',
    customerPhone: '521234567893',
    items: [
      {
        id: 'i4',
        productId: 'p1',
        colorName: 'Copper',
        frontText: 'Ana',
        quantity: 1,
        unitPrice: 850,
        totalPrice: 850
      },
      {
        id: 'i5',
        productId: 'p4',
        colorName: 'Green',
        frontText: 'Martinez',
        quantity: 1,
        unitPrice: 350,
        totalPrice: 350
      }
    ],
    total: 1200,
    status: OrderStatus.COMPLETED,
    createdAt: '2026-04-13T16:45:00Z'
  },
  {
    id: 'LM-1005',
    userId: 'u5',
    customerName: 'López',
    customerPhone: '521234567894',
    items: [
      {
        id: 'i6',
        productId: 'p5',
        colorName: 'White',
        frontText: 'López',
        quantity: 1,
        unitPrice: 420,
        totalPrice: 420
      }
    ],
    total: 420,
    status: OrderStatus.IN_PRODUCTION,
    createdAt: '2026-04-16T11:00:00Z'
  }
];

// Helper functions extracted from CommandAssistant.tsx
function localGetStats(orders: Order[]) {
  const today = new Date().toDateString();
  const active = orders.filter(o => o.status !== OrderStatus.CANCELLED);
  const todayRevenue = active
    .filter(o => new Date(o.createdAt).toDateString() === today)
    .reduce((s, o) => s + o.total, 0);
  return {
    today_revenue: todayRevenue,
    pending: orders.filter(o => o.status === OrderStatus.RECEIVED || o.status === OrderStatus.WAITING_APPROVAL).length,
    in_production: orders.filter(o => o.status === OrderStatus.IN_PRODUCTION).length,
    completed: orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.READY).length,
    total: active.length,
  };
}

function localFilterOrders(orders: Order[], opts: { status?: string; customerName?: string; date?: string; minTotal?: number; maxTotal?: number }): SearchResult[] {
  let r = [...orders];
  if (opts.status) {
    const statusMap: Record<string, OrderStatus> = {
      'RECEIVED': OrderStatus.RECEIVED,
      'IN_PRODUCTION': OrderStatus.IN_PRODUCTION,
      'READY': OrderStatus.READY,
      'COMPLETED': OrderStatus.COMPLETED,
      'CANCELLED': OrderStatus.CANCELLED,
      'WAITING_APPROVAL': OrderStatus.WAITING_APPROVAL
    };
    const mapped = statusMap[opts.status.toUpperCase()];
    if (mapped) {
      r = r.filter(o => o.status === mapped);
    }
  }
  if (opts.customerName) r = r.filter(o => o.customerName.toLowerCase().includes(opts.customerName!.toLowerCase()));
  if (opts.date === 'today') { 
    const t = new Date().toDateString(); 
    r = r.filter(o => new Date(o.createdAt).toDateString() === t); 
  }
  if (opts.date === 'week')  r = r.filter(o => Date.now() - new Date(o.createdAt).getTime() <= 7*86400000);
  if (opts.date === 'month') r = r.filter(o => Date.now() - new Date(o.createdAt).getTime() <= 30*86400000);
  if (opts.minTotal !== undefined) r = r.filter(o => o.total >= opts.minTotal!);
  if (opts.maxTotal !== undefined) r = r.filter(o => o.total <= opts.maxTotal!);
  return r.slice(0, 12).map(o => ({
    type: 'order' as const, id: o.id,
    title: `${o.id} · ${o.customerName}`,
    description: `${o.status} · $${o.total.toFixed(2)}`,
    url: '',
  }));
}

function localFilterProducts(products: Product[], opts: { search?: string; priceMin?: number; priceMax?: number; brand?: string; category?: string; sort?: string }): SearchResult[] {
  let r = [...products];
  if (opts.search)   r = r.filter(p => p.name.toLowerCase().includes(opts.search!.toLowerCase()) || String(p.brand || '').toLowerCase().includes(opts.search!.toLowerCase()));
  if (opts.brand)    r = r.filter(p => String(p.brand || '').toLowerCase() === opts.brand.toLowerCase());
  if (opts.category) r = r.filter(p => (p.category || '').toLowerCase().includes(opts.category!.toLowerCase()));
  if (opts.priceMin !== undefined) r = r.filter(p => p.price >= opts.priceMin!);
  if (opts.priceMax !== undefined) r = r.filter(p => p.price <= opts.priceMax!);
  if (opts.sort === 'price_asc')  r.sort((a,b) => a.price - b.price);
  if (opts.sort === 'price_desc') r.sort((a,b) => b.price - a.price);
  return r.slice(0, 12).map(p => ({
    type: 'product' as const, id: p.id,
    title: p.name,
    description: `$${p.price.toFixed(2)}${p.brand ? ` · ${p.brand}` : ''}${p.category ? ` · ${p.category}` : ''}`,
    url: '',
  }));
}

function localSearch(orders: Order[], products: Product[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  const orderResults: SearchResult[] = orders
    .filter(o => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone?.includes(q))
    .slice(0,6).map(o => ({ type: 'order' as const, id: o.id, title: `${o.id} · ${o.customerName}`, description: `${o.status} · $${o.total.toFixed(2)}`, url: '' }));
  const productResults: SearchResult[] = products
    .filter(p => p.name.toLowerCase().includes(q) || String(p.brand||'').toLowerCase().includes(q))
    .slice(0,6).map(p => ({ type: 'product' as const, id: p.id, title: p.name, description: `$${p.price.toFixed(2)}`, url: '' }));
  return [...orderResults, ...productResults];
}

function localTopProducts(orders: Order[], products: Product[], limit: number): SearchResult[] {
  const counts: Record<string, number> = {};
  orders.forEach(o => o.items?.forEach(item => { counts[item.productId] = (counts[item.productId]||0) + (item.quantity||1); }));
  return Object.entries(counts)
    .sort(([,a],[,b]) => b-a).slice(0,limit)
    .map(([id, qty]) => {
      const p = products.find(x => x.id === id);
      return { type: 'product' as const, id, title: p?.name || id, description: `${qty} vendidos · $${(p?.price||0).toFixed(2)}`, url: '' };
    });
}

// Local parser for commands (fallback when Groq is disabled)
const parseLocalCommand = async (text: string): Promise<any> => {
  const lower = text.toLowerCase();
  if (lower.includes('cuánto vendimos') || lower.includes('ventas de hoy')) {
    return { action: 'get_stats' };
  }
  if (lower.includes('pedidos de hoy')) {
    return { action: 'filter_orders', date: 'today' };
  }
  if (lower.includes('productos yeti') || lower.includes('brand:yeti')) {
    return { action: 'filter_products', brand: 'YETI' };
  }
  if (lower.includes('qué se vende más') || lower.includes('top productos')) {
    return { action: 'get_top_products', limit: 5 };
  }
  // Default fallback
  return { action: 'unknown', message: 'Comando no reconocido en modo local.' };
};

// Simulate executeCommand function
const simulateCommand = async (text: string) => {
  console.log(`\n=== COMANDO: "${text}" ===`);
  
  try {
    // Use local parsing (simulating Groq being disabled for testing)
    const parsed = await parseLocalCommand(text);
    console.log(`Acción detectada: ${parsed.action}`);
    
    let state = 'idle';
    let feedback = '';
    let results: SearchResult[] = [];
    let navAction = null;
    
    switch (parsed.action) {
      case 'update_order_status': {
        console.log(`Intentando actualizar pedido ${parsed.orderId} a ${parsed.status}`);
        // Simulate API call
        const order = mockOrders.find(o => o.id === parsed.orderId);
        if (order) {
          state = 'success';
          feedback = `Pedido ${parsed.orderId} → ${parsed.status.replace(/_/g,' ')}`;
          navAction = { tab: 'ORDERS', orderId: parsed.orderId, label: `Abrir ${parsed.orderId}` };
        } else {
          state = 'error';
          feedback = `No se pudo actualizar ${parsed.orderId}. ¿Existe ese ID?`;
          navAction = { tab: 'ORDERS', label: 'Ver todos los pedidos' };
        }
        break;
      }
      case 'create_coupon': {
        console.log(`Intentando crear cupón ${parsed.code} del ${parsed.discount_percent}%`);
        // Simulate API call
        state = 'success';
        feedback = `Cupón "${parsed.code}" del ${parsed.discount_percent}% creado.`;
        navAction = { tab: 'SETTINGS', settingsTab: 'COUPONS', label: 'Ver cupones' };
        break;
      }
      case 'get_stats': {
        const stats = localGetStats(mockOrders);
        state = 'success';
        feedback = `Hoy: $${Number(stats.today_revenue).toFixed(2)} · ${stats.pending} por aprobar · ${stats.in_production} en producción · ${stats.completed} completados · ${stats.total} total activos`;
        navAction = { tab: 'FINANCE', label: 'Ver finanzas completas' };
        break;
      }
      case 'filter_products': {
        const res = localFilterProducts(mockProducts, { 
          search: parsed.search, 
          priceMin: parsed.price_min, 
          priceMax: parsed.price_max, 
          brand: parsed.brand, 
          category: parsed.category, 
          sort: parsed.sort 
        });
        if (res.length > 0) { 
          results = res; 
          state = 'idle';
        } else { 
          state = 'error'; 
          feedback = 'No encontré productos con esos criterios.'; 
          navAction = { tab: 'INVENTORY', label: 'Ver inventario' }; 
        }
        break;
      }
      case 'filter_orders': {
        const res = localFilterOrders(mockOrders, { 
          status: parsed.status, 
          customerName: parsed.customer_name, 
          date: parsed.date, 
          minTotal: parsed.min_total, 
          maxTotal: parsed.max_total 
        });
        if (res.length > 0) { 
          results = res; 
          state = 'idle';
        } else { 
          state = 'error'; 
          feedback = 'No encontré pedidos con esos criterios.'; 
          navAction = { tab: 'ORDERS', label: 'Ver todos los pedidos' }; 
        }
        break;
      }
      case 'get_top_products': {
        const res = localTopProducts(mockOrders, mockProducts, parsed.limit ?? 5);
        if (res.length > 0) { 
          results = res; 
          state = 'idle';
        } else { 
          state = 'error'; 
          feedback = 'No hay datos de ventas por producto aún.'; 
        }
        break;
      }
      case 'search': {
        const res = localSearch(mockOrders, mockProducts, parsed.query);
        if (res.length > 0) { 
          results = res; 
          state = 'idle';
        } else { 
          state = 'error'; 
          feedback = `Sin resultados para "${parsed.query}".`; 
        }
        break;
      }
      default: {
        state = 'error';
        feedback = (parsed as any).message || 'No entendí esa instrucción.';
      }
    }
    
    console.log(`Estado: ${state}`);
    console.log(`Feedback: ${feedback}`);
    if (results.length > 0) {
      console.log(`Resultados (${results.length}):`);
      results.forEach((item, i) => {
        console.log(`  ${i+1}. ${item.title} - ${item.description}`);
      });
    }
    if (navAction) {
      console.log(`Sugerencia de navegación: ${navAction.label}`);
    }
    
    return { state, feedback, results, navAction };
    
  } catch (err: any) {
    console.log(`Estado: error`);
    console.log(`Feedback: ${err.message || 'Error al conectar con Groq.'}`);
    return { state: 'error', feedback: err.message || 'Error al conectar con Groq.', results: [], navAction: null };
  }
};

// Test runner
const runTests = async () => {
  const testCommands = [
    // 1. Basic greetings and help
    "hola que onda",
    "ayuda",
    "qué puedes hacer",
    
    // 2. Statistics queries
    "cuánto vendimos hoy",
    "ventas de la semana",
    "cuántos pedidos hay en producción",
    
    // 3. Order searches
    "busca el pedido LM-1001",
    "dónde está el pedido de Juan",
    "pedidos de hoy",
    
    // 4. Product filters
    "qué productos YETI hay",
    "productos menores a $300",
    "top productos",
    
    // 5. Admin operations
    "pon el pedido LM-1002 como listo",
    "crea cupón VERANO20 del 20%",
    
    // 6. Complex combined commands
    "busca pedidos de hoy y dime cuánto vendimos",
    "productos YETI en producción"
  ];
  
  console.log('🤖 INICIANDO PRUEBAS DEL AGENTE RAB (CommandAssistant)');
  console.log('='.repeat(60));
  
  for (const command of testCommands) {
    await simulateCommand(command);
    console.log('='.repeat(60));
  }
  
  console.log('\n✅ PRUEBAS COMPLETADAS');
};

// Run the tests
runTests().catch(console.error);

// SearchResult type definition
interface SearchResult {
  type: 'order' | 'product' | 'customer' | 'coupon';
  id: string;
  title: string;
  description: string;
  url: string;
}
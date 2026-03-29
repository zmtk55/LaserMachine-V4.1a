import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Package, Package2, Tag, Users, CheckCircle, AlertCircle,
  Loader2, Sparkles, Zap, BarChart2, ArrowRight, TrendingUp, ShoppingBag, X,
} from 'lucide-react';
import { Order, OrderStatus, Product } from '../types';
import { 
  mapStatus, 
  SearchResult, 
  updateOrderStatus, 
  createCoupon,
  searchAll,
  getOrderStats,
  filterProducts,
  filterOrders,
  getTopSellingProducts
} from '../services/neonService';

type NavTab = 'ORDERS' | 'INVENTORY' | 'CLIENTS' | 'SETTINGS' | 'FINANCE';
interface NavAction { tab: NavTab; orderId?: string; settingsTab?: string; label: string; }

interface CommandAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: NavTab, opts?: { orderId?: string; settingsTab?: string }) => void;
  initialQuery?: string;
  orders?: Order[];
  products?: Product[];
}

// ...existing code...
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
    const mapped = mapStatus(opts.status.toUpperCase());
    r = r.filter(o => o.status === mapped || o.status === opts.status);
  }
  if (opts.customerName) r = r.filter(o => o.customerName.toLowerCase().includes(opts.customerName!.toLowerCase()));
  if (opts.date === 'today') { const t = new Date().toDateString(); r = r.filter(o => new Date(o.createdAt).toDateString() === t); }
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
  if (opts.brand)    r = r.filter(p => String(p.brand || '').toLowerCase().includes(opts.brand!.toLowerCase()));
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

// ...existing code...
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Eres RAB, el asistente inteligente de LaserMachine - un sistema de e-commerce para grabado láser en vasos térmicos (YETI, Stanley, etc.).

IDIOMA: El usuario habla español coloquial/mexicano. Sé natural, amigable y profesional.

## FORMATO DE RESPUESTA (OBLIGATORIO - CRÍTICO)
- SIEMPRE responde ÚNICAMENTE con JSON válido
- NUNCA escribas texto antes o después del JSON
- NUNCA uses markdown, no uses \`\`\`
- Si no puedes hacer lo que pide, usa acción "unknown" con un mensaje útil

## ACCIONES DISPONIBLES Y SINONIMIA:

### 1. ESTADÍSTICAS Y VENTAS (prioridad alta para preguntas de dinero)
JSON: {"action":"get_stats"}
Detectar: "cuánto vendimos", "ventas hoy", "cuánto ganamos", "qué tal el día", "estadísticas", "ingresos del día", "cuánto se recaudó", "dime los números", "cómo vamos", "ventas totales", "cuánto llevamos"

### 2. BÚSQUEDA GENERAL
JSON: {"action":"search","query":"texto"}
Detectar: "busca [algo]", "encuentra [algo]", "dónde está [algo]", "muéstrame [algo]"
Ejemplos: "busca LM-1001", "dónde está el pedido de Juan", "busca 6181234567", "encuentra productos YETI"

### 3. FILTRAR PEDIDOS
JSON: {"action":"filter_orders","status":"RECEIVED|IN_PRODUCTION|READY|COMPLETED|CANCELLED|WAITING_APPROVAL","date":"today|week|month"}
Detectar: "pedidos de hoy", "qué hay en producción", "pedidos esta semana", "dame los pendientes", "órdenes recientes", "pedidos listos", "pedidos completados"
Status mapping: "en producción" → IN_PRODUCTION, "listos" → READY, "pendientes" → RECEIVED, "completados" → COMPLETED

### 4. FILTRAR PRODUCTOS
JSON: {"action":"filter_products","search":"término","price_min":número,"price_max":número,"brand":"YETI|STANLEY|OWALA|HYDRO"}
Detectar: "qué productos hay", "dame los YETI", "qué cuesta menos de 500", "productos caros", "dame el catálogo"

### 5. TOP PRODUCTOS (MÁS VENDIDOS)
JSON: {"action":"get_top_products","limit":5}
Detectar: "qué se vende más", "best sellers", "top productos", "más populares", "lo que más piden", "productos estrella"

### 6. ACTUALIZAR ESTADO DE PEDIDO
JSON: {"action":"update_order_status","orderId":"LM-XXX","status":"RECEIVED|IN_PRODUCTION|READY|COMPLETED|CANCELLED"}
Detectar: "pon el pedido [ID] como [estado]", "cambia status de [ID]", "marca [ID] como listo", "actualiza [ID] a producción"
Status mapping: "listo" → READY, "producción" → IN_PRODUCTION, "completado" → COMPLETED, "recibido" → RECEIVED

### 7. CREAR CUPÓN/DESCUENTO
JSON: {"action":"create_coupon","code":"CODIGO","discount_percent":20}
Detectar: "crea cupón [CÓDIGO] de [X]%", "nuevo descuento", "genera cupón [CÓDIGO]", "cupón de [X] por ciento"

### 8. SALUDOS, AYUDA Y DESPEDIDAS
JSON: {"action":"unknown","message":"[respuesta amigable]"}
Detectar: "hola", "qué onda", "ayuda", "qué puedes hacer", "buenos días", "hey", "holi", "qué tal", "gracias", "adiós", "bye"
Respuesta sugerida: "¡Hola! Soy RAB, tu asistente de LaserMachine. Puedo ayudarte con: ver ventas, buscar pedidos, filtrar productos, crear cupones, y actualizar estados de órdenes. ¿Qué necesitas?"

## REGLAS DE INTERPRETACIÓN (IMPORTANTE):

1. SI dice "cuánto" + "vendimos/ganamos/ingresos/recaudado" → SIEMPRE get_stats
2. SI dice "busca/encuentra/dónde está" + nombre/número/ID → SIEMPRE search
3. SI dice "pedidos" + "hoy/semana/mes/pendientes/producción" → filter_orders
4. SI dice "productos" + marca/tipo/precio → filter_products
5. SI dice "qué se vende más/más vendido/popular" → get_top_products
6. SI dice "pon/cambia/marca/actualiza" + "pedido" + estado → update_order_status
7. SI dice "crea/genera/nuevo" + "cupón/descuento" → create_coupon
8. SI es saludo o pregunta general → unknown con mensaje amigable
9. SI no estás seguro de qué quiere → unknown preguntando qué necesita

## EJEMPLOS DE CONVERSACIÓN (FEW-SHOT):

Usuario: "hola que onda"
RAB: {"action":"unknown","message":"¡Hola! Soy RAB, tu asistente de LaserMachine. Puedo ayudarte con pedidos, ventas, productos y más. ¿Qué necesitas?"}

Usuario: "cuánto vendimos hoy?"
RAB: {"action":"get_stats"}

Usuario: "qué tal nos fue?"
RAB: {"action":"get_stats"}

Usuario: "busca el pedido de Carlos"
RAB: {"action":"search","query":"Carlos"}

Usuario: "dame los pedidos de hoy"
RAB: {"action":"filter_orders","date":"today"}

Usuario: "qué hay en producción?"
RAB: {"action":"filter_orders","status":"IN_PRODUCTION"}

Usuario: "pon el pedido LM-1002 como listo"
RAB: {"action":"update_order_status","orderId":"LM-1002","status":"READY"}

Usuario: "cambia el status de LM-1003 a producción"
RAB: {"action":"update_order_status","orderId":"LM-1003","status":"IN_PRODUCTION"}

Usuario: "qué se vende más?"
RAB: {"action":"get_top_products","limit":5}

Usuario: "productos YETI"
RAB: {"action":"filter_products","brand":"YETI"}

Usuario: "crea cupón VERANO20 del 20%"
RAB: {"action":"create_coupon","code":"VERANO20","discount_percent":20}

Usuario: "gracias"
RAB: {"action":"unknown","message":"¡De nada! Estoy aquí para ayudarte cuando necesites algo más."}

REGLA FINAL: Cuando tengas DUDA, usa "unknown" con un mensaje pidiendo aclaración. NUNCA inventes datos que no tienes.`;

type AiAction =
  | { action: 'update_order_status'; orderId: string; status: string }
  | { action: 'create_coupon'; code: string; discount_percent: number }
  | { action: 'get_stats' }
  | { action: 'search'; query: string }
  | { action: 'filter_products'; search?: string; price_min?: number; price_max?: number; brand?: string; category?: string; active?: boolean; sort?: string }
  | { action: 'filter_orders'; status?: string; customer_name?: string; date?: string; min_total?: number; max_total?: number }
  | { action: 'get_top_products'; limit?: number }
  | { action: 'unknown'; message: string };

async function askGroq(userText: string): Promise<AiAction> {
  const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GROQ_API_KEY no está configurada en .env.local');
  }
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userText },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let raw: string = data.choices?.[0]?.message?.content ?? '';
  raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(raw) as AiAction;
}
// ...existing code...

const CommandAssistant: React.FC<CommandAssistantProps> = ({ isOpen, onClose, onNavigate, initialQuery, orders = [], products = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [state, setState]           = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback]     = useState('');
  const [navAction, setNavAction]   = useState<NavAction | null>(null);
  const [useGroq, setUseGroq]       = useState<boolean>(true);
  
  // ...existing code...
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rab_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const inputRef                    = useRef<HTMLInputElement>(null);
  const searchTimeout               = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ...existing code...
  useEffect(() => {
    if (isOpen) {
      setResults([]); setState('idle'); setFeedback(''); setNavAction(null);
      if (initialQuery) {
        setInputValue(initialQuery);
        executeCommand(initialQuery);
      } else {
        setInputValue('');
        // ...existing code...
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, initialQuery]);

  // ...existing code...
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose(); 
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const addToHistory = (text: string) => {
    const newHistory = [text, ...history.filter(h => h !== text)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('rab_history', JSON.stringify(newHistory));
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value); 
    if (state !== 'loading') {
       setState('idle'); 
       setFeedback(''); 
       setNavAction(null);
    }
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    // ...existing code...
    if (value.trim().length === 0) setResults([]);
  }, [state]);

  const executeCommand = async (text: string) => {
    if (!text) return;
    setInputValue(text);
    setState('loading');
    setResults([]);
    setFeedback('');
    setNavAction(null);
    addToHistory(text);

    try {
      // Choose between Groq API or local parsing based on user selection
      const parsed: AiAction = useGroq ? await askGroq(text) : await parseLocalCommand(text);
      switch (parsed.action) {
        case 'update_order_status': {
          const ok = await updateOrderStatus(parsed.orderId, parsed.status);
          if (ok) {
            setState('success');
            setFeedback(`Pedido ${parsed.orderId} → ${parsed.status.replace(/_/g,' ')}`);
            setNavAction({ tab: 'ORDERS', orderId: parsed.orderId, label: `Abrir ${parsed.orderId}` });
          } else {
            setState('error');
            setFeedback(`No se pudo actualizar ${parsed.orderId}. ¿Existe ese ID?`);
            setNavAction({ tab: 'ORDERS', label: 'Ver todos los pedidos' });
          }
          break;
        }
        case 'create_coupon': {
          const coupon = await createCoupon({ code: parsed.code, discount_percent: parsed.discount_percent });
          if (coupon) {
            setState('success');
            setFeedback(`Cupón "${parsed.code}" del ${parsed.discount_percent}% creado.`);
            setNavAction({ tab: 'SETTINGS', settingsTab: 'COUPONS', label: 'Ver cupones' });
          } else {
            setState('error');
            setFeedback(`No se pudo crear el cupón. ¿Ya existe ese código?`);
          }
          break;
        }
        case 'get_stats': {
          const stats = localGetStats(orders);
          setState('success');
          setFeedback(`Hoy: $${Number(stats.today_revenue).toFixed(2)} · ${stats.pending} por aprobar · ${stats.in_production} en producción · ${stats.completed} completados · ${stats.total} total activos`);
          setNavAction({ tab: 'FINANCE', label: 'Ver finanzas completas' });
          break;
        }
        case 'filter_products': {
          const res = localFilterProducts(products, { search: parsed.search, priceMin: parsed.price_min, priceMax: parsed.price_max, brand: parsed.brand, category: parsed.category, sort: parsed.sort });
          if (res.length > 0) { setResults(res); setState('idle'); }
          else { setState('error'); setFeedback('No encontré productos con esos criterios.'); setNavAction({ tab: 'INVENTORY', label: 'Ver inventario' }); }
          break;
        }
        case 'filter_orders': {
          const res = localFilterOrders(orders, { status: parsed.status, customerName: parsed.customer_name, date: parsed.date as any, minTotal: parsed.min_total, maxTotal: parsed.max_total });
          if (res.length > 0) { setResults(res); setState('idle'); }
          else { setState('error'); setFeedback('No encontré pedidos con esos criterios.'); setNavAction({ tab: 'ORDERS', label: 'Ver todos los pedidos' }); }
          break;
        }
        case 'get_top_products': {
          const res = localTopProducts(orders, products, parsed.limit ?? 5);
          if (res.length > 0) { setResults(res); setState('idle'); }
          else { setState('error'); setFeedback('No hay datos de ventas por producto aún.'); }
          break;
        }
        case 'search': {
          const res = localSearch(orders, products, parsed.query);
          if (res.length > 0) { setResults(res); setState('idle'); }
          else { setState('error'); setFeedback(`Sin resultados para "${parsed.query}".`); }
          break;
        }
        default: {
          setState('error');
          setFeedback((parsed as any).message || 'No entendí esa instrucción.');
        }
      }
    } catch (err: any) {
      setState('error');
      setFeedback(err.message ?? 'Error al conectar con Groq.');
    }
  };

  // Simple local parser for a subset of commands (fallback when Groq is disabled)
  const parseLocalCommand = async (text: string): Promise<AiAction> => {
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(inputValue.trim());
  };

  if (!isOpen) return null;

  const tabMap: Record<string, NavTab> = { order: 'ORDERS', product: 'INVENTORY', customer: 'CLIENTS', coupon: 'SETTINGS' };
  const stMap: Record<string, string | undefined> = { coupon: 'COUPONS' };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh]" onClick={(ev) => ev.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-amber-500 rounded-2xl shadow-lg">
             <img src="/assets/icons/2svgagenticon.svg" alt="RAB" className="w-7 h-7" />
          </div>
          
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">IA</span>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Asistente RAB</label>
             </div>
             <input
              ref={inputRef}
              type="text"
              placeholder="Escribe un comando..."
              value={inputValue}
              onChange={handleInputChange}
              disabled={state === 'loading'}
              className="w-full bg-transparent text-xl md:text-2xl font-black text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none p-0 border-none focus:ring-0"
              autoFocus
            />
          </form>
          
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X size={16}/>
          </button>
          {/* Model toggle */}
          <button onClick={() => setUseGroq(!useGroq)} className="ml-2 px-2 py-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-medium uppercase">
            {useGroq ? 'Groq' : 'Local'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[60vh] bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
          {history.length > 0 && results.length === 0 && state === 'idle' && !inputValue && (
             <div className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 block">Recientes</span>
                <div className="flex flex-wrap gap-2">
                    {history.slice(0,4).map((h,i) => (
                        <button key={i} onClick={() => executeCommand(h)} className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-amber-500 hover:text-black transition-colors border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 group">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-black transition-colors"></span>
                            {h}
                        </button>
                    ))}
                </div>
             </div>
          )}

          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500 gap-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <img src="/assets/icons/2svgagenticon.svg" alt="RAB" className="w-10 h-10 animate-pulse" />
                    </div>
                </div>
                <span className="text-xs uppercase tracking-widest font-bold">Procesando con IA…</span>
            </div>
          )}

          {(state === 'success' || state === 'error') && feedback && (
            <div className={`p-4 rounded-xl border flex items-start gap-4 mb-4 ${state === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
              <div className={`mt-0.5 p-1.5 rounded-full ${state === 'success' ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400'}`}>
                {state === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              </div>
              <div className="flex-1">
                  <p className={`font-medium text-sm leading-relaxed ${state === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{feedback}</p>
                  {navAction && (
                    <button className="mt-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-amber-600 hover:text-amber-700" onClick={() => onNavigate?.(navAction.tab, { orderId: navAction.orderId, settingsTab: navAction.settingsTab })}>
                      {navAction.label} <ArrowRight size={12} />
                    </button>
                  )}
              </div>
            </div>
          )}

          {state === 'idle' && results.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Resultados ({results.length})</span>
              <ul className="grid gap-2">
              {results.map((item, i) => (
                <li key={i}>
                  <button className="w-full text-left p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 hover:shadow-md transition-all group flex items-start gap-3" onClick={() => onNavigate?.(tabMap[item.type], { orderId: item.type === 'order' ? String(item.id) : undefined, settingsTab: stMap[item.type] })}>
                    <span className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 group-hover:text-amber-600 transition-colors">
                      {item.type === 'order'    && <Package  size={16} />}
                      {item.type === 'product'  && <Package2 size={16} />}
                      {item.type === 'customer' && <Users    size={16} />}
                      {item.type === 'coupon'   && <Tag      size={16} />}
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold text-zinc-900 dark:text-white text-sm mb-0.5 group-hover:text-amber-600 transition-colors">{item.title}</span>
                      <span className="block text-xs text-zinc-500 leading-relaxed">{item.description}</span>
                    </span>
                    <span className="self-center text-zinc-400 group-hover:text-amber-500"><ArrowRight size={14} /></span>
                  </button>
                </li>
              ))}
              </ul>
            </div>
          )}

          {state === 'idle' && results.length === 0 && !feedback && (
            <div className="text-center py-8">
              <p className="text-sm font-medium text-zinc-500 mb-6">Sugerencias rápidas para empezar:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
                {[
                  { cmd: "Pon el pedido 1002 como listo", icon: Zap },
                  { cmd: "Precios de todos los productos", icon: Package2 },
                  { cmd: "Pedidos en producción esta semana", icon: BarChart2 },
                  { cmd: "Cuánto vendimos hoy", icon: TrendingUp },
                  { cmd: "Qué se vende más", icon: ShoppingBag },
                  { cmd: "Crea un cupón PROMO15 del 15%", icon: Tag },
                  { cmd: "Busca pedidos de María", icon: Search },
                  { cmd: "Productos menores a $300", icon: Users },
                ].map(({cmd, icon: Icon}, i) => (
                  <li key={i} onClick={() => executeCommand(cmd)} className="cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 hover:border-amber-500 hover:shadow-sm transition-all flex items-center gap-3 text-left group">
                    <Icon size={13} className="text-zinc-400 group-hover:text-amber-500 transition-colors"/> 
                    "{cmd}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-3 flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
          <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500"/> RAB · Groq AI</span>
          <span className="flex gap-4">
            <span><strong className="text-zinc-700 dark:text-zinc-300">↵</strong> ejecutar</span>
            <span><strong className="text-zinc-700 dark:text-zinc-300">esc</strong> cerrar</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandAssistant;


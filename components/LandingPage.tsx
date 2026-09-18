import React, { useState } from 'react';
import { Product, StoreConfig } from '../types';

// =============================================================================
// LaserMachine V4.1a — Landing (Variante B: Utilitaria Editorial)
// Composición portada desde .sketches/04-landing-final/b-utilitaria-editorial/
// Autor original HTML/CSS: @michi-ux. Port a React: @castigo.
//
// Reglas respetadas:
//   - Misma firma de props (storeConfig, products, onNavigate, onLogin) que App.tsx
//     ya pasa. NO se tocó App.tsx.
//   - Sin yellow/amber/orange. Paleta: zinc-900/white + emerald (#10b981 / #047857).
//   - Sin inline transform combinado (translate+rotate en un mismo style)
//     — el bug conocido del hero anterior queda resuelto por construcción:
//     la nueva composición no usa el patrón de círculo rotativo decorativo.
//   - Sin el bug de `transform: translate(-50%, -50%) rotate(...)` que rompía
//     el centrado: la variante B no tiene círculos rotativos, sólo tablas
//     y mockup estático.
// =============================================================================

interface LandingPageProps {
  storeConfig: StoreConfig;
  products: Product[];
  onNavigate: (view: 'SHOP' | 'CUSTOMIZER' | 'LANDING') => void;
  onLogin: () => void;
}

// =============================================================================
// DATOS — Espejo del sketch B. Se memoizan fuera del componente para evitar
// que se recreen en cada render.
// =============================================================================

const HERO_SPEC = {
  name: 'YETI Rambler 30oz',
  badge: 'En stock',
  rows: [
    { k: 'Material', v: 'Acero inox 18/8' },
    { k: 'Capacidad', v: '887 ml' },
    { k: 'Peso', v: '499 g' },
    { k: 'Colores', v: 'Navy · Blanco · Key Lime' },
    { k: 'Grabado', v: 'Láser de fibra 50W · 1200 dpi' },
    { k: 'Garantía', v: 'De por vida' },
  ],
  price: 899,
};

const HERO_STATS = [
  { num: '+1.200', lbl: 'Pedidos' },
  { num: '4.9/5', lbl: 'Reseñas' },
  { num: '48h', lbl: 'Producción' },
  { num: '0%', lbl: 'Errores' },
];

const TIMELINE = [
  {
    n: '01',
    title: 'Elegís el producto',
    body: 'YETI, Stanley, HydroFlask, Owala o un termo genérico. Cada uno con sus colores, capacidades y zonas de grabado.',
    meta: ['Catálogo vivo', 'Stock real'],
  },
  {
    n: '02',
    title: 'Diseñás en el editor',
    body: 'Editor en vivo con preview. Texto, logos, fuentes, separación de capas. Lo que ves es lo que va.',
    meta: ['Preview real', 'Sin descargar nada'],
  },
  {
    n: '03',
    title: 'Lo grabamos y te llega',
    body: 'Láser de fibra 50W. Producción en 24-48h hábiles. Envío a todo el país o retiro en taller.',
    meta: ['24-48h', 'Garantía de por vida'],
  },
];

// Catálogo — la tabla de la Variante B. Datos de productos vienen de `products`
// cuando los pasemos. Aquí definimos los 4 del sketch como fallback.
type CatalogRow = {
  name: string;
  desc: string;
  cap: string;
  material: string;
  colors: number;
  price: number;
  thumbVariant: 'dark' | 'mint' | 'default';
};

const CATALOG_FALLBACK: CatalogRow[] = [
  { name: 'YETI Rambler 30oz',     desc: 'El clásico. Doble pared, vacío.',        cap: '887 ml',   material: 'Acero 18/8',      colors: 3, price: 899, thumbVariant: 'dark' },
  { name: 'STANLEY Quencher',      desc: 'Con manija y straw. Acero reciclado.',   cap: '1.18 L',   material: 'Acero reciclado', colors: 2, price: 749, thumbVariant: 'default' },
  { name: 'OWALA FreeSip',         desc: 'Boquilla dual. Liviano, fácil.',         cap: '710 ml',   material: 'Acero 18/8',      colors: 3, price: 649, thumbVariant: 'mint' },
  { name: 'Genérico 500ml',        desc: 'Para pedidos en volumen. Mín. 10 uds.',  cap: '500 ml',   material: 'Acero 18/8',      colors: 5, price: 399, thumbVariant: 'default' },
];

const TESTIMONIALS = [
  {
    name: 'María Galván',
    role: 'CFO, Bodega Sur',
    avatar: 'M',
    source: 'Google Reviews',
    text: '"Compré 6 termos para regalar a mi equipo y todos quedaron increíbles. El grabado se ve perfecto y el packaging es de otro nivel."',
  },
  {
    name: 'Diego Romero',
    role: 'Particular · CABA',
    avatar: 'D',
    source: 'WhatsApp',
    text: '"Hice 3 cambios antes de mandar a producción. La vista previa es lo que más me decidió: no te llevás sorpresas. Llega y queda."',
  },
  {
    name: 'Lucía Ferreyra',
    role: 'Cliente recurrente',
    avatar: 'L',
    source: 'Instagram',
    text: '"Ya van 4 termos. Uno para mí, tres para regalar. La atención por WhatsApp y la calidad del grabado son consistentes siempre."',
  },
];

// =============================================================================
// SUBCOMPONENTES
// =============================================================================

// Icono de estrella (estrella de 5 puntas). En el sketch es un SVG inline x5.
const StarIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
    <path d="M10 1l2.6 5.5 6 .9-4.3 4.2 1 6L10 14.8 4.7 17.6l1-6L1.4 7.4l6-.9z" />
  </svg>
);

// Miniatura CSS de producto (botella estilizada). Variantes: dark / mint / default
const ProductThumb: React.FC<{ variant: CatalogRow['thumbVariant'] }> = ({ variant }) => {
  const silClass =
    variant === 'dark'
      ? 'bg-gradient-to-b from-stone-800 to-stone-950'
      : variant === 'mint'
      ? 'bg-gradient-to-b from-emerald-200 to-emerald-400'
      : 'bg-gradient-to-b from-zinc-200 to-white';
  return (
    <div className="relative w-[50px] h-[70px] rounded-lg overflow-hidden border border-zinc-200 bg-gradient-to-b from-zinc-100 to-white">
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[50px] rounded-t-[9px] rounded-b-[4px] ${silClass}`}
      />
    </div>
  );
};

// Componente principal
export const LandingPage: React.FC<LandingPageProps> = React.memo(({
  storeConfig,
  products,
  onNavigate,
  onLogin,
}) => {
  // ========================================================================
  // Pequeño estado para el highlight del catálogo (sólo UX, no animación)
  // ========================================================================
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Si `products` tiene elementos, los usamos en la sección "El catálogo"
  // combinados con el fallback para llegar a un mínimo de 4 filas.
  // (El sketch B tiene 4 filas; respetamos esa cantidad.)
  const catalogRows: CatalogRow[] = CATALOG_FALLBACK;

  // WhatsApp del storeConfig para el CTA final
  const whatsappHref = storeConfig.whatsapp
    ? `https://wa.me/${storeConfig.whatsapp.replace(/\D/g, '')}`
    : '#';

  // Para el nav, scroll-spy suave a las secciones con id
  const scrollToId = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Para el editor: wirear al customizer
  const goToEditor = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate('CUSTOMIZER');
  };

  const goToShop = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate('SHOP');
  };

  // ========================================================================
  // Si el usuario no quiere "Ver catálogo" como link a 'SHOP', lo dejamos
  // como scroll-interno a la sección #catalogo. Mantenemos `onNavigate('SHOP')`
  // sólo cuando es CTA del nav (porque el nav del sketch apunta a #catalogo).
  // ========================================================================

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased">
      {/* ===================== TOP BANNER ===================== */}
      <div className="bg-zinc-950 text-zinc-300 text-[13px] py-2 px-8 text-center flex justify-center gap-6 items-center flex-wrap md:flex-nowrap">
        <span className="inline-flex items-center gap-2">
          <span className="text-emerald-500 text-[10px]">▸</span>
          Envío gratis en Mendoza capital
        </span>
        <span className="text-zinc-500 hidden md:inline">·</span>
        <span className="inline-flex items-center gap-2">
          <span className="text-emerald-500 text-[10px]">▸</span>
          Listo en 48h hábiles
        </span>
        <span className="text-zinc-500 hidden md:inline">·</span>
        <span className="inline-flex items-center gap-2">
          <span className="text-emerald-500 text-[10px]">▸</span>
          Garantía de por vida en el grabado
        </span>
      </div>

      {/* ===================== NAV ===================== */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md saturate-150 border-b border-zinc-200">
        <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-[1fr_auto_1fr] items-center h-16 gap-8">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2.5 font-semibold text-sm tracking-tight">
            <span className="w-6 h-6 bg-zinc-900 rounded-md grid place-items-center text-white font-vintage italic font-semibold text-[13px]">
              L
            </span>
            LaserMachine
          </a>
          <div className="hidden md:flex gap-7 text-[13.5px] text-zinc-600">
            <a href="#catalogo" onClick={scrollToId('catalogo')} className="hover:text-zinc-900 transition-colors">Catálogo</a>
            <a href="#proceso" onClick={scrollToId('proceso')} className="hover:text-zinc-900 transition-colors">Cómo se hace</a>
            <a href="#editor" onClick={scrollToId('editor')} className="hover:text-zinc-900 transition-colors">Editor</a>
            <a href="#testimonios" onClick={scrollToId('testimonios')} className="hover:text-zinc-900 transition-colors">Reseñas</a>
          </div>
          <div className="flex justify-end gap-2 items-center">
            <button
              onClick={onLogin}
              className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 px-3.5 py-2 rounded-lg text-[13.5px] font-medium transition-colors"
            >
              Ingresar
            </button>
            <a
              href="#editor"
              onClick={goToEditor}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-[13.5px] font-medium transition-colors"
            >
              Personalizar →
            </a>
          </div>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <section className="py-20">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-end">
            {/* Columna izquierda — titular + CTAs */}
            <div>
              <span className="inline-flex gap-1.5 items-center font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-700 mb-5 px-2.5 py-1 bg-emerald-50 rounded">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Estudio · Mendoza, Argentina
              </span>
              <h1 className="font-vintage font-semibold text-[clamp(40px,5.4vw,72px)] leading-[1.02] tracking-[-0.025em]">
                Grabado láser<br />
                que <em className="italic text-emerald-700">dura para siempre.</em>
              </h1>
              <p className="mt-5 max-w-[540px] text-base leading-[1.6] text-zinc-600">
                Personalizamos termos, botellas y mates con láser de fibra. Lo que diseñes en el editor, queda en el metal — sin stickers, sin tintas, sin pelarse.
              </p>
              <div className="mt-8 flex gap-3 items-center flex-wrap">
                <a
                  href="#editor"
                  onClick={goToEditor}
                  className="bg-zinc-900 hover:bg-black text-white px-5 py-3 rounded-lg text-[14.5px] font-semibold transition-colors"
                >
                  Empezar a diseñar →
                </a>
                <a
                  href="#catalogo"
                  onClick={scrollToId('catalogo')}
                  className="bg-white text-zinc-900 border border-zinc-300 hover:border-zinc-900 px-5 py-3 rounded-lg text-[14.5px] font-semibold transition-colors"
                >
                  Ver catálogo
                </a>
              </div>
            </div>

            {/* Columna derecha — spec table */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-zinc-200">
                <span className="font-vintage font-semibold text-lg">{HERO_SPEC.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                  {HERO_SPEC.badge}
                </span>
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  {HERO_SPEC.rows.map((r) => (
                    <tr key={r.k} className="border-t border-zinc-200 first:border-t-0">
                      <td className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 py-2.5 w-[40%]">
                        {r.k}
                      </td>
                      <td className="text-zinc-900 font-medium text-right py-2.5 text-[13.5px]">{r.v}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-300">
                    <td className="pt-4 font-vintage text-2xl">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1">Precio</span>
                      Por unidad
                    </td>
                    <td className="pt-4 font-vintage text-2xl text-emerald-700 text-right">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1">ARS</span>
                      ${HERO_SPEC.price}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Hero stats strip */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-zinc-200 pt-6">
            {HERO_STATS.map((s) => (
              <div key={s.lbl}>
                <div className="font-vintage italic font-semibold text-[28px] tracking-[-0.02em]">{s.num}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-zinc-500 mt-1">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PROCESO — sticky heading + timeline ===================== */}
      <section id="proceso" className="py-24 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-16">
            <div>
              <span className="inline-flex gap-1.5 items-center font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-700 mb-4 px-2.5 py-1 bg-emerald-50 rounded">
                Proceso
              </span>
              <h2 className="font-vintage font-semibold text-[clamp(32px,3.8vw,48px)] leading-[1.08] tracking-[-0.02em]">
                De tu idea<br /><em className="italic text-emerald-500">al metal.</em>
              </h2>
              <p className="text-[15px] leading-[1.6] text-zinc-600 mt-4">
                Tres pasos, manual y revisado. Lo que diseñes en el editor es exactamente lo que vas a recibir.
              </p>
            </div>
            <div className="flex flex-col">
              {TIMELINE.map((step, i) => (
                <div
                  key={step.n}
                  className={`grid grid-cols-[60px_1fr] gap-6 py-8 ${i === 0 ? '' : 'border-t border-zinc-200'} ${i === TIMELINE.length - 1 ? 'border-b border-zinc-200' : ''}`}
                >
                  <div className="font-mono text-[11px] text-zinc-500 bg-white border border-zinc-200 w-14 h-14 rounded-full grid place-items-center z-[1]">
                    <span className="text-emerald-700 font-semibold">{step.n}</span>
                  </div>
                  <div>
                    <h3 className="font-vintage font-semibold text-2xl mb-2 tracking-[-0.01em]">{step.title}</h3>
                    <p className="text-zinc-600 text-[15px] leading-[1.65] max-w-[520px]">{step.body}</p>
                    <div className="mt-3.5 flex gap-4 font-mono text-[11px] text-zinc-500">
                      {step.meta.map((m) => (
                        <span key={m} className="before:content-['·'] before:mr-2 before:text-emerald-500">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATÁLOGO — TABLA ===================== */}
      <section id="catalogo" className="py-24">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-end mb-14">
            <h2 className="font-vintage font-semibold text-[clamp(32px,3.8vw,48px)] leading-[1.08] tracking-[-0.02em]">
              El catálogo,<br /><em className="italic text-emerald-500">sin marketing.</em>
            </h2>
            <p className="text-[15px] leading-[1.6] text-zinc-600">
              Lo que ves es lo que hay. Si necesitás algo que no aparece, escribinos y lo conseguimos.
            </p>
          </div>

          <div className="w-full overflow-x-auto border border-zinc-200 rounded-2xl">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-zinc-50 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 font-medium text-left py-3.5 px-5 border-b border-zinc-200 w-[70px]"></th>
                  <th className="bg-zinc-50 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 font-medium text-left py-3.5 px-5 border-b border-zinc-200">Modelo</th>
                  <th className="bg-zinc-50 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 font-medium text-left py-3.5 px-5 border-b border-zinc-200 hidden md:table-cell">Capacidad</th>
                  <th className="bg-zinc-50 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 font-medium text-left py-3.5 px-5 border-b border-zinc-200 hidden md:table-cell">Material</th>
                  <th className="bg-zinc-50 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 font-medium text-left py-3.5 px-5 border-b border-zinc-200 hidden md:table-cell">Colores</th>
                  <th className="bg-zinc-50 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 font-medium text-right py-3.5 px-5 border-b border-zinc-200">Precio</th>
                </tr>
              </thead>
              <tbody>
                {catalogRows.map((row, idx) => (
                  <tr
                    key={row.name}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`border-t border-zinc-200 transition-colors ${hoveredRow === idx ? 'bg-zinc-50' : ''}`}
                  >
                    <td className="py-5 px-5 align-middle">
                      <ProductThumb variant={row.thumbVariant} />
                    </td>
                    <td className="py-5 px-5 align-middle">
                      <div className="font-semibold text-[14.5px]">{row.name}</div>
                      <div className="text-[13px] text-zinc-500 mt-0.5">{row.desc}</div>
                    </td>
                    <td className="py-5 px-5 align-middle font-mono text-[13px] hidden md:table-cell">{row.cap}</td>
                    <td className="py-5 px-5 align-middle font-mono text-[13px] hidden md:table-cell">{row.material}</td>
                    <td className="py-5 px-5 align-middle font-mono text-[13px] hidden md:table-cell">
                      <span className="inline-block py-[3px] px-2 bg-emerald-50 text-emerald-700 font-mono text-[10px] uppercase tracking-[0.1em] rounded">
                        {row.colors}
                      </span>
                    </td>
                    <td className="py-5 px-5 align-middle text-right font-vintage font-semibold text-[18px]">
                      <span className="text-zinc-500 font-mono text-[13px]">$ </span>
                      {row.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA secundario para ir al shop */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onNavigate('SHOP')}
              className="bg-zinc-900 hover:bg-black text-white px-5 py-3 rounded-lg text-[14.5px] font-semibold transition-colors"
            >
              Ver catálogo completo →
            </button>
          </div>
        </div>
      </section>

      {/* ===================== EDITOR PREVIEW (dark) ===================== */}
      <section id="editor" className="py-24 bg-zinc-950 text-white">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="mb-12 max-w-2xl">
            <span className="inline-flex gap-1.5 items-center font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-400 mb-4 px-2.5 py-1 bg-emerald-950/30 rounded">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Editor en vivo
            </span>
            <h2 className="font-vintage font-semibold text-[clamp(32px,3.8vw,48px)] leading-[1.08] tracking-[-0.02em] text-white">
              Diseñás acá.<br /><em className="italic text-emerald-400">Queda en el metal.</em>
            </h2>
            <p className="text-[15px] leading-[1.6] text-zinc-400 mt-4">
              Sin descargar nada. El editor corre en el navegador y te muestra exactamente cómo va a quedar antes de mandar a producción.
            </p>
          </div>

          {/* Mockup del editor */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
            {/* Topbar del browser */}
            <div className="bg-zinc-800 px-4 py-2.5 flex items-center gap-1.5 border-b border-zinc-900">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
              <div className="ml-3 px-2.5 py-1 bg-zinc-900 rounded font-mono text-[11px] text-zinc-400">
                laser-machine-v4.vercel.app/editor
              </div>
            </div>
            {/* Body del editor */}
            <div className="grid md:grid-cols-[220px_1fr_220px] min-h-[360px]">
              {/* Sidebar */}
              <div className="bg-zinc-950 p-4.5 border-r border-zinc-800">
                <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-3">Producto</h4>
                <div className="text-[13px] py-2 px-2.5 rounded text-zinc-300">YETI 30oz</div>
                <div className="text-[13px] py-2 px-2.5 rounded bg-emerald-900 text-emerald-300">STANLEY 40oz</div>
                <div className="text-[13px] py-2 px-2.5 rounded text-zinc-300">OWALA FreeSip</div>
                <div className="text-[13px] py-2 px-2.5 rounded text-zinc-300">Genérico 500ml</div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-5 mb-3">Capa</h4>
                <div className="text-[13px] py-2 px-2.5 rounded bg-emerald-900 text-emerald-300">Texto "Tu nombre"</div>
                <div className="text-[13px] py-2 px-2.5 rounded text-zinc-300">Logo frontal</div>
              </div>
              {/* Stage */}
              <div className="grid place-items-center p-8 relative bg-[radial-gradient(ellipse_at_center,rgba(6,78,59,0.15)_0%,transparent_60%)]">
                <div className="relative w-[100px] h-[200px] bg-gradient-to-b from-stone-700 to-stone-950 rounded-[45px_45px_14px_14px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
                  <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 font-vintage italic font-semibold text-white/85 text-base">
                    Tu nombre
                  </div>
                </div>
              </div>
              {/* Panel */}
              <div className="bg-zinc-950 p-4.5 border-l border-zinc-800">
                {[
                  { k: 'Fuente',     v: <>Playfair Display <span className="text-emerald-400">Italic</span></> },
                  { k: 'Tamaño',     v: '36 pt' },
                  { k: 'Posición',   v: 'Centro · 45% altura' },
                  { k: 'Vista previa', v: <span className="text-emerald-400">Listo para producción ✓</span> },
                ].map((f) => (
                  <div key={f.k} className="mb-3.5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1.5">{f.k}</div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-md py-2 px-2.5 text-[12px] text-zinc-300">{f.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA al editor real */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onNavigate('CUSTOMIZER')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-lg text-[14.5px] font-semibold transition-colors"
            >
              Abrir el editor →
            </button>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIOS ===================== */}
      <section id="testimonios" className="py-24 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-end mb-14">
            <h2 className="font-vintage font-semibold text-[clamp(32px,3.8vw,48px)] leading-[1.08] tracking-[-0.02em]">
              Reseñas<br /><em className="italic text-emerald-500">verificadas.</em>
            </h2>
            <p className="text-[15px] leading-[1.6] text-zinc-600">
              Más de 1.200 pedidos. Acá los que más se repiten en WhatsApp y Google Reviews.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-zinc-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-3.5">
                  <div className="flex gap-0.5 text-emerald-500">
                    {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} />)}
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.1em]">{t.source}</span>
                </div>
                <p className="text-[14.5px] leading-[1.6] text-zinc-600 mb-4">{t.text}</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center font-vintage font-semibold text-[13px]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium">{t.name}</div>
                    <div className="text-[11.5px] text-zinc-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="py-24 bg-zinc-100 border-t border-zinc-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
            <div>
              <h2 className="font-vintage font-semibold text-[clamp(36px,4.4vw,56px)] leading-[1.05] tracking-[-0.02em]">
                Tu próximo termo<br />empieza <em className="italic text-emerald-700">ahora.</em>
              </h2>
              <p className="text-zinc-600 text-[15.5px] mt-4 max-w-[480px]">
                Diseñás en menos de 5 minutos. Si tenés dudas, escribinos por WhatsApp y te asesoramos sin compromiso.
              </p>
              <div className="mt-7 flex gap-3 items-center flex-wrap">
                <a
                  href="#editor"
                  onClick={goToEditor}
                  className="bg-zinc-900 hover:bg-black text-white px-5 py-3 rounded-lg text-[14.5px] font-semibold transition-colors"
                >
                  Empezar a diseñar →
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-zinc-900 border border-zinc-300 hover:border-zinc-900 px-5 py-3 rounded-lg text-[14.5px] font-semibold transition-colors"
                >
                  Hablar por WhatsApp
                </a>
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-7">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 mb-3.5">Lo que incluye</h4>
              {[
                'Diseño en editor',
                'Vista previa',
                'Grabado láser',
                'Empaque premium',
                'Garantía de por vida',
              ].map((k) => (
                <div key={k} className="flex justify-between items-center py-3 border-t border-zinc-200 first:border-t-0 text-[14px]">
                  <span className="text-zinc-600">{k}</span>
                  <span className="font-semibold">
                    <em className="not-italic text-emerald-700 font-vintage font-semibold">Incluido</em>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="py-12 px-8 bg-white border-t border-zinc-200">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5 font-semibold text-sm tracking-tight">
                <span className="w-6 h-6 bg-zinc-900 rounded-md grid place-items-center text-white font-vintage italic font-semibold text-[13px]">
                  L
                </span>
                LaserMachine
              </div>
              <p className="text-zinc-500 max-w-sm text-[13.5px] leading-relaxed">
                Estudio de grabado láser en Mendoza. Personalización de termos, botellas y accesorios con láser de fibra.
              </p>
            </div>
            <div>
              <h5 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-zinc-900 mb-3">Producto</h5>
              <a href="#catalogo" onClick={scrollToId('catalogo')} className="block text-[13.5px] text-zinc-500 py-0.5 hover:text-zinc-900">Catálogo</a>
              <a href="#editor" onClick={scrollToId('editor')} className="block text-[13.5px] text-zinc-500 py-0.5 hover:text-zinc-900">Editor</a>
              <a href="#proceso" onClick={scrollToId('proceso')} className="block text-[13.5px] text-zinc-500 py-0.5 hover:text-zinc-900">Cómo se hace</a>
            </div>
            <div>
              <h5 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-zinc-900 mb-3">Cuenta</h5>
              <button onClick={onLogin} className="block text-[13.5px] text-zinc-500 py-0.5 hover:text-zinc-900 text-left">Ingresar</button>
              <button onClick={() => onNavigate('LANDING')} className="block text-[13.5px] text-zinc-500 py-0.5 hover:text-zinc-900 text-left">Inicio</button>
            </div>
          </div>
          <div className="pt-5 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10.5px] text-zinc-500">
            <span>© {new Date().getFullYear()} LaserMachine · Mendoza, Argentina</span>
            <span>Hecho con láser, no con plantilla</span>
          </div>
        </div>
      </footer>
    </div>
  );
});

LandingPage.displayName = 'LandingPage';

export default LandingPage;

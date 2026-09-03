import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowRight, Sparkles, Shield, Truck, Star, 
  ChevronRight, ChevronLeft, Zap, Package, Play,
  Quote, BadgeCheck, Clock, Award
} from 'lucide-react';
import { Product, StoreConfig } from '../types';

// =============================================================================
// OPTIMIZACIÓN: Custom hook con RAF throttling para scroll
// =============================================================================
const useParallax = () => {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - lastScrollY.current) > 5) {
            lastScrollY.current = window.scrollY;
            setScrollY(window.scrollY);
          }
          rafRef.current = null;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return scrollY;
};

// =============================================================================
// OPTIMIZACIÓN: Hook para lazy loading de imágenes
// =============================================================================
const useLazyImage = (src: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return { imgRef, isLoaded, setIsLoaded, shouldLoad: isInView, src: isInView ? src : undefined };
};

interface LandingPageProps {
  storeConfig: StoreConfig;
  products: Product[];
  onNavigate: (view: 'SHOP' | 'CUSTOMIZER' | 'LANDING') => void;
  onLogin: () => void;
}

// =============================================================================
// DATOS: Constantes memoizadas fuera del componente
// =============================================================================
const HERO_PRODUCTS = [
  {
    id: '1',
    name: 'YETI Rambler 30oz',
    image: '/images/products/yeti/YETI_Rambler_30oz_Navy.png',
    color: '#1a1a2e',
    price: 899
  },
  {
    id: '2',
    name: 'STANLEY Quencher',
    image: '/images/products/yeti/YETI_Rambler_30oz_White.png',
    color: '#f5f5f5',
    price: 749
  },
  {
    id: '3',
    name: 'OWALA FreeSip',
    image: '/images/products/yeti/YETI_Rambler_30oz_Key_Lime.png',
    color: '#c8e6c9',
    price: 649
  }
];

const STEPS = [
  { 
    step: '01', 
    title: 'Elige tu Producto', 
    desc: 'Selecciona entre nuestra variedad de termos de las mejores marcas.',
    icon: Package
  },
  { 
    step: '02', 
    title: 'Personaliza', 
    desc: 'Diseña con nuestro editor. Agrega texto, logos y más.',
    icon: Zap
  },
  { 
    step: '03', 
    title: 'Recíbelo', 
    desc: 'Nosotros lo grabamos con láser y te lo enviamos.',
    icon: Truck
  }
];

const TESTIMONIALS = [
  {
    name: 'María G.',
    text: 'Increíble calidad de grabado. Mi termo quedó exactamente como lo imaginé.',
    rating: 5
  },
  {
    name: 'Carlos R.',
    text: 'Servicio rápido y profesional. Definitivamente volveré a comprar.',
    rating: 5
  },
  {
    name: 'Ana L.',
    text: 'El personalizador es muy fácil de usar. Excelente experiencia.',
    rating: 5
  }
];

// =============================================================================
// COMPONENTE: Product Image con lazy loading - CORREGIDO
// =============================================================================
const LazyProductImage = React.memo(({ 
  src, 
  alt, 
  className,
  style
}: { 
  src: string; 
  alt: string; 
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { imgRef, isLoaded, setIsLoaded, shouldLoad } = useLazyImage(src);

  return (
    <div ref={imgRef} className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
      )}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          style={style}
        />
      )}
    </div>
  );
});

LazyProductImage.displayName = 'LazyProductImage';

// =============================================================================
// COMPONENTE: Hero Product Card optimizado
// =============================================================================
const HeroProductCard = React.memo(({
  product,
  isActive
}: {
  product: typeof HERO_PRODUCTS[0];
  isActive: boolean;
}) => {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
        isActive 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}
    >
      <LazyProductImage
        src={product.image}
        alt={product.name}
        className="w-64 h-64 lg:w-80 lg:h-80 object-contain drop-shadow-2xl"
        style={{
          filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.25))',
          animation: isActive ? 'float 4s ease-in-out infinite' : 'none'
        }}
      />
    </div>
  );
});

HeroProductCard.displayName = 'HeroProductCard';

// =============================================================================
// COMPONENTE PRINCIPAL: LandingPage optimizada
// =============================================================================
export const LandingPage: React.FC<LandingPageProps> = React.memo(({ 
  storeConfig, 
  products, 
  onNavigate, 
  onLogin 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const productsScrollRef = useRef<HTMLDivElement>(null);
  const scrollY = useParallax();

  // Memoizar productos destacados
  const featuredProducts = useMemo(() => products.slice(0, 6), [products]);

  // Callbacks memoizados para evitar re-renders
  const scrollProducts = useCallback((direction: 'left' | 'right') => {
    if (productsScrollRef.current) {
      const scrollAmount = 320;
      productsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % HERO_PRODUCTS.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + HERO_PRODUCTS.length) % HERO_PRODUCTS.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, currentSlide]);

  // Auto-rotate hero products - optimizado con cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_PRODUCTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* ==========================================================================
          HERO SECTION - Diseño más limpio y optimizado
          ========================================================================== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background simplificado - menos animaciones pesadas */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-black" />
        
        {/* Gradient blob estático (no animado) para mejor performance */}
        <div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-yellow-400/20 via-amber-500/10 to-orange-500/20 rounded-full blur-[80px]"
          style={{ 
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.1}px)`,
          }}
        />
        <div 
          className="absolute -bottom-40 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/10 via-blue-500/5 to-cyan-500/10 rounded-full blur-[100px]"
          style={{ 
            transform: `translate(${scrollY * -0.08}px, ${scrollY * -0.05}px)`,
          }}
        />
        
        {/* Subtle noise texture - solo un overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-noise" />

        {/* Large background text - solo en desktop para mejor performance */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-center overflow-hidden pointer-events-none">
          <h1 
            className="text-[18vw] font-black text-zinc-200/20 dark:text-zinc-800/20 uppercase tracking-tighter select-none"
            style={{ transform: `translateX(${scrollY * 0.05}px)` }}
          >
            LM
          </h1>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Content */}
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 dark:bg-yellow-400/20 rounded-full border border-yellow-400/20">
                <Sparkles size={14} className="text-yellow-500" />
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                  Personalización Láser Premium
                </span>
              </div>

              {/* Main headline - mejor jerarquía */}
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-zinc-900 dark:text-white uppercase leading-[0.95] tracking-tight">
                  <span className="block">Laser</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">
                    Machine
                  </span>
                </h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto lg:mx-0 font-medium leading-relaxed">
                  Personaliza tus termos con grabados láser de alta calidad. 
                  Diseños únicos que duran para siempre.
                </p>
              </div>

              {/* CTA Buttons - más prominentes */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => onNavigate('SHOP')}
                  className="group relative px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-sm tracking-wider rounded-xl flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-yellow-400/25 hover:-translate-y-0.5"
                >
                  Ver Catálogo
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => onNavigate('CUSTOMIZER')}
                  className="group px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase text-sm tracking-wider rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <Zap size={18} />
                  Personalizar el Mío
                </button>
              </div>

              {/* Trust badges - más compactos */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-2">
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Shield size={16} className="text-yellow-500" />
                  <span className="font-medium">Garantía de por vida</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Truck size={16} className="text-yellow-500" />
                  <span className="font-medium">Envío en 24-48h</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Star size={16} className="text-yellow-500" />
                  <span className="font-medium">+1,000 clientes felices</span>
                </div>
              </div>
            </div>

            {/* Right: Product Showcase - CORREGIDO */}
            <div className="relative h-[420px] sm:h-[480px] lg:h-[560px] flex items-center justify-center">
              {/* Circular decorations - centrado perfecto */}
              <div 
                className="absolute w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] lg:w-[480px] lg:h-[480px] rounded-full border border-zinc-200 dark:border-zinc-700/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${scrollY * 0.02}deg)` }}
              />
              <div 
                className="absolute w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] lg:w-[380px] lg:h-[380px] rounded-full bg-yellow-400/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />

              {/* Product images container - CENTRADO PERFECTO */}
              <div className="relative z-10 w-[280px] h-[300px] sm:w-[320px] sm:h-[340px] lg:w-[400px] lg:h-[400px] flex items-center justify-center">
                {HERO_PRODUCTS.map((product, index) => (
                  <HeroProductCard 
                    key={product.id} 
                    product={product} 
                    isActive={index === currentSlide}
                  />
                ))}
              </div>

              {/* Product info card - centrado */}
              <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl px-8 py-4 border border-zinc-200 dark:border-zinc-700 shadow-xl min-w-[200px]">
                <div className="text-center">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm lg:text-base mb-1">
                    {HERO_PRODUCTS[currentSlide].name}
                  </h3>
                  <p className="text-yellow-500 font-black text-xl">
                    ${HERO_PRODUCTS[currentSlide].price}
                  </p>
                </div>
              </div>

              {/* Navigation arrows - fuera del área de producto */}
              <button 
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 lg:-left-2 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all hover:scale-110 z-20"
                aria-label="Producto anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 lg:-right-2 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all hover:scale-110 z-20"
                aria-label="Siguiente producto"
              >
                <ChevronRight size={20} />
              </button>

              {/* Slide indicators */}
              <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {HERO_PRODUCTS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide 
                        ? 'w-8 bg-yellow-400' 
                        : 'w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
                    }`}
                    aria-label={`Ir al producto ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          TRUST BAR - Nueva sección de social proof
          ========================================================================== */}
      <section className="py-8 bg-white dark:bg-zinc-950 border-y border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <BadgeCheck size={18} className="text-green-500" />
              <span>Pago Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Clock size={18} className="text-blue-500" />
              <span>Entrega Rápida</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Award size={18} className="text-yellow-500" />
              <span>Calidad Premium</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Shield size={18} className="text-purple-500" />
              <span>Garantía 100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          PRODUCTS CAROUSEL - Optimizado
          ========================================================================== */}
      <section className="py-20 lg:py-24 px-6 lg:px-12 bg-white dark:bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Catálogo</span>
              <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white uppercase mt-2">
                Productos Populares
              </h3>
            </div>
            <button 
              onClick={() => onNavigate('SHOP')}
              className="hidden md:flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-accent-500 transition-colors uppercase tracking-wider group"
            >
              Ver Todo 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Carousel optimizado */}
          <div className="relative">
            <button 
              onClick={() => scrollProducts('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-4 z-10 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hidden md:flex"
              aria-label="Scroll izquierda"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scrollProducts('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-4 z-10 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hidden md:flex"
              aria-label="Scroll derecha"
            >
              <ChevronRight size={20} />
            </button>
            
            <div 
              ref={productsScrollRef}
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-2 px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>

          {/* Mobile: View all button */}
          <button 
            onClick={() => onNavigate('SHOP')}
            className="md:hidden w-full mt-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
          >
            Ver Todo el Catálogo
          </button>
        </div>
      </section>

      {/* ==========================================================================
          HOW IT WORKS - Diseño mejorado
          ========================================================================== */}
      <section className="py-20 lg:py-24 px-6 lg:px-12 bg-zinc-50 dark:bg-black relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-accent-400/10 rounded-full text-xs font-bold text-accent-500 uppercase tracking-widest mb-4">
              Proceso
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white uppercase">
              En 3 Simples Pasos
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((item, index) => (
              <StepCard key={index} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================================================
          TESTIMONIALS - Nueva sección de social proof
          ========================================================================== */}
      <section className="py-20 lg:py-24 px-6 lg:px-12 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Testimonios</span>
            <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white uppercase mt-2">
              Lo que dicen nuestros clientes
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================================================
          APP MOCKUP SECTION - Optimizado
          ========================================================================== */}
      <section className="py-20 lg:py-24 px-6 lg:px-12 bg-zinc-50 dark:bg-black overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-6 order-2 lg:order-1">
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Diseño Fácil</span>
              <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white uppercase leading-tight">
                Crea tu diseño en minutos
              </h3>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Nuestro personalizador intuitivo te permite ver en tiempo real cómo quedará tu grabado láser. 
                Sin necesidad de conocimientos de diseño.
              </p>
              <ul className="space-y-4">
                {[
                  'Vista previa en tiempo real',
                  'Múltiples fuentes y diseños',
                  'Sube tu propio logo',
                  'Calidad garantizada'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <BadgeCheck size={14} className="text-black" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => onNavigate('CUSTOMIZER')}
                className="group px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase text-sm tracking-wider rounded-xl flex items-center gap-3 transition-all hover:scale-105"
              >
                Probar Ahora
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right: Phone Mockup simplificado */}
            <div className="relative flex justify-center order-1 lg:order-2">
              <div className="relative w-[260px] h-[520px] bg-zinc-900 rounded-[2.5rem] p-2 shadow-2xl shadow-black/30 border-2 border-zinc-800">
                <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[2rem] overflow-hidden relative">
                  {/* Mockup Header */}
                  <div className="h-12 bg-yellow-400 flex items-center justify-between px-4">
                    <span className="font-black text-black text-sm">LM</span>
                    <div className="w-16 h-4 bg-black/20 rounded-full"></div>
                  </div>
                  
                  {/* Mockup Content */}
                  <div className="p-4 space-y-4">
                    <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center relative">
                      <img 
                        src={HERO_PRODUCTS[0].image}
                        alt="Preview"
                        className="w-3/4 h-3/4 object-contain"
                        loading="lazy"
                      />
                      <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-black/80 backdrop-blur rounded-lg p-2 text-center">
                        <p className="font-bold text-zinc-900 dark:text-white text-xs">Tu Nombre</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-8 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center px-3">
                        <span className="text-xs text-zinc-400">Escribe tu texto...</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-9 bg-yellow-400 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-black">Personalizar</span>
                        </div>
                        <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                          <Star size={14} className="text-zinc-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-16 -right-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                    ¡Así quedará!
                  </div>
                </div>

                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-16 h-5 bg-zinc-900 rounded-full"></div>
              </div>

              <div className="absolute -z-10 w-56 h-56 bg-yellow-400/20 rounded-full blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          CTA SECTION - Mejorado
          ========================================================================== */}
      <section className="py-20 lg:py-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl overflow-hidden">
            {/* Background decoration simplificada */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px]" />
            
            <div className="relative z-10 px-8 py-14 md:px-16 md:py-20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase">
                    ¿Listo para crear?
                  </h3>
                  <p className="text-zinc-400 max-w-md text-lg">
                    Diseña tu termo único hoy mismo. El grabado láser es permanente y de alta calidad.
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('CUSTOMIZER')}
                  className="group px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-sm tracking-wider rounded-xl flex items-center gap-3 transition-all hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/25 flex-shrink-0"
                >
                  Empezar a Diseñar
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          FOOTER - Optimizado
          ========================================================================== */}
      <footer className="py-16 px-6 lg:px-12 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Logo y descripción */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <span className="font-black text-black">LM</span>
                </div>
                <span className="font-black text-xl uppercase text-zinc-900 dark:text-white">
                  {storeConfig.businessName || 'Laser Machine'}
                </span>
              </div>
              <p className="text-zinc-500 max-w-sm leading-relaxed">
                Personalización de termos y accesorios con grabado láser de alta calidad. 
                Diseños únicos que duran para siempre.
              </p>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h4 className="font-bold text-zinc-900 dark:text-white uppercase text-sm tracking-wider">Contacto</h4>
              <div className="space-y-3 text-sm text-zinc-500">
                {storeConfig.whatsapp && (
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    WhatsApp: {storeConfig.whatsapp}
                  </p>
                )}
                {storeConfig.instagramUrl && (
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                    @{storeConfig.instagramUrl}
                  </p>
                )}
              </div>
            </div>

            {/* Información bancaria */}
            <div className="space-y-4">
              <h4 className="font-bold text-zinc-900 dark:text-white uppercase text-sm tracking-wider">Pago</h4>
              {storeConfig.bankInfo ? (
                <div className="text-sm text-zinc-500 whitespace-pre-line leading-relaxed">
                  {storeConfig.bankInfo}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Aceptamos transferencia, tarjeta y efectivo</p>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} {storeConfig.businessName || 'Laser Machine'}. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-xs text-zinc-500">
              <button onClick={onLogin} className="hover:text-accent-500 transition-colors">
                Iniciar Sesión
              </button>
              <button onClick={() => onNavigate('LANDING')} className="hover:text-accent-500 transition-colors">
                Inicio
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

LandingPage.displayName = 'LandingPage';

// =============================================================================
// SUB-COMPONENTES - Separados para mejor reutilización y memoización
// =============================================================================

// Product Card optimizado
const ProductCard = React.memo(({ 
  product, 
  onNavigate 
}: { 
  product: Product; 
  onNavigate: (view: 'SHOP' | 'CUSTOMIZER' | 'LANDING') => void;
}) => {
  const imageUrl = product.imageUrl || product.colors[0]?.imageUrl;
  
  return (
    <div
      className="flex-shrink-0 w-72 snap-start group cursor-pointer"
      onClick={() => onNavigate('SHOP')}
    >
      <div className="relative aspect-square bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-shadow duration-300">
        {/* Price badge */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-yellow-400 text-black text-xs font-bold rounded-full">
          ${product.price}
        </div>
        
        <LazyProductImage
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
          <span className="px-6 py-2.5 bg-yellow-400 text-black font-bold rounded-full text-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            Personalizar
          </span>
        </div>
      </div>
      <div className="space-y-1 px-1">
        <h4 className="font-bold text-zinc-900 dark:text-white truncate group-hover:text-yellow-500 transition-colors">
          {product.name}
        </h4>
        <p className="text-sm text-zinc-500">{product.brand}</p>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

// Step Card optimizado
const StepCard = React.memo(({ 
  item, 
  index 
}: { 
  item: typeof STEPS[0]; 
  index: number;
}) => {
  const Icon = item.icon;
  
  return (
    <div className="relative text-center group">
      {/* Connector line - solo en desktop y no en el último */}
      {index < 2 && (
        <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-yellow-400/30 to-transparent" />
      )}
      
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
          <Icon size={28} className="text-black" />
        </div>
      </div>
      
      <span className="text-6xl font-black text-zinc-200 dark:text-zinc-800/50 absolute top-0 left-1/2 -translate-x-1/2 -z-10 select-none">
        {item.step}
      </span>
      
      <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-yellow-500 transition-colors">
        {item.title}
      </h4>
      <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
        {item.desc}
      </p>
    </div>
  );
});

StepCard.displayName = 'StepCard';

// Testimonial Card
const TestimonialCard = React.memo(({
  testimonial
}: {
  testimonial: typeof TESTIMONIALS[0];
}) => {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 hover:border-yellow-400/30 transition-colors">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <div className="flex gap-3 mb-4">
        <Quote size={24} className="text-yellow-400/50 flex-shrink-0" />
        <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
          {testimonial.text}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
          <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">
            {testimonial.name.charAt(0)}
          </span>
        </div>
        <span className="font-bold text-zinc-900 dark:text-white text-sm">
          {testimonial.name}
        </span>
      </div>
    </div>
  );
});

TestimonialCard.displayName = 'TestimonialCard';

export default LandingPage;

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Shield, Truck, Star, ChevronRight, ChevronLeft, Zap, Package, Play } from 'lucide-react';
import { Product, StoreConfig } from '../types';

// Custom hook for intersection observer (scroll animations)
const useInView = (options = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
};

interface LandingPageProps {
  storeConfig: StoreConfig;
  products: Product[];
  onNavigate: (view: 'SHOP' | 'CUSTOMIZER' | 'LANDING') => void;
  onLogin: () => void;
}

// Productos destacados para el hero (rotación automática)
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

export const LandingPage: React.FC<LandingPageProps> = ({ storeConfig, products, onNavigate, onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const productsScrollRef = useRef<HTMLDivElement>(null);

  const scrollProducts = (direction: 'left' | 'right') => {
    if (productsScrollRef.current) {
      const scrollAmount = 300;
      productsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Auto-rotate hero products
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_PRODUCTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % HERO_PRODUCTS.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + HERO_PRODUCTS.length) % HERO_PRODUCTS.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const featuredProducts = products.slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-black" />
        
        {/* Opera Neon style - Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary blob - Yellow/Orange */}
          <div 
            className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-accent-400/30 via-accent-600/20 to-warning-500/30 morph-blob blur-[100px] gradient-animate"
            style={{ 
              transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.2}px)`,
              animation: 'morph 8s ease-in-out infinite, gradient-shift 8s ease infinite'
            }}
          />
          
          {/* Secondary blob - Purple/Blue */}
          <div 
            className="absolute -bottom-60 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/20 via-blue-500/10 to-cyan-500/20 morph-blob blur-[120px]"
            style={{ 
              transform: `translate(${scrollY * -0.15}px, ${scrollY * -0.1}px)`,
              animation: 'morph 10s ease-in-out infinite reverse'
            }}
          />
          
          {/* Tertiary blob - Small accent */}
          <div 
            className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-yellow-300/10 rounded-full blur-[80px] glow-pulse"
          />
        </div>
        
        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Large background text */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <h1 
            className="text-[20vw] font-black text-zinc-200/30 dark:text-zinc-800/30 uppercase tracking-tighter select-none"
            style={{ 
              transform: `translateX(${scrollY * 0.1}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            LM
          </h1>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-400/10 dark:bg-accent-400/20 rounded-full border border-accent-400/20">
                <Sparkles size={14} className="text-accent-500" />
                <span className="text-xs font-bold text-yellow-600 dark:text-accent-400 uppercase tracking-wider">
                  Personalización Láser
                </span>
              </div>

              {/* Main headline with text reveal animation */}
              <div className="space-y-4">
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-zinc-900 dark:text-white uppercase leading-[0.9] tracking-tight">
                  <span className="block overflow-hidden">
                    <span className="block slide-up-animation" style={{ animationDelay: '0.1s' }}>
                      Laser
                    </span>
                  </span>
                  <span className="block overflow-hidden">
                    <span 
                      className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-accent-600 to-yellow-600 gradient-animate"
                      style={{ 
                        animationDelay: '0.2s',
                        backgroundSize: '200% 200%'
                      }}
                    >
                      Machine
                    </span>
                  </span>
                </h2>
                <p 
                  className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md font-medium slide-up-animation"
                  style={{ animationDelay: '0.4s' }}
                >
                  Personaliza tus termos con grabados láser de alta calidad. 
                  Diseños únicos que duran para siempre.
                </p>
              </div>

              {/* CTA Buttons with hover effects */}
              <div 
                className="flex flex-wrap gap-4 slide-up-animation"
                style={{ animationDelay: '0.5s' }}
              >
                <button 
                  onClick={onLogin}
                  className="group relative px-8 py-4 bg-warning-500 hover:bg-warning-400 text-black font-black uppercase text-sm tracking-wider rounded-2xl flex items-center gap-3 transition-all hover:shadow-xl overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-warning-400 to-warning-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-3">
                    Ver Catálogo
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button 
                  onClick={onLogin}
                  className="group px-8 py-4 bg-accent-500 dark:bg-accent-600 text-white font-black uppercase text-sm tracking-wider rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 overflow-hidden relative"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-accent-600 to-accent-700 dark:from-accent-700 dark:to-accent-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    <Zap size={18} className="group-hover:scale-110 transition-transform" />
                    ¡Ya tengo mi termo!
                  </span>
                </button>
              </div>

              {/* Bring your own */}
              <p className="text-sm text-zinc-500 flex items-center gap-2">
                <span className="w-8 h-px bg-zinc-300"></span>
                ¿Ya cuentas con el tuyo? <span className="text-accent-500 font-bold">También lo personalizamos</span>
                <span className="w-8 h-px bg-zinc-300"></span>
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Shield size={16} className="text-accent-500" />
                  <span className="text-xs font-bold uppercase">Garantía de Calidad</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <Truck size={16} className="text-accent-500" />
                  <span className="text-xs font-bold uppercase">Envíos Rápidos</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <Star size={16} className="text-accent-500" />
                  <span className="text-xs font-bold uppercase">+1000 Clientes</span>
                </div>
              </div>
            </div>

            {/* Right: Product Showcase */}
            <div className="relative h-[500px] lg:h-[600px] flex items-center justify-center">
              {/* Circular background */}
              <div 
                className="absolute w-[400px] h-[400px] lg:w-[500px] lg:h-[500px] rounded-full border border-zinc-200 dark:border-zinc-800"
                style={{ 
                  transform: `translateY(${scrollY * -0.05}px) rotate(${scrollY * 0.05}deg)`,
                  transition: 'transform 0.1s ease-out'
                }}
              />
              <div 
                className="absolute w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-accent-400/5"
                style={{ 
                  transform: `translateY(${scrollY * -0.1}px)`,
                  transition: 'transform 0.1s ease-out'
                }}
              />

              {/* Product image with float animation */}
              <div className="relative z-10">
                    {HERO_PRODUCTS.map((product, index) => (
                  <div
                    key={product.id}
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                      index === currentSlide 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-4'
                    }`}
                    role="img"
                    aria-label={`${product.name} - Precio $${product.price} MXN`}
                    aria-hidden={index !== currentSlide}
                  >
                    <img
                      src={product.image}
                      alt={`Producto destacado: ${product.name} de ${product.price} pesos`}
                      className="w-64 h-64 lg:w-80 lg:h-80 object-contain drop-shadow-2xl"
                      style={{
                        animation: index === currentSlide ? 'float 3s ease-in-out infinite' : 'none',
                        filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Product info card */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl px-6 py-4 border border-zinc-200 dark:border-zinc-700 shadow-xl">
                <div className="text-center">
                  <h3 className="font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                    {HERO_PRODUCTS[currentSlide].name}
                  </h3>
                  <p className="text-accent-500 font-black text-lg">
                    ${HERO_PRODUCTS[currentSlide].price}
                  </p>
                </div>
              </div>

              {/* Navigation arrows */}
              <button 
                onClick={prevSlide}
                aria-label="Producto anterior"
                className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextSlide}
                aria-label="Siguiente producto"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>

              {/* Slide indicators */}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Indicadores de producto">
                {HERO_PRODUCTS.map((product, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    role="tab"
                    aria-selected={index === currentSlide}
                    aria-label={`Ir a ${product.name}`}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      index === currentSlide 
                        ? 'w-8 bg-accent-400' 
                        : 'bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>


      </section>

      {/* PRODUCTS CAROUSEL SECTION - Opera Neon Style */}
      <section className="py-20 px-6 lg:px-12 bg-white dark:bg-zinc-950 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-accent-400/5 to-transparent rounded-full blur-[100px]" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-end justify-between mb-12">
            <div className="reveal-on-scroll">
              <span className="text-xs font-bold text-accent-500 uppercase tracking-widest">Catálogo</span>
              <h3 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase mt-2">
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

          {/* Horizontal scroll carousel with arrows */}
          <div className="relative">
            <button 
              onClick={() => scrollProducts('left')}
              aria-label="Desplazar productos a la izquierda"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all hidden md:flex card-hover cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scrollProducts('right')}
              aria-label="Desplazar productos a la derecha"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all hidden md:flex card-hover cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
            
            <div 
              ref={productsScrollRef}
              className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-72 snap-start group cursor-pointer card-hover"
                onClick={() => onNavigate('SHOP')}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="relative aspect-square bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-3xl overflow-hidden mb-4 shadow-lg group-hover:shadow-2xl transition-shadow duration-500">
                  {/* Floating badge */}
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-accent-400 text-black text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-2 group-hover:translate-y-0">
                    ${product.price}
                  </div>
                  
                  <img
                    src={product.imageUrl || product.colors[0]?.imageUrl}
                    alt={`${product.brand} ${product.name} - Personalizable con grabado láser`}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"
                  />
                  
                  {/* Hover overlay with glass effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-8">
                    <span className="px-6 py-3 bg-accent-400 text-black font-bold rounded-full text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                      Personalizar
                    </span>
                  </div>
                </div>
                <div className="space-y-1 px-2">
                  <h4 className="font-bold text-zinc-900 dark:text-white truncate group-hover:text-accent-500 transition-colors">{product.name}</h4>
                  <p className="text-sm text-zinc-500">{product.brand}</p>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Mobile: View all button */}
          <button 
            onClick={() => onNavigate('SHOP')}
            className="md:hidden w-full mt-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:scale-[1.02] transition-transform"
          >
            Ver Todo el Catálogo
          </button>
        </div>
      </section>

      {/* HOW IT WORKS - Opera Neon Style */}
      <section className="py-20 px-6 lg:px-12 bg-zinc-50 dark:bg-black relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-accent-400/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent-600/5 rounded-full blur-[80px]" />
        </div>
        
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-accent-400/10 rounded-full text-xs font-bold text-accent-500 uppercase tracking-widest mb-4">
              Proceso
            </span>
            <h3 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase">
              En 3 Simples Pasos
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
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
            ].map((item, index) => (
              <div 
                key={index} 
                className="relative text-center group"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Connector line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-accent-400/50 to-transparent" />
                )}
                
                <div className="relative w-20 h-20 mx-auto mb-6">
  
                  
                  <div className="relative w-full h-full bg-gradient-to-br from-accent-400 to-accent-600 rounded-3xl flex items-center justify-center shadow-lg dark:shadow-none transition-all duration-300">
                    <item.icon size={32} className="text-black" />
                  </div>
                </div>
                
                <span className="text-7xl font-black text-zinc-200 dark:text-zinc-800/50 absolute top-0 left-1/2 -translate-x-1/2 -z-10 select-none">
                  {item.step}
                </span>
                
                <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-accent-500 transition-colors">
                  {item.title}
                </h4>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APP MOCKUP SECTION */}
      <section className="py-20 px-6 lg:px-12 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-accent-500 uppercase tracking-widest">App Móvil</span>
              <h3 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase leading-tight">
                Diseña desde tu celular
              </h3>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Nuestro personalizador funciona perfecto en tu smartphone. 
                Visualiza en tiempo real cómo quedará tu grabado láser.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <div className="w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-black" />
                  </div>
                  Vista previa en tiempo real
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <div className="w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center">
                    <Star size={14} className="text-black" />
                  </div>
                  Múltiples fuentes y diseños
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <div className="w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center">
                    <Shield size={14} className="text-black" />
                  </div>
                  Calidad garantizada
                </li>
              </ul>
              <button 
                onClick={() => onNavigate('CUSTOMIZER')}
                className="group px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase text-sm tracking-wider rounded-2xl flex items-center gap-3 transition-all hover:scale-105"
              >
                Probar Ahora
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right: Phone Mockup */}
            <div className="relative flex justify-center">
              {/* Phone Frame */}
              <div className="relative w-[280px] h-[560px] bg-zinc-900 rounded-[3rem] p-3 shadow-2xl shadow-black/40 border-4 border-zinc-800 transform rotate-[-5deg]">
                {/* Phone Screen */}
                <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden relative">
                  {/* Mockup Header */}
                  <div className="h-14 bg-accent-400 flex items-center justify-between px-4">
                    <span className="font-black text-black text-sm">LM</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-black/30"></div>
                      <div className="w-2 h-2 rounded-full bg-black/30"></div>
                    </div>
                  </div>
                  
                  {/* Mockup Content - Product Preview */}
                  <div className="p-4 space-y-4">
                    <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
                      <img 
                        src={HERO_PRODUCTS[0].image}
                        alt="Preview"
                        className="w-3/4 h-3/4 object-contain"
                      />
                      {/* Floating text preview */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur rounded-xl p-3 text-center">
                        <p className="font-bold text-zinc-900 dark:text-white text-sm">Tu Nombre</p>
                      </div>
                    </div>
                    
                    {/* Mockup Controls */}
                    <div className="space-y-2">
                      <div className="h-8 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center px-3">
                        <span className="text-xs text-zinc-400">Escribe tu texto...</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-10 bg-accent-400 rounded-xl flex items-center justify-center">
                          <span className="text-xs font-bold text-black">Personalizar</span>
                        </div>
                        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                          <Star size={16} className="text-zinc-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Static badge */}
                  <div className="absolute top-20 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                    ¡Así quedará!
                  </div>
                </div>

                {/* Phone notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-6 bg-zinc-900 rounded-full"></div>
              </div>

              {/* Decorative blur */}
              <div className="absolute -z-10 w-64 h-64 bg-accent-400/20 rounded-full blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-zinc-900 dark:bg-zinc-800 rounded-[2rem] overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-400/20 to-transparent" />
            <div className="absolute right-0 top-0 w-64 h-64 bg-accent-400/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase">
                    ¿Listo para crear?
                  </h3>
                  <p className="text-zinc-400 max-w-md">
                    Diseña tu termo único hoy mismo. El grabado láser es permanente y de alta calidad.
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('CUSTOMIZER')}
                  className="group px-8 py-4 bg-accent-400 hover:bg-yellow-300 text-black font-black uppercase text-sm tracking-wider rounded-2xl flex items-center gap-3 transition-all hover:scale-105 whitespace-nowrap"
                >
                  Empezar a Diseñar
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER - Con datos de empresa */}
      <footer className="py-16 px-6 lg:px-12 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo y descripción */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-400 rounded-xl flex items-center justify-center">
                  <span className="font-black text-black text-lg">LM</span>
                </div>
                <span className="font-black text-2xl uppercase text-zinc-900 dark:text-white">
                  {storeConfig.businessName}
                </span>
              </div>
              <p className="text-zinc-500 max-w-sm">
                Personalización de termos y accesorios con grabado láser de alta calidad. Diseños únicos que duran para siempre.
              </p>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h4 className="font-bold text-zinc-900 dark:text-white uppercase text-sm tracking-wider">Contacto</h4>
              <div className="space-y-2 text-sm text-zinc-500">
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
              <h4 className="font-bold text-zinc-900 dark:text-white uppercase text-sm tracking-wider">Información de Pago</h4>
              {storeConfig.bankInfo ? (
                <div className="text-sm text-zinc-500 whitespace-pre-line">
                  {storeConfig.bankInfo}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Información bancaria no configurada</p>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} {storeConfig.businessName}. Todos los derechos reservados.
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
};

export default LandingPage;

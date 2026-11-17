import{localCalendarDate}from'../utils/calendarDate';
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Image as ImageIcon, Trash2, Save, Eye, EyeOff, 
  Percent, Calendar, Type, Upload, Star, MessageCircle, HelpCircle,
  Package, Clock, ChevronRight, RotateCcw, Sparkles
} from 'lucide-react';

// =============================================================================
// INTERFACES - Tipos de contenido
// =============================================================================

interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  showOnHome?: boolean;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  image: string;
  validUntil: string;
  code?: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  showOnHome?: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar?: string;
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

interface FeaturedProduct {
  id: string;
  productId: string;
  productName: string;
  image: string;
  customMessage?: string;
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

interface ContentConfig {
  banners: Banner[];
  promotions: Promotion[];
  testimonials: Testimonial[];
  faqs: FAQ[];
  featuredProducts: FeaturedProduct[];
}

interface ContentManagerProps {
  config: ContentConfig;
  onSave: (config: ContentConfig) => void | Promise<void>;
}

// =============================================================================
// DATOS POR DEFECTO
// =============================================================================

const DEFAULT_BANNER: Banner = {
  id: '',
  image: '',
  title: '',
  subtitle: '',
  link: '',
  active: true,
  order: 0,
  startDate: '',
  endDate: '',
  showOnHome: true
};

const DEFAULT_PROMOTION: Promotion = {
  id: '',
  title: '',
  description: '',
  discount: '',
  image: '',
  validUntil: '',
  code: '',
  active: true,
  startDate: '',
  endDate: '',
  showOnHome: true
};

const DEFAULT_TESTIMONIAL: Testimonial = {
  id: '',
  name: '',
  text: '',
  rating: 5,
  active: true,
  order: 0,
  startDate: '',
  endDate: ''
};

const DEFAULT_FAQ: FAQ = {
  id: '',
  question: '',
  answer: '',
  category: 'General',
  active: true,
  order: 0,
  startDate: '',
  endDate: ''
};

const DEFAULT_FEATURED_PRODUCT: FeaturedProduct = {
  id: '',
  productId: '',
  productName: '',
  image: '',
  customMessage: '',
  active: true,
  order: 0,
  startDate: '',
  endDate: ''
};

// =============================================================================
// COMPONENTE PRINCIPAL - DISEÑO MODERNO
// =============================================================================

type TabType = 'banners' | 'promotions' | 'testimonials' | 'faqs' | 'featured';

export const ContentManager: React.FC<ContentManagerProps> = ({ config, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>('banners');
  
  // Estados para cada tipo de contenido
  const [banners, setBanners] = useState<Banner[]>(config.banners || []);
  const [promotions, setPromotions] = useState<Promotion[]>(config.promotions || []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(config.testimonials || []);
  const [faqs, setFaqs] = useState<FAQ[]>(config.faqs || []);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>(config.featuredProducts || []);

  // Estados de edición
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [editingFeaturedProduct, setEditingFeaturedProduct] = useState<FeaturedProduct | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus,setSaveStatus]=useState('');
  const contentSnapshot=JSON.stringify({banners,promotions,testimonials,faqs,featuredProducts});
  const [savedSnapshot,setSavedSnapshot]=useState(contentSnapshot);
  const dirty=contentSnapshot!==savedSnapshot;
  const localState=useRef({contentSnapshot,savedSnapshot});localState.current={contentSnapshot,savedSnapshot};
  useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);

  useEffect(() => {
    setSavedSnapshot(JSON.stringify({banners:config.banners||[],promotions:config.promotions||[],testimonials:config.testimonials||[],faqs:config.faqs||[],featuredProducts:config.featuredProducts||[]}));
    if(localState.current.contentSnapshot!==localState.current.savedSnapshot)return;
    setBanners(config.banners || []);
    setPromotions(config.promotions || []);
    setTestimonials(config.testimonials || []);
    setFaqs(config.faqs || []);
    setFeaturedProducts(config.featuredProducts || []);
  }, [config]);

  // =============================================================================
  // HANDLERS
  // =============================================================================
  
  const handleSaveBanner = (banner: Banner) => {
    if (banner.id) {
      setBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
    } else {
      setBanners(prev => [...prev, { ...banner, id: Date.now().toString(), order: prev.length }]);
    }
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleDeleteBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const handleToggleBanner = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const handleSavePromotion = (promo: Promotion) => {
    if (promo.id) {
      setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p));
    } else {
      setPromotions(prev => [...prev, { ...promo, id: Date.now().toString() }]);
    }
    setEditingPromotion(null);
    setShowForm(false);
  };

  const handleDeletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const handleTogglePromotion = (id: string) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleSaveTestimonial = (testimonial: Testimonial) => {
    if (testimonial.id) {
      setTestimonials(prev => prev.map(t => t.id === testimonial.id ? testimonial : t));
    } else {
      setTestimonials(prev => [...prev, { ...testimonial, id: Date.now().toString(), order: prev.length }]);
    }
    setEditingTestimonial(null);
    setShowForm(false);
  };

  const handleDeleteTestimonial = (id: string) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleTestimonial = (id: string) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const handleSaveFAQ = (faq: FAQ) => {
    if (faq.id) {
      setFaqs(prev => prev.map(f => f.id === faq.id ? faq : f));
    } else {
      setFaqs(prev => [...prev, { ...faq, id: Date.now().toString(), order: prev.length }]);
    }
    setEditingFAQ(null);
    setShowForm(false);
  };

  const handleDeleteFAQ = (id: string) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
  };

  const handleToggleFAQ = (id: string) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const handleSaveFeaturedProduct = (product: FeaturedProduct) => {
    if (product.id) {
      setFeaturedProducts(prev => prev.map(p => p.id === product.id ? product : p));
    } else {
      setFeaturedProducts(prev => [...prev, { ...product, id: Date.now().toString(), order: prev.length }]);
    }
    setEditingFeaturedProduct(null);
    setShowForm(false);
  };

  const handleDeleteFeaturedProduct = (id: string) => {
    setFeaturedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleFeaturedProduct = (id: string) => {
    setFeaturedProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleSaveAll = async () => {
    if(isSaving)return;
    setIsSaving(true);setSaveStatus('Guardando contenido…');const snapshot=contentSnapshot;
    try{await onSave({banners,promotions,testimonials,faqs,featuredProducts});setSavedSnapshot(snapshot);setSaveStatus('Contenido guardado');}
    catch{setSaveStatus('No se guardó el contenido. Tus cambios siguen aquí; vuelve a intentar.');}
    finally{setIsSaving(false);}
  };

  // =============================================================================
  // CONFIGURACIÓN DE PESTAÑAS
  // =============================================================================

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    { id: 'banners', label: 'Banners', icon: <ImageIcon size={18} />, count: banners.length, color: 'from-pink-500 to-rose-500' },
    { id: 'promotions', label: 'Promociones', icon: <Percent size={18} />, count: promotions.length, color: 'from-yellow-500 to-orange-500' },
    { id: 'testimonials', label: 'Testimonios', icon: <MessageCircle size={18} />, count: testimonials.length, color: 'from-green-500 to-emerald-500' },
    { id: 'faqs', label: 'FAQ', icon: <HelpCircle size={18} />, count: faqs.length, color: 'from-blue-500 to-cyan-500' },
    { id: 'featured', label: 'Destacados', icon: <Star size={18} />, count: featuredProducts.length, color: 'from-violet-500 to-purple-500' },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="lm-content">
      <div className="admin-module-toolbar"><p role={saveStatus.startsWith('No se')?'alert':'status'}>{saveStatus.startsWith('No se')?saveStatus:isSaving?saveStatus:dirty?'Contenido con cambios sin guardar':saveStatus||'Contenido sin cambios'}</p><button onClick={handleSaveAll} disabled={isSaving||!dirty} className="bg-yellow-400 text-black rounded-lg px-4 py-2 font-semibold flex items-center gap-2"><Save size={16}/>{isSaving?'Guardando contenido…':'Guardar contenido'}</button></div>

      <label className="lm-content-select">Tipo de contenido<select value={activeTab} onChange={e=>{setActiveTab(e.target.value as TabType);setShowForm(false);}}>{tabs.map(t=><option key={t.id} value={t.id}>{t.label} ({t.count})</option>)}</select></label>
      {/* Tabs Modernas */}
      <div className="lm-content-tabs flex gap-3 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
            className={`relative px-6 py-4 rounded-2xl font-bold text-sm uppercase transition-all flex items-center gap-3 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-transparent rounded-2xl" />
            )}
            <span className="relative flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Contenido con animación */}
      <div className="animate-fadeIn">
        {activeTab === 'banners' && (
          <BannersSection
            banners={banners}
            editingBanner={editingBanner}
            showForm={showForm}
            onEdit={value=>{setEditingBanner(value);setShowForm(true);}}
            onSave={handleSaveBanner}
            onDelete={handleDeleteBanner}
            onToggle={handleToggleBanner}
            onShowForm={() => { setEditingBanner({ ...DEFAULT_BANNER }); setShowForm(true); }}
            onCloseForm={() => { setEditingBanner(null); setShowForm(false); }}
          />
        )}

        {activeTab === 'promotions' && (
          <PromotionsSection
            promotions={promotions}
            editingPromotion={editingPromotion}
            showForm={showForm}
            onEdit={value=>{setEditingPromotion(value);setShowForm(true);}}
            onSave={handleSavePromotion}
            onDelete={handleDeletePromotion}
            onToggle={handleTogglePromotion}
            onShowForm={() => { setEditingPromotion({ ...DEFAULT_PROMOTION }); setShowForm(true); }}
            onCloseForm={() => { setEditingPromotion(null); setShowForm(false); }}
          />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialsSection
            testimonials={testimonials}
            editingTestimonial={editingTestimonial}
            showForm={showForm}
            onEdit={value=>{setEditingTestimonial(value);setShowForm(true);}}
            onSave={handleSaveTestimonial}
            onDelete={handleDeleteTestimonial}
            onToggle={handleToggleTestimonial}
            onShowForm={() => { setEditingTestimonial({ ...DEFAULT_TESTIMONIAL }); setShowForm(true); }}
            onCloseForm={() => { setEditingTestimonial(null); setShowForm(false); }}
          />
        )}

        {activeTab === 'faqs' && (
          <FAQsSection
            faqs={faqs}
            editingFAQ={editingFAQ}
            showForm={showForm}
            onEdit={value=>{setEditingFAQ(value);setShowForm(true);}}
            onSave={handleSaveFAQ}
            onDelete={handleDeleteFAQ}
            onToggle={handleToggleFAQ}
            onShowForm={() => { setEditingFAQ({ ...DEFAULT_FAQ }); setShowForm(true); }}
            onCloseForm={() => { setEditingFAQ(null); setShowForm(false); }}
          />
        )}

        {activeTab === 'featured' && (
          <FeaturedProductsSection
            featuredProducts={featuredProducts}
            editingFeaturedProduct={editingFeaturedProduct}
            showForm={showForm}
            onEdit={value=>{setEditingFeaturedProduct(value);setShowForm(true);}}
            onSave={handleSaveFeaturedProduct}
            onDelete={handleDeleteFeaturedProduct}
            onToggle={handleToggleFeaturedProduct}
            onShowForm={() => { setEditingFeaturedProduct({ ...DEFAULT_FEATURED_PRODUCT }); setShowForm(true); }}
            onCloseForm={() => { setEditingFeaturedProduct(null); setShowForm(false); }}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// =============================================================================
// SECCIÓN DE BANNERS
// =============================================================================

const BannersSection: React.FC<{
  banners: Banner[];
  editingBanner: Banner | null;
  showForm: boolean;
  onEdit: (banner: Banner | null) => void;
  onSave: (banner: Banner) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
}> = ({ banners, editingBanner, showForm, onEdit, onSave, onDelete, onToggle, onShowForm, onCloseForm }) => (
  <div className="grid gap-6">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="group relative p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl text-zinc-500 font-bold hover:border-yellow-500 hover:text-yellow-500 transition-all flex items-center justify-center gap-4 bg-white/50 dark:bg-zinc-800/50 backdrop-blur"
      >
        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
          <Plus size={24} />
        </div>
        <span className="text-lg">Agregar Nuevo Banner</span>
      </button>
    )}

    {showForm && editingBanner && (
      <BannerForm
        key={editingBanner.id || 'new'}
        banner={editingBanner}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="grid md:grid-cols-2 gap-4">
      {[...banners].sort((a, b) => a.order - b.order).map((banner) => (
        <ModernCard
          key={banner.id}
          image={banner.image}
          title={banner.title}
          subtitle={banner.subtitle}
          active={banner.active}
          startDate={banner.startDate}
          endDate={banner.endDate}
          onToggle={() => onToggle(banner.id)}
          onEdit={() => onEdit(banner)}
          onDelete={() => onDelete(banner.id)}
          icon={<ImageIcon size={20} />}
          color="pink"
        />
      ))}
    </div>
  </div>
);

// =============================================================================
// SECCIÓN DE PROMOCIONES
// =============================================================================

const PromotionsSection: React.FC<{
  promotions: Promotion[];
  editingPromotion: Promotion | null;
  showForm: boolean;
  onEdit: (promotion: Promotion | null) => void;
  onSave: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
}> = ({ promotions, editingPromotion, showForm, onEdit, onSave, onDelete, onToggle, onShowForm, onCloseForm }) => (
  <div className="grid gap-6">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="group relative p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl text-zinc-500 font-bold hover:border-yellow-500 hover:text-yellow-500 transition-all flex items-center justify-center gap-4 bg-white/50 dark:bg-zinc-800/50 backdrop-blur"
      >
        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
          <Plus size={24} />
        </div>
        <span className="text-lg">Agregar Nueva Promoción</span>
      </button>
    )}

    {showForm && editingPromotion && (
      <PromotionForm
        key={editingPromotion.id || 'new'}
        promotion={editingPromotion}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {promotions.map((promo) => (
        <div
          key={promo.id}
          className={`group relative bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden transition-all hover:shadow-2xl ${
            promo.active ? 'shadow-lg' : 'opacity-60'
          }`}
        >
          {/* Badge de descuento */}
          {promo.discount && (
            <div className="absolute top-4 right-4 z-10 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-sm rounded-full shadow-lg">
              {promo.discount}
            </div>
          )}
          
          <div className="h-40 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
            {promo.image ? (
              <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Percent size={48} className="text-zinc-300 dark:text-zinc-600" />
              </div>
            )}
          </div>
          
          <div className="p-5">
            <h4 className="font-bold text-lg text-zinc-900 dark:text-white">{promo.title}</h4>
            <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{promo.description}</p>
            
            {promo.code && (
              <div className="mt-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <span className="text-xs text-zinc-400">Código: </span>
                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{promo.code}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex gap-2">
                <button
                  aria-label={`${promo.active?'Desactivar':'Activar'} ${promo.title}`} onClick={() => onToggle(promo.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    promo.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {promo.active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  aria-label={`Editar ${promo.title}`} onClick={() => onEdit(promo)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                >
                  <Type size={18} />
                </button>
                <button
                  aria-label={`Eliminar ${promo.title}`} onClick={() => onDelete(promo.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              {promo.validUntil && (
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Calendar size={12} />
                  {localCalendarDate(promo.validUntil).toLocaleDateString('es-MX')}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// =============================================================================
// SECCIÓN DE TESTIMONIOS
// =============================================================================

const TestimonialsSection: React.FC<{
  testimonials: Testimonial[];
  editingTestimonial: Testimonial | null;
  showForm: boolean;
  onEdit: (testimonial: Testimonial | null) => void;
  onSave: (testimonial: Testimonial) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
}> = ({ testimonials, editingTestimonial, showForm, onEdit, onSave, onDelete, onToggle, onShowForm, onCloseForm }) => (
  <div className="grid gap-6">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="group relative p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl text-zinc-500 font-bold hover:border-yellow-500 hover:text-yellow-500 transition-all flex items-center justify-center gap-4 bg-white/50 dark:bg-zinc-800/50 backdrop-blur"
      >
        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
          <Plus size={24} />
        </div>
        <span className="text-lg">Agregar Nuevo Testimonio</span>
      </button>
    )}

    {showForm && editingTestimonial && (
      <TestimonialForm
        key={editingTestimonial.id || 'new'}
        testimonial={editingTestimonial}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className={`relative bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-lg transition-all hover:shadow-2xl ${
            testimonial.active ? '' : 'opacity-60'
          }`}
        >
          {/* Quote Icon */}
          <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
            <MessageCircle size={20} className="text-white" />
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
              {testimonial.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white">{testimonial.name}</h4>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-200'}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">"{testimonial.text}"</p>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex gap-2">
              <button
                aria-label={`${testimonial.active?'Desactivar':'Activar'} ${testimonial.name}`} onClick={() => onToggle(testimonial.id)}
                className={`p-2 rounded-xl transition-colors ${
                  testimonial.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {testimonial.active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button
                aria-label={`Editar ${testimonial.name}`} onClick={() => onEdit(testimonial)}
                className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"
              >
                <Type size={18} />
              </button>
              <button
                aria-label={`Eliminar ${testimonial.name}`} onClick={() => onDelete(testimonial.id)}
                className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// =============================================================================
// SECCIÓN DE FAQS
// =============================================================================

const FAQsSection: React.FC<{
  faqs: FAQ[];
  editingFAQ: FAQ | null;
  showForm: boolean;
  onEdit: (faq: FAQ | null) => void;
  onSave: (faq: FAQ) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
}> = ({ faqs, editingFAQ, showForm, onEdit, onSave, onDelete, onToggle, onShowForm, onCloseForm }) => (
  <div className="grid gap-6">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="group relative p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl text-zinc-500 font-bold hover:border-yellow-500 hover:text-yellow-500 transition-all flex items-center justify-center gap-4 bg-white/50 dark:bg-zinc-800/50 backdrop-blur"
      >
        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
          <Plus size={24} />
        </div>
        <span className="text-lg">Agregar Nueva Pregunta FAQ</span>
      </button>
    )}

    {showForm && editingFAQ && (
      <FAQForm
        key={editingFAQ.id || 'new'}
        faq={editingFAQ}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="space-y-4">
      {faqs.map((faq) => (
        <div
          key={faq.id}
          className={`bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-lg transition-all ${
            faq.active ? '' : 'opacity-60'
          }`}
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                    {faq.category}
                  </span>
                </div>
                <h4 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                  <HelpCircle size={20} className="text-blue-500" />
                  {faq.question}
                </h4>
                <p className="text-zinc-600 dark:text-zinc-300 mt-3 pl-7">{faq.answer}</p>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <button
                  aria-label={`${faq.active?'Desactivar':'Activar'} ${faq.question}`} onClick={() => onToggle(faq.id)}
                  className={`p-3 rounded-xl transition-colors ${
                    faq.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {faq.active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  aria-label={`Editar ${faq.question}`} onClick={() => onEdit(faq)}
                  className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"
                >
                  <Type size={18} />
                </button>
                <button
                  aria-label={`Eliminar ${faq.question}`} onClick={() => onDelete(faq.id)}
                  className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// =============================================================================
// SECCIÓN DE PRODUCTOS DESTACADOS
// =============================================================================

const FeaturedProductsSection: React.FC<{
  featuredProducts: FeaturedProduct[];
  editingFeaturedProduct: FeaturedProduct | null;
  showForm: boolean;
  onEdit: (product: FeaturedProduct | null) => void;
  onSave: (product: FeaturedProduct) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
}> = ({ featuredProducts, editingFeaturedProduct, showForm, onEdit, onSave, onDelete, onToggle, onShowForm, onCloseForm }) => (
  <div className="grid gap-6">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="group relative p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl text-zinc-500 font-bold hover:border-yellow-500 hover:text-yellow-500 transition-all flex items-center justify-center gap-4 bg-white/50 dark:bg-zinc-800/50 backdrop-blur"
      >
        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
          <Plus size={24} />
        </div>
        <span className="text-lg">Agregar Producto Destacado</span>
      </button>
    )}

    {showForm && editingFeaturedProduct && (
      <FeaturedProductForm
        key={editingFeaturedProduct.id || 'new'}
        product={editingFeaturedProduct}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {featuredProducts.map((product) => (
        <div
          key={product.id}
          className={`group relative bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all ${
            product.active ? '' : 'opacity-60'
          }`}
        >
          {/* Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Star size={12} className="fill-white" />
              Destacado
            </div>
          </div>
          
          <div className="h-48 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
            {product.image ? (
              <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={48} className="text-zinc-300 dark:text-zinc-600" />
              </div>
            )}
          </div>
          
          <div className="p-5">
            <h4 className="font-bold text-zinc-900 dark:text-white line-clamp-1">{product.productName}</h4>
            {product.customMessage && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">{product.customMessage}</p>
            )}
            <p className="text-xs text-zinc-400 mt-2">ID: {product.productId}</p>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex gap-1">
                <button
                  aria-label={`${product.active?'Desactivar':'Activar'} ${product.productName}`} onClick={() => onToggle(product.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    product.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {product.active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  aria-label={`Editar ${product.productName}`} onClick={() => onEdit(product)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"
                >
                  <Type size={16} />
                </button>
                <button
                  aria-label={`Eliminar ${product.productName}`} onClick={() => onDelete(product.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// =============================================================================
// COMPONENTE DE TARJETA MODERNA
// =============================================================================

const ModernCard: React.FC<{
  image: string;
  title: string;
  subtitle?: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  icon: React.ReactNode;
  color: string;
}> = ({ image, title, subtitle, active, startDate, endDate, onToggle, onEdit, onDelete, icon, color }) => {
  const colorClasses: Record<string, string> = {
    pink: 'from-pink-500 to-rose-500',
    yellow: 'from-yellow-500 to-orange-500',
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    violet: 'from-violet-500 to-purple-500',
  };
  
  return (
    <div className={`group relative bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all ${active ? '' : 'opacity-60'}`}>
      <div className="flex">
        <div className="w-40 h-32 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex-shrink-0 relative">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center text-white`}>
                {icon}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white">{title}</h4>
            {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
            
            {(startDate || endDate) && (
              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                <Clock size={12} />
                {startDate && `${localCalendarDate(startDate).toLocaleDateString('es-MX')}`}
                {startDate && endDate && ' - '}
                {endDate && `${localCalendarDate(endDate).toLocaleDateString('es-MX')}`}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <button
              aria-label={`${active?'Desactivar':'Activar'} ${title}`} onClick={onToggle}
              className={`p-2 rounded-xl transition-colors ${
                active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {active ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              aria-label={`Editar ${title}`} onClick={onEdit}
              className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"
            >
              <Type size={16} />
            </button>
            <button
              aria-label={`Eliminar ${title}`} onClick={onDelete}
              className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// FORMULARIOS MODERNOS
// =============================================================================

const BannerForm: React.FC<{
  banner: Banner;
  onSave: (banner: Banner) => void;
  onCancel: () => void;
}> = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Banner>(banner);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-2xl text-zinc-900 dark:text-white">{banner.id ? 'Editar Banner' : 'Nuevo Banner'}</h3>
        <button type="button" aria-label="Cerrar formulario" onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
          <X size={24} className="text-zinc-400" />
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">URL de imagen</label>
          <input aria-label="URL de imagen"
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Título</label>
          <input aria-label="Título"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Nueva Colección"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Subtítulo</label>
          <input aria-label="Subtítulo"
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="Ej: Descubre los nuevos modelos"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Link</label>
          <input aria-label="Link"
            type="text"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="Ej: /catalogo"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio</label>
          <input aria-label="Fecha inicio"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin</label>
          <input aria-label="Fecha fin"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="font-medium">Activo</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showOnHome}
              onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="font-medium">Mostrar en inicio</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          className="flex-1 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold rounded-xl transition-all transform hover:scale-[1.02]"
        >
          Guardar Banner
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

const PromotionForm: React.FC<{
  promotion: Promotion;
  onSave: (promotion: Promotion) => void;
  onCancel: () => void;
}> = ({ promotion, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Promotion>(promotion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-2xl text-zinc-900 dark:text-white">{promotion.id ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
        <button type="button" aria-label="Cerrar formulario" onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
          <X size={24} className="text-zinc-400" />
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">URL de imagen</label>
          <input aria-label="URL de imagen"
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Título</label>
          <input aria-label="Título"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: 2x1 en Grabados"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Descripción</label>
          <textarea aria-label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ej: Compra un termo y el segundo grabado es Gratis"
            rows={3}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Descuento</label>
          <input aria-label="Descuento"
            type="text"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            placeholder="Ej: 20% o $150"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Código de cupón</label>
          <input aria-label="Código de cupón"
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Ej: VERANO20"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Válido hasta</label>
          <input aria-label="Válido hasta"
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio</label>
          <input aria-label="Fecha inicio"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin</label>
          <input aria-label="Fecha fin"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="font-medium">Activo</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showOnHome}
              onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="font-medium">Mostrar en inicio</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          className="flex-1 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold rounded-xl transition-all transform hover:scale-[1.02]"
        >
          Guardar Promoción
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

const TestimonialForm: React.FC<{
  testimonial: Testimonial;
  onSave: (testimonial: Testimonial) => void;
  onCancel: () => void;
}> = ({ testimonial, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Testimonial>(testimonial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-2xl text-zinc-900 dark:text-white">{testimonial.id ? 'Editar Testimonio' : 'Nuevo Testimonio'}</h3>
        <button type="button" aria-label="Cerrar formulario" onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
          <X size={24} className="text-zinc-400" />
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Nombre del cliente</label>
          <input aria-label="Nombre del cliente"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: María García"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Calificación</label>
          <div className="flex gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                aria-label={`${star} ${star===1?'estrella':'estrellas'}`} aria-pressed={formData.rating===star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className="p-2 transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Testimonio</label>
          <textarea aria-label="Testimonio"
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            placeholder="Escribe el testimonio del cliente..."
            rows={4}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio</label>
          <input aria-label="Fecha inicio"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin</label>
          <input aria-label="Fecha fin"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="font-medium">Activo</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          className="flex-1 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold rounded-xl transition-all transform hover:scale-[1.02]"
        >
          Guardar Testimonio
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

const FAQForm: React.FC<{
  faq: FAQ;
  onSave: (faq: FAQ) => void;
  onCancel: () => void;
}> = ({ faq, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FAQ>(faq);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const categories = ['General', 'Pedidos', 'Grabados', 'Envíos', 'Garantías', 'Pagos'];

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-2xl text-zinc-900 dark:text-white">{faq.id ? 'Editar Pregunta' : 'Nueva Pregunta FAQ'}</h3>
        <button type="button" aria-label="Cerrar formulario" onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
          <X size={24} className="text-zinc-400" />
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Categoría</label>
          <select aria-label="Categoría"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio</label>
          <input aria-label="Fecha inicio"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Pregunta</label>
          <input aria-label="Pregunta"
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="Ej: ¿Cuánto dura el grabado?"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Respuesta</label>
          <textarea aria-label="Respuesta"
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            placeholder="Escribe la respuesta..."
            rows={4}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin</label>
          <input aria-label="Fecha fin"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer mt-6">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="font-medium">Activo</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          className="flex-1 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold rounded-xl transition-all transform hover:scale-[1.02]"
        >
          Guardar FAQ
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

const FeaturedProductForm: React.FC<{
  product: FeaturedProduct;
  onSave: (product: FeaturedProduct) => void;
  onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FeaturedProduct>(product);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-2xl text-zinc-900 dark:text-white">{product.id ? 'Editar Producto' : 'Nuevo Producto Destacado'}</h3>
        <button type="button" aria-label="Cerrar formulario" onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
          <X size={24} className="text-zinc-400" />
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">ID del producto</label>
          <input aria-label="ID del producto"
            type="text"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            placeholder="Ej: yeti-30oz-navy"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Nombre del producto</label>
          <input aria-label="Nombre del producto"
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="Ej: YETI Rambler 30oz Navy"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">URL de imagen</label>
          <input aria-label="URL de imagen"
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://ejemplo.com/producto.jpg"
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Mensaje personalizado</label>
          <textarea aria-label="Mensaje personalizado"
            value={formData.customMessage}
            onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
            placeholder="Ej: ¡El más vendido del mes!"
            rows={2}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio</label>
          <input aria-label="Fecha inicio"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin</label>
          <input aria-label="Fecha fin"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="font-medium">Activo</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          className="flex-1 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold rounded-xl transition-all transform hover:scale-[1.02]"
        >
          Guardar Producto
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default ContentManager;

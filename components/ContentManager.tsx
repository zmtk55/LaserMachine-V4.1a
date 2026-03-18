import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Image as ImageIcon, Trash2, Save, Eye, EyeOff, 
  Percent, Calendar, Type, Upload, Star, MessageCircle, HelpCircle,
  Package, Clock, GripVertical, ChevronDown, ChevronUp
} from 'lucide-react';

// =============================================================================
// INTERFACES - Tipos de contenido mejorados
// =============================================================================

interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
  order: number;
  // Programación
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
  // Programación
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
  // Programación
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
  // Programación
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
  // Programación
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
  onSave: (config: ContentConfig) => void;
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
// COMPONENTE PRINCIPAL
// =============================================================================

type TabType = 'banners' | 'promotions' | 'testimonials' | 'faqs' | 'featured';

export const ContentManager: React.FC<ContentManagerProps> = ({ config, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>('banners');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
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

  useEffect(() => {
    setBanners(config.banners || []);
    setPromotions(config.promotions || []);
    setTestimonials(config.testimonials || []);
    setFaqs(config.faqs || []);
    setFeaturedProducts(config.featuredProducts || []);
  }, [config]);

  // =============================================================================
  // HANDLERS - BANNERS
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
    if (confirm('¿Eliminar este banner?')) {
      setBanners(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleToggleBanner = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  // =============================================================================
  // HANDLERS - PROMOTIONS
  // =============================================================================

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
    if (confirm('¿Eliminar esta promoción?')) {
      setPromotions(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleTogglePromotion = (id: string) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  // =============================================================================
  // HANDLERS - TESTIMONIALS
  // =============================================================================

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
    if (confirm('¿Eliminar este testimonio?')) {
      setTestimonials(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleTestimonial = (id: string) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  // =============================================================================
  // HANDLERS - FAQS
  // =============================================================================

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
    if (confirm('¿Eliminar esta pregunta?')) {
      setFaqs(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleToggleFAQ = (id: string) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  // =============================================================================
  // HANDLERS - FEATURED PRODUCTS
  // =============================================================================

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
    if (confirm('¿Eliminar este producto destacado?')) {
      setFeaturedProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleFeaturedProduct = (id: string) => {
    setFeaturedProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  // =============================================================================
  // GUARDAR TODO
  // =============================================================================

  const handleSaveAll = () => {
    onSave({ banners, promotions, testimonials, faqs, featuredProducts });
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'banners', label: 'Banners', icon: <ImageIcon size={18} />, count: banners.length },
    { id: 'promotions', label: 'Promociones', icon: <Percent size={18} />, count: promotions.length },
    { id: 'testimonials', label: 'Testimonios', icon: <MessageCircle size={18} />, count: testimonials.length },
    { id: 'faqs', label: 'Preguntas FAQ', icon: <HelpCircle size={18} />, count: faqs.length },
    { id: 'featured', label: 'Productos Destacados', icon: <Star size={18} />, count: featuredProducts.length },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white uppercase flex items-center gap-3">
              <Package size={28} className="text-yellow-400" />
              Gestión de Contenido
            </h2>
            <p className="text-zinc-400 mt-1">Administra todo el contenido dinámico de tu tienda</p>
          </div>
          <button
            onClick={handleSaveAll}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-sm rounded-xl flex items-center gap-2 transition-colors shadow-lg"
          >
            <Save size={18} />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
            className={`px-4 py-3 rounded-xl font-bold text-sm uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {activeTab === 'banners' && (
          <BannersSection
            banners={banners}
            editingBanner={editingBanner}
            showForm={showForm}
            onEdit={setEditingBanner}
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
            onEdit={setEditingPromotion}
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
            onEdit={setEditingTestimonial}
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
            onEdit={setEditingFAQ}
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
            onEdit={setEditingFeaturedProduct}
            onSave={handleSaveFeaturedProduct}
            onDelete={handleDeleteFeaturedProduct}
            onToggle={handleToggleFeaturedProduct}
            onShowForm={() => { setEditingFeaturedProduct({ ...DEFAULT_FEATURED_PRODUCT }); setShowForm(true); }}
            onCloseForm={() => { setEditingFeaturedProduct(null); setShowForm(false); }}
          />
        )}
      </div>
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
  <div className="space-y-4">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-bold hover:border-yellow-400 hover:text-yellow-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Agregar Banner
      </button>
    )}

    {showForm && editingBanner && (
      <BannerForm
        banner={editingBanner}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="grid gap-4">
      {banners.sort((a, b) => a.order - b.order).map((banner, index) => (
        <ContentCard
          key={banner.id}
          title={banner.title}
          subtitle={banner.subtitle}
          image={banner.image}
          active={banner.active}
          startDate={banner.startDate}
          endDate={banner.endDate}
          onToggle={() => onToggle(banner.id)}
          onEdit={() => { onEdit(banner); }}
          onDelete={() => onDelete(banner.id)}
          index={index}
          total={banners.length}
          onMoveUp={() => {
            const newBanners = [...banners];
            [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
          }}
          onMoveDown={() => {
            const newBanners = [...banners];
            [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
          }}
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
  <div className="space-y-4">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-bold hover:border-yellow-400 hover:text-yellow-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Agregar Promoción
      </button>
    )}

    {showForm && editingPromotion && (
      <PromotionForm
        promotion={editingPromotion}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="grid gap-4">
      {promotions.map((promo) => (
        <div
          key={promo.id}
          className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all ${
            promo.active ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800 opacity-60'
          }`}
        >
          <div className="flex">
            <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
              {promo.image ? (
                <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Percent size={32} className="text-zinc-400" />
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white">{promo.title}</h4>
                    <span className="px-2 py-0.5 bg-yellow-400 text-black text-xs font-bold rounded">
                      {promo.discount}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">{promo.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400 flex-wrap">
                    {promo.validUntil && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Vence: {new Date(promo.validUntil).toLocaleDateString('es-MX')}
                      </span>
                    )}
                    {promo.code && (
                      <span className="flex items-center gap-1">
                        <Percent size={12} />
                        Código: {promo.code}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggle(promo.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      promo.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                    }`}
                    title={promo.active ? 'Activa' : 'Inactiva'}
                  >
                    {promo.active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => { onEdit(promo); }}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Type size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(promo.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
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
  <div className="space-y-4">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-bold hover:border-yellow-400 hover:text-yellow-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Agregar Testimonio
      </button>
    )}

    {showForm && editingTestimonial && (
      <TestimonialForm
        testimonial={editingTestimonial}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="grid md:grid-cols-2 gap-4">
      {testimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 p-6 transition-all ${
            testimonial.active ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold">
                {testimonial.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">{testimonial.name}</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(testimonial.id)}
                className={`p-2 rounded-lg transition-colors ${
                  testimonial.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {testimonial.active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button
                onClick={() => onEdit(testimonial)}
                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
              >
                <Type size={18} />
              </button>
              <button
                onClick={() => onDelete(testimonial.id)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm">{testimonial.text}</p>
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
  <div className="space-y-4">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-bold hover:border-yellow-400 hover:text-yellow-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Agregar Pregunta FAQ
      </button>
    )}

    {showForm && editingFAQ && (
      <FAQForm
        faq={editingFAQ}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="space-y-3">
      {faqs.map((faq) => (
        <div
          key={faq.id}
          className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all ${
            faq.active ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800 opacity-60'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase">{faq.category}</span>
                <h4 className="font-bold text-zinc-900 dark:text-white mt-1">{faq.question}</h4>
                <p className="text-sm text-zinc-500 mt-2">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onToggle(faq.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    faq.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {faq.active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  onClick={() => onEdit(faq)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                >
                  <Type size={18} />
                </button>
                <button
                  onClick={() => onDelete(faq.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
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
  <div className="space-y-4">
    {!showForm && (
      <button
        onClick={onShowForm}
        className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-bold hover:border-yellow-400 hover:text-yellow-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Agregar Producto Destacado
      </button>
    )}

    {showForm && editingFeaturedProduct && (
      <FeaturedProductForm
        product={editingFeaturedProduct}
        onSave={onSave}
        onCancel={onCloseForm}
      />
    )}

    <div className="grid md:grid-cols-3 gap-4">
      {featuredProducts.map((product) => (
        <div
          key={product.id}
          className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all ${
            product.active ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800 opacity-60'
          }`}
        >
          <div className="h-32 bg-zinc-100 dark:bg-zinc-800">
            {product.image ? (
              <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={32} className="text-zinc-400" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h4 className="font-bold text-zinc-900 dark:text-white">{product.productName}</h4>
            {product.customMessage && (
              <p className="text-xs text-zinc-500 mt-1">{product.customMessage}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-zinc-400">ID: {product.productId}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onToggle(product.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    product.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {product.active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => onEdit(product)}
                  className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                >
                  <Type size={14} />
                </button>
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  <Trash2 size={14} />
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
// COMPONENTE DE TARJETA DE CONTENIDO (Reutilizable)
// =============================================================================

const ContentCard: React.FC<{
  title: string;
  subtitle?: string;
  image: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  total: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}> = ({ title, subtitle, image, active, startDate, endDate, onToggle, onEdit, onDelete, index, total, onMoveUp, onMoveDown }) => (
  <div className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all ${
    active ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800 opacity-60'
  }`}>
    <div className="flex">
      <div className="w-48 h-32 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-zinc-400" />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white">{title}</h4>
              {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggle}
                className={`p-2 rounded-lg transition-colors ${
                  active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                }`}
                title={active ? 'Activo' : 'Inactivo'}
              >
                {active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button
                onClick={onEdit}
                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Type size={18} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
              <Clock size={12} />
              {startDate && `Desde: ${new Date(startDate).toLocaleDateString('es-MX')}`}
              {startDate && endDate && ' - '}
              {endDate && `Hasta: ${new Date(endDate).toLocaleDateString('es-MX')}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-zinc-400">Orden: {index + 1}</span>
          {index > 0 && onMoveUp && (
            <button onClick={onMoveUp} className="text-xs text-blue-500 hover:underline">Subir</button>
          )}
          {index < total - 1 && onMoveDown && (
            <button onClick={onMoveDown} className="text-xs text-blue-500 hover:underline">Bajar</button>
          )}
        </div>
      </div>
    </div>
  </div>
);

// =============================================================================
// FORMULARIOS
// =============================================================================

// Banner Form
const BannerForm: React.FC<{
  banner: Banner;
  onSave: (banner: Banner) => void;
  onCancel: () => void;
}> = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Banner>(banner);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border-2 border-yellow-400">
      <h3 className="font-bold text-lg mb-4">{banner.id ? 'Editar Banner' : 'Nuevo Banner'}</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">URL de la imagen</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1">Recomendado: 800x400px</p>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Título</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Nueva Colección"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Subtítulo</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="Ej: Descubre los nuevos modelos"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Link</label>
          <input
            type="text"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="Ej: /catalogo"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300"
            />
            <span className="text-sm">Activo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showOnHome}
              onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300"
            />
            <span className="text-sm">Mostrar en inicio</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onSave(formData)}
          className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-colors"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// Promotion Form
const PromotionForm: React.FC<{
  promotion: Promotion;
  onSave: (promotion: Promotion) => void;
  onCancel: () => void;
}> = ({ promotion, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Promotion>(promotion);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border-2 border-yellow-400">
      <h3 className="font-bold text-lg mb-4">{promotion.id ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">URL de imagen</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Título</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: 2x1 en Grabados"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ej: Compra un termo y el segundo grabado es Gratis"
            rows={3}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Descuento</label>
          <input
            type="text"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            placeholder="Ej: 20% o $150"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Código de cupón</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Ej: VERANO20"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Válido hasta</label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300"
            />
            <span className="text-sm">Activo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showOnHome}
              onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300"
            />
            <span className="text-sm">Mostrar en inicio</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onSave(formData)}
          className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-colors"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// Testimonial Form
const TestimonialForm: React.FC<{
  testimonial: Testimonial;
  onSave: (testimonial: Testimonial) => void;
  onCancel: () => void;
}> = ({ testimonial, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Testimonial>(testimonial);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border-2 border-yellow-400">
      <h3 className="font-bold text-lg mb-4">{testimonial.id ? 'Editar Testimonio' : 'Nuevo Testimonio'}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Nombre del cliente</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: María García"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Testimonio</label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            placeholder="Ej: Increíble calidad de grabado..."
            rows={4}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Calificación</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className="p-2 transition-colors"
              >
                <Star
                  size={28}
                  className={star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio (opcional)</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin (opcional)</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="testimonial-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300"
          />
          <label htmlFor="testimonial-active" className="text-sm">Activo</label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onSave(formData)}
          className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-colors"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// FAQ Form
const FAQForm: React.FC<{
  faq: FAQ;
  onSave: (faq: FAQ) => void;
  onCancel: () => void;
}> = ({ faq, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FAQ>(faq);

  const categories = ['General', 'Pedidos', 'Grabados', 'Envíos', 'Garantías', 'Pagos'];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border-2 border-yellow-400">
      <h3 className="font-bold text-lg mb-4">{faq.id ? 'Editar Pregunta' : 'Nueva Pregunta FAQ'}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Categoría</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Pregunta</label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="Ej: ¿Cuánto dura el grabado?"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Respuesta</label>
          <textarea
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            placeholder="Ej: El grabado tiene una durabilidad de..."
            rows={4}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio (opcional)</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin (opcional)</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="faq-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300"
          />
          <label htmlFor="faq-active" className="text-sm">Activo</label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onSave(formData)}
          className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-colors"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// Featured Product Form
const FeaturedProductForm: React.FC<{
  product: FeaturedProduct;
  onSave: (product: FeaturedProduct) => void;
  onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FeaturedProduct>(product);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border-2 border-yellow-400">
      <h3 className="font-bold text-lg mb-4">{product.id ? 'Editar Producto' : 'Nuevo Producto Destacado'}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">ID del producto</label>
          <input
            type="text"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            placeholder="Ej: yeti-30oz-navy"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Nombre del producto</label>
          <input
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="Ej: YETI Rambler 30oz Navy"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">URL de imagen</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://ejemplo.com/producto.jpg"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Mensaje personalizado</label>
          <textarea
            value={formData.customMessage}
            onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
            placeholder="Ej: ¡El más vendido del mes!"
            rows={2}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha inicio</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Fecha fin</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="product-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300"
          />
          <label htmlFor="product-active" className="text-sm">Activo</label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onSave(formData)}
          className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-colors"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ContentManager;

import React, { useState, useEffect } from 'react';
import { X, Plus, Image as ImageIcon, Trash2, Save, Eye, EyeOff, Percent, Calendar, Type, Upload } from 'lucide-react';

interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
  order: number;
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
}

interface ContentConfig {
  banners: Banner[];
  promotions: Promotion[];
}

interface ContentManagerProps {
  config: ContentConfig;
  onSave: (config: ContentConfig) => void;
}

const DEFAULT_BANNER: Banner = {
  id: '',
  image: '',
  title: '',
  subtitle: '',
  link: '',
  active: true,
  order: 0
};

const DEFAULT_PROMOTION: Promotion = {
  id: '',
  title: '',
  description: '',
  discount: '',
  image: '',
  validUntil: '',
  code: '',
  active: true
};

export const ContentManager: React.FC<ContentManagerProps> = ({ config, onSave }) => {
  const [activeTab, setActiveTab] = useState<'banners' | 'promotions'>('banners');
  const [banners, setBanners] = useState<Banner[]>(config.banners || []);
  const [promotions, setPromotions] = useState<Promotion[]>(config.promotions || []);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setBanners(config.banners || []);
    setPromotions(config.promotions || []);
  }, [config]);

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

  const handleSaveAll = () => {
    onSave({ banners, promotions });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase">Gestión de Contenido</h2>
          <p className="text-sm text-zinc-500 mt-1">Administra banners y promociones del dashboard del cliente</p>
        </div>
        <button
          onClick={handleSaveAll}
          className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-sm rounded-xl flex items-center gap-2 transition-colors"
        >
          <Save size={18} />
          Guardar Cambios
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('banners'); setShowForm(false); }}
          className={`px-6 py-3 rounded-xl font-bold text-sm uppercase transition-all ${
            activeTab === 'banners'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Banners ({banners.length})
        </button>
        <button
          onClick={() => { setActiveTab('promotions'); setShowForm(false); }}
          className={`px-6 py-3 rounded-xl font-bold text-sm uppercase transition-all ${
            activeTab === 'promotions'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Promociones ({promotions.length})
        </button>
      </div>

      {/* BANNERS TAB */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          {!showForm && (
            <button
              onClick={() => { setEditingBanner({ ...DEFAULT_BANNER }); setShowForm(true); }}
              className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-bold hover:border-yellow-400 hover:text-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Agregar Banner
            </button>
          )}

          {showForm && editingBanner && (
            <BannerForm
              banner={editingBanner}
              onSave={handleSaveBanner}
              onCancel={() => { setEditingBanner(null); setShowForm(false); }}
            />
          )}

          <div className="grid gap-4">
            {banners.sort((a, b) => a.order - b.order).map((banner, index) => (
              <div
                key={banner.id}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all ${
                  banner.active ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex">
                  <div className="w-48 h-32 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                    {banner.image ? (
                      <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
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
                          <h4 className="font-bold text-zinc-900 dark:text-white">{banner.title}</h4>
                          {banner.subtitle && (
                            <p className="text-sm text-zinc-500">{banner.subtitle}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleBanner(banner.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              banner.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                            }`}
                            title={banner.active ? 'Activo' : 'Inactivo'}
                          >
                            {banner.active ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button
                            onClick={() => { setEditingBanner(banner); setShowForm(true); }}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Type size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      {banner.link && (
                        <p className="text-xs text-zinc-400 mt-2">Link: {banner.link}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-zinc-400">Orden: {index + 1}</span>
                      {index > 0 && (
                        <button
                          onClick={() => {
                            const newBanners = [...banners];
                            [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
                            setBanners(newBanners.map((b, i) => ({ ...b, order: i })));
                          }}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Subir
                        </button>
                      )}
                      {index < banners.length - 1 && (
                        <button
                          onClick={() => {
                            const newBanners = [...banners];
                            [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
                            setBanners(newBanners.map((b, i) => ({ ...b, order: i })));
                          }}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Bajar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROMOTIONS TAB */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          {!showForm && (
            <button
              onClick={() => { setEditingPromotion({ ...DEFAULT_PROMOTION }); setShowForm(true); }}
              className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-bold hover:border-yellow-400 hover:text-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Agregar Promoción
            </button>
          )}

          {showForm && editingPromotion && (
            <PromotionForm
              promotion={editingPromotion}
              onSave={handleSavePromotion}
              onCancel={() => { setEditingPromotion(null); setShowForm(false); }}
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
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Vence: {new Date(promo.validUntil).toLocaleDateString('es-MX')}
                          </span>
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
                          onClick={() => handleTogglePromotion(promo.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            promo.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                          }`}
                          title={promo.active ? 'Activa' : 'Inactiva'}
                        >
                          {promo.active ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          onClick={() => { setEditingPromotion(promo); setShowForm(true); }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Type size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promo.id)}
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
      )}
    </div>
  );
};

// Banner Form Component
const BannerForm: React.FC<{
  banner: Banner;
  onSave: (banner: Banner) => void;
  onCancel: () => void;
}> = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Banner>(banner);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border-2 border-yellow-400">
      <h3 className="font-bold text-lg mb-4">{banner.id ? 'Editar Banner' : 'Nuevo Banner'}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">URL de la imagen</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            />
            <button className="px-4 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-zinc-600">
              <Upload size={18} />
            </button>
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
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Subtítulo (opcional)</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="Ej: Descubre los nuevos modelos"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Link (opcional)</label>
          <input
            type="text"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="Ej: /catalogo"
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="banner-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300"
          />
          <label htmlFor="banner-active" className="text-sm">Activo</label>
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

// Promotion Form Component
const PromotionForm: React.FC<{
  promotion: Promotion;
  onSave: (promo: Promotion) => void;
  onCancel: () => void;
}> = ({ promotion, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Promotion>(promotion);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border-2 border-yellow-400">
      <h3 className="font-bold text-lg mb-4">{promotion.id ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">URL de la imagen</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            />
            <button className="px-4 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-zinc-600">
              <Upload size={18} />
            </button>
          </div>
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

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ej: Compra un termo y el segundo grabado es GRATIS"
            rows={2}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Descuento</label>
            <input
              type="text"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              placeholder="Ej: 50% OFF"
              className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Código (opcional)</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ej: GRABADO50"
              className="w-full px-4 py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            />
          </div>
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="promo-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300"
          />
          <label htmlFor="promo-active" className="text-sm">Activa</label>
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

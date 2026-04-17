import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Percent,
  Calendar,
  Type,
  Upload,
  Smartphone,
  Sparkles,
  ArrowRight,
  Link2,
  FolderOpen,
  Bell,
  Info,
  FileJson
} from 'lucide-react';

/** Coincide con ClientDashboard: tarjeta ~280×144 px en pantalla */
export const BANNER_IMAGE_SPEC = {
  ratioLabel: '2:1',
  recommendExport: '1200 × 600 px',
  onScreen: '280 × 144 px',
  note: 'JPG/WebP, peso ideal < 500 KB'
};

/** Miniatura en lista de promos del portal */
export const PROMO_IMAGE_SPEC = {
  ratioLabel: '1:1',
  recommendExport: '400 × 400 px (mín.)',
  onScreen: '96 × 96 px',
  note: 'PNG o WebP con buen contraste'
};

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

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selecciona un archivo de imagen'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type ImageFieldVariant = 'banner' | 'promo';

const ImageAssetField: React.FC<{
  value: string;
  onChange: (url: string) => void;
  variant: ImageFieldVariant;
  idPrefix: string;
}> = ({ value, onChange, variant, idPrefix }) => {
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const spec = variant === 'banner' ? BANNER_IMAGE_SPEC : PROMO_IMAGE_SPEC;
  const previewBox =
    variant === 'banner'
      ? 'aspect-[280/144] w-full max-w-[280px]'
      : 'aspect-square w-full max-w-[160px]';

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      setError('');
      try {
        const dataUrl = await readImageFile(f);
        onChange(dataUrl);
        setMode('url');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'No se pudo leer el archivo');
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
            mode === 'url'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
              : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          <Link2 size={14} />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
            mode === 'file'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
              : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          <FolderOpen size={14} />
          Archivo
        </button>
      </div>

      {mode === 'url' ? (
        <input
          id={`${idPrefix}-url`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… o pega un data:image si ya lo tienes"
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
        />
      ) : (
        <div>
          <input
            ref={fileRef}
            id={`${idPrefix}-file`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            className="sr-only"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                : 'border-zinc-300 bg-zinc-50 hover:border-amber-400 dark:border-zinc-700 dark:bg-zinc-900/50'
            }`}
          >
            <Upload className="mx-auto mb-2 text-zinc-400" size={28} />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Arrastra una imagen o haz clic</p>
            <p className="mt-1 text-xs text-zinc-500">JPG, PNG, WebP, GIF, SVG</p>
          </div>
        </div>
      )}

      {error && <p className="text-xs font-bold text-red-600">{error}</p>}

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="mb-1 flex items-center gap-1.5 font-black uppercase tracking-wide text-amber-800 dark:text-amber-400">
          <Info size={14} />
          Medidas recomendadas
        </div>
        <ul className="space-y-0.5 text-[11px] leading-relaxed">
          <li>
            Exportar: <strong>{spec.recommendExport}</strong> · Proporción {spec.ratioLabel}
          </li>
          <li>
            En pantalla (portal): <strong>{spec.onScreen}</strong>
          </li>
          <li>{spec.note}</li>
        </ul>
      </div>

      {value ? (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vista previa del recorte</p>
          <div className={`overflow-hidden rounded-2xl border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 ${previewBox}`}>
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      ) : (
        <div className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 ${previewBox}`}>
          <ImageIcon className="text-zinc-300" size={32} />
        </div>
      )}
    </div>
  );
};

function PortalHomePreview({ banners, promotions }: { banners: Banner[]; promotions: Promotion[] }) {
  const activeBanners = useMemo(
    () => [...banners].filter((b) => b.active).sort((a, b) => a.order - b.order),
    [banners]
  );
  const activePromos = useMemo(
    () => promotions.filter((p) => p.active).slice(0, 2),
    [promotions]
  );

  return (
    <div className="sticky top-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-zinc-500">
          <MonitorIcon />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Vista previa en vivo</span>
        </div>
      </div>

      <div className="mx-auto max-w-[300px] overflow-hidden rounded-[2rem] border-[6px] border-zinc-800 bg-zinc-950 shadow-2xl ring-1 ring-zinc-700/50">
        <div className="flex h-7 items-end justify-center rounded-t-[1.4rem] bg-zinc-900 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>
        <div className="max-h-[min(520px,70vh)] space-y-4 overflow-y-auto rounded-b-[1.25rem] bg-zinc-50 p-3 dark:bg-zinc-950">
          <p className="text-center text-[9px] font-bold uppercase tracking-widest text-zinc-500">Pestaña Inicio</p>

          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900 dark:text-white">
              <Bell size={12} className="text-amber-500" />
              Novedades
            </h4>
            {activeBanners.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 py-6 text-center text-[10px] text-zinc-400 dark:border-zinc-700">
                Sin banners activos
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeBanners.map((banner) => (
                  <div key={banner.id} className="w-[min(260px,85vw)] flex-shrink-0 snap-start">
                    <div className="relative h-[130px] overflow-hidden rounded-2xl">
                      {banner.image ? (
                        <img src={banner.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-zinc-200 text-[10px] text-zinc-500">Sin imagen</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="line-clamp-2 text-[11px] font-bold text-white">{banner.title || 'Título'}</p>
                        {banner.subtitle && <p className="line-clamp-1 text-[9px] text-zinc-300">{banner.subtitle}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900 dark:text-white">
              <Percent size={12} className="text-amber-500" />
              Promociones activas
            </h4>
            {activePromos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 py-6 text-center text-[10px] text-zinc-400 dark:border-zinc-700">
                Sin promociones activas
              </div>
            ) : (
              <div className="space-y-2">
                {activePromos.map((promo) => (
                  <div
                    key={promo.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex">
                      <div className="h-20 w-20 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
                        {promo.image ? (
                          <img src={promo.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Percent size={20} className="text-zinc-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 p-2">
                        <p className="line-clamp-1 text-[10px] font-bold text-zinc-900 dark:text-white">{promo.title || 'Promo'}</p>
                        <p className="line-clamp-2 text-[9px] text-zinc-500">{promo.description}</p>
                        <p className="mt-1 text-[11px] font-black text-amber-500">{promo.discount || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-[8px] leading-tight text-zinc-500">
            Misma jerarquía que el portal del cliente. Solo elementos <strong>activos</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-zinc-400" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const ContentManager: React.FC<ContentManagerProps> = ({ config, onSave }) => {
  const [activeTab, setActiveTab] = useState<'banners' | 'promotions'>('banners');
  const [banners, setBanners] = useState<Banner[]>(config.banners || []);
  const [promotions, setPromotions] = useState<Promotion[]>(config.promotions || []);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importError, setImportError] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBanners(config.banners || []);
    setPromotions(config.promotions || []);
  }, [config]);

  const handleSaveBanner = (banner: Banner) => {
    if (banner.id) {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? banner : b)));
    } else {
      setBanners((prev) => [...prev, { ...banner, id: Date.now().toString(), order: prev.length }]);
    }
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleDeleteBanner = (id: string) => {
    if (confirm('¿Eliminar este banner?')) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleToggleBanner = (id: string) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  };

  const handleSavePromotion = (promo: Promotion) => {
    if (promo.id) {
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? promo : p)));
    } else {
      setPromotions((prev) => [...prev, { ...promo, id: Date.now().toString() }]);
    }
    setEditingPromotion(null);
    setShowForm(false);
  };

  const handleDeletePromotion = (id: string) => {
    if (confirm('¿Eliminar esta promoción?')) {
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleTogglePromotion = (id: string) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const handleSaveAll = () => {
    onSave({ banners, promotions });
  };

  const exportConfigJson = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      banners,
      promotions
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lm-content-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as { banners?: Banner[]; promotions?: Promotion[] };
        if (!Array.isArray(data.banners) || !Array.isArray(data.promotions)) {
          throw new Error('invalid');
        }
        setBanners(data.banners);
        setPromotions(data.promotions);
        setImportError('');
        alert('Importado en memoria. Pulsa «Guardar cambios» para persistir en este navegador.');
      } catch {
        setImportError('JSON inválido: se requieren arrays «banners» y «promotions».');
      }
    };
    reader.readAsText(file);
  };

  const sortedBanners = useMemo(() => [...banners].sort((a, b) => a.order - b.order), [banners]);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sparkles size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Portal del cliente</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Contenido del inicio</h2>
            <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Banners en carrusel y promociones para la pestaña <strong className="text-zinc-900 dark:text-white">Inicio</strong>. A la
              derecha ves una <strong>simulación en vivo</strong> de lo que verá el cliente (solo activos).
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={onImportFile}
            />
            <button
              type="button"
              onClick={exportConfigJson}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-xs font-black uppercase text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              <FileJson size={16} />
              Exportar JSON
            </button>
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-xs font-black uppercase text-zinc-800 transition hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              <Upload size={16} />
              Importar JSON
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black uppercase text-black shadow-lg shadow-amber-500/20 transition-colors hover:bg-yellow-300"
            >
              <span className="inline-flex items-center gap-2">
                <Save size={18} />
                Guardar cambios
              </span>
            </button>
          </div>
        </div>

        {importError && (
          <p className="mb-4 text-center text-xs font-bold text-red-600 dark:text-red-400" role="alert">
            {importError}
          </p>
        )}

        <div className="mb-8 rounded-2xl border border-zinc-200 bg-amber-50/80 p-5 dark:border-zinc-800 dark:bg-amber-950/10 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/30 text-amber-800 dark:text-amber-300">
              <Smartphone size={22} />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900 dark:text-white">Guía rápida</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
                  <p className="text-[10px] font-black uppercase text-zinc-500">Banners</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">{BANNER_IMAGE_SPEC.recommendExport}</p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Se muestran en horizontal; usa fotos anchas, sujeto centrado.</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
                  <p className="text-[10px] font-black uppercase text-zinc-500">Promociones</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">{PROMO_IMAGE_SPEC.recommendExport}</p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Hasta 2 visibles. Imagen cuadrada legible en miniatura.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-10 xl:grid-cols-[1fr_min(340px,100%)] xl:items-start">
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('banners');
                  setShowForm(false);
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold uppercase transition-all ${
                  activeTab === 'banners'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                Banners ({banners.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('promotions');
                  setShowForm(false);
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold uppercase transition-all ${
                  activeTab === 'promotions'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                Promociones ({promotions.length})
              </button>
            </div>

            {activeTab === 'banners' && (
              <div className="space-y-6">
                {!showForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBanner({ ...DEFAULT_BANNER });
                      setShowForm(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 py-4 font-bold text-zinc-500 transition-colors hover:border-amber-400 hover:text-amber-600 dark:border-zinc-700"
                  >
                    <Plus size={20} />
                    Agregar banner
                  </button>
                )}

                {showForm && editingBanner && (
                  <BannerForm
                    key={editingBanner.id || 'new-banner'}
                    banner={editingBanner}
                    onSave={handleSaveBanner}
                    onCancel={() => {
                      setEditingBanner(null);
                      setShowForm(false);
                    }}
                  />
                )}

                <div className="grid gap-4">
                  {sortedBanners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className={`overflow-hidden rounded-2xl border-2 transition-all ${
                        banner.active
                          ? 'border-zinc-200 dark:border-zinc-800'
                          : 'border-zinc-100 opacity-60 dark:border-zinc-800'
                      } bg-white dark:bg-zinc-900`}
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative h-40 w-full shrink-0 bg-zinc-100 sm:h-auto sm:w-56 dark:bg-zinc-800">
                          {banner.image ? (
                            <img src={banner.image} alt="" className="h-full w-full object-cover sm:aspect-[280/144]" />
                          ) : (
                            <div className="flex h-full min-h-[144px] items-center justify-center">
                              <ImageIcon size={36} className="text-zinc-400" />
                            </div>
                          )}
                          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white">
                            {BANNER_IMAGE_SPEC.onScreen} aprox.
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-zinc-900 dark:text-white">{banner.title || 'Sin título'}</h4>
                                {banner.subtitle && <p className="text-sm text-zinc-500">{banner.subtitle}</p>}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBanner(banner.id)}
                                  className={`rounded-lg p-2 transition-colors ${
                                    banner.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                                  }`}
                                  title={banner.active ? 'Activo' : 'Inactivo'}
                                >
                                  {banner.active ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBanner(banner);
                                    setShowForm(true);
                                  }}
                                  className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                                >
                                  <Type size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBanner(banner.id)}
                                  className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            {banner.link && <p className="mt-2 truncate text-xs text-zinc-400">Enlace: {banner.link}</p>}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            <span>Orden {index + 1}</span>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newBanners = [...sortedBanners];
                                  [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
                                  setBanners(newBanners.map((b, i) => ({ ...b, order: i })));
                                }}
                                className="font-bold text-amber-600 hover:underline"
                              >
                                Subir
                              </button>
                            )}
                            {index < sortedBanners.length - 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newBanners = [...sortedBanners];
                                  [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
                                  setBanners(newBanners.map((b, i) => ({ ...b, order: i })));
                                }}
                                className="font-bold text-amber-600 hover:underline"
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

            {activeTab === 'promotions' && (
              <div className="space-y-6">
                {!showForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPromotion({ ...DEFAULT_PROMOTION });
                      setShowForm(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 py-4 font-bold text-zinc-500 transition-colors hover:border-amber-400 hover:text-amber-600 dark:border-zinc-700"
                  >
                    <Plus size={20} />
                    Agregar promoción
                  </button>
                )}

                {showForm && editingPromotion && (
                  <PromotionForm
                    key={editingPromotion.id || 'new-promo'}
                    promotion={editingPromotion}
                    onSave={handleSavePromotion}
                    onCancel={() => {
                      setEditingPromotion(null);
                      setShowForm(false);
                    }}
                  />
                )}

                <div className="grid gap-4">
                  {promotions.map((promo) => (
                    <div
                      key={promo.id}
                      className={`overflow-hidden rounded-2xl border-2 transition-all ${
                        promo.active
                          ? 'border-zinc-200 dark:border-zinc-800'
                          : 'border-zinc-100 opacity-60 dark:border-zinc-800'
                      } bg-white dark:bg-zinc-900`}
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative flex h-36 w-full shrink-0 items-center justify-center bg-zinc-100 sm:h-32 sm:w-32 dark:bg-zinc-800">
                          {promo.image ? (
                            <img src={promo.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Percent size={36} className="text-zinc-400" />
                          )}
                          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white">
                            {PROMO_IMAGE_SPEC.onScreen}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col justify-center p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-zinc-900 dark:text-white">{promo.title || 'Sin título'}</h4>
                                <span className="rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">{promo.discount || '—'}</span>
                              </div>
                              <p className="mt-1 text-sm text-zinc-500">{promo.description}</p>
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {promo.validUntil
                                    ? new Date(promo.validUntil).toLocaleDateString('es-MX')
                                    : 'Sin fecha'}
                                </span>
                                {promo.code && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Percent size={12} />
                                    {promo.code}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePromotion(promo.id)}
                                className={`rounded-lg p-2 transition-colors ${
                                  promo.active ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'
                                }`}
                              >
                                {promo.active ? <Eye size={18} /> : <EyeOff size={18} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPromotion(promo);
                                  setShowForm(true);
                                }}
                                className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                              >
                                <Type size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromotion(promo.id)}
                                className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
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

          <aside className="hidden xl:block">
            <PortalHomePreview banners={banners} promotions={promotions} />
          </aside>
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 xl:hidden">
          <p className="mb-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Vista previa (móvil)</p>
          <PortalHomePreview banners={banners} promotions={promotions} />
        </div>
      </div>
    </div>
  );
};

const BannerForm: React.FC<{
  banner: Banner;
  onSave: (banner: Banner) => void;
  onCancel: () => void;
}> = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Banner>(banner);

  useEffect(() => {
    setFormData(banner);
  }, [banner]);

  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-zinc-50 p-6 dark:bg-zinc-900">
      <h3 className="mb-4 text-lg font-bold">{banner.id ? 'Editar banner' : 'Nuevo banner'}</h3>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Imagen</label>
          <ImageAssetField
            idPrefix="banner-form"
            variant="banner"
            value={formData.image}
            onChange={(image) => setFormData((prev) => ({ ...prev, image }))}
          />
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej. Nueva colección"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Subtítulo (opcional)</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Enlace (opcional)</label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://…"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <span className="text-sm">Visible en el portal</span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => onSave(formData)}
          className="flex-1 rounded-xl bg-yellow-400 py-3 font-bold text-black transition-colors hover:bg-yellow-300"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-zinc-200 py-3 font-bold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const PromotionForm: React.FC<{
  promotion: Promotion;
  onSave: (promo: Promotion) => void;
  onCancel: () => void;
}> = ({ promotion, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Promotion>(promotion);

  useEffect(() => {
    setFormData(promotion);
  }, [promotion]);

  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-zinc-50 p-6 dark:bg-zinc-900">
      <h3 className="mb-4 text-lg font-bold">{promotion.id ? 'Editar promoción' : 'Nueva promoción'}</h3>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Imagen miniatura</label>
          <ImageAssetField
            idPrefix="promo-form"
            variant="promo"
            value={formData.image}
            onChange={(image) => setFormData((prev) => ({ ...prev, image }))}
          />
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Descuento (texto)</label>
              <input
                type="text"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="50% OFF"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Válido hasta</label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <span className="text-sm">Visible en el portal</span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => onSave(formData)}
          className="flex-1 rounded-xl bg-yellow-400 py-3 font-bold text-black transition-colors hover:bg-yellow-300"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-zinc-200 py-3 font-bold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ContentManager;

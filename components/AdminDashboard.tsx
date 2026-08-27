import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Order, OrderStatus, Product, FontOption, ProductBrand, 
  PricingConfig, StoreConfig, OrderItem, Coupon, BrandingAsset,
  FontCategory, DeliveryMethod, CustomTemplate, PaymentMethod, User, PaymentStatus,
  BusinessAccount
} from '../types';
import { exportOrdersToCsv } from '../utils/orderExport';
import { notificationService } from '../services/notificationService';
import { AdvancedStats } from './AdvancedStats';
import { 
  Settings, Search, Trash2, Edit, X, Plus, Package, Minus,
  Type, LayoutDashboard, Users, Upload, Clock, 
  Save, DollarSign, RefreshCw, ChevronRight, Download, UserCircle, 
  CreditCard, Calendar, MessageCircle, Palette, MessageSquare, AlertTriangle, 
  LinkIcon, ImageIcon, PaintBucket, Ticket, ChevronDown, Copy,
  Phone, Tag, Truck, Filter, Gift, Send, ExternalLink, Info, Check, BarChart3, 
  TrendingUp, AlertCircle, ShieldCheck, Mail, MapPin, Briefcase, Images, MoreVertical, 
  LayoutGrid, List, Eye, Wallet, FileType, Star, ArrowLeft, Activity, ArrowUpRight, 
  ArrowDownRight, ArrowRight, ArrowUp, ArrowDown, Zap, Calculator, CalendarDays, ClipboardList, PieChart,
  HardDrive, AlertOctagon, RotateCcw, DownloadCloud, UploadCloud, Database, Hash, Award,
  Flame, Ban, CheckCheck, Timer, CheckCircle, Play, MoreHorizontal, ChevronLeft, StickyNote,
  Layers, Forward, CheckSquare, Square, FileJson, EyeOff, ChevronUp, ImagePlus, Pencil, Crop,
  Paperclip, Lock, PhoneCall, Bell, CalendarClock, ShoppingBag, TrendingDown, PanelRight,
  History, Banknote, QrCode, Grid3X3, AlignLeft, Target, CheckCircle2, Printer, Building2
} from 'lucide-react';
import { TechnicalPreview } from './TechnicalPreview';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui';
import { ImageCropper } from './ImageCropper';
import { BackgroundSettings } from './BackgroundSettings';
import InventoryManager from './InventoryManager';
import { BusinessManager } from './BusinessManager';
import { AlertsWidget } from './AlertsWidget';
import { migrateProductsToCloud, migrateFontsToCloud, migrateConfigToCloud, migrateOrdersToCloud } from '../services/firebaseService';
import { ClientDashboard } from './ClientDashboard';
import { CouponManager } from './CouponManager';
import { ContentManager } from './ContentManager';
import ProductionSection from './ProductionSection';
import ContextMenuTrigger from './ContextMenuTrigger';
import { useContextMenu } from '../contexts/ContextMenuContext';
import { Sparkles } from 'lucide-react';
import KPICard from './dashboard/KPICard';
import Sparkline from './dashboard/Sparkline';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  fonts: FontOption[];
  pricing: PricingConfig;
  storeConfig: StoreConfig;
  user: User | null;
  setUser: (user: User | null) => void;
  onUpdatePricing: (config: PricingConfig) => void;
  onUpdateStoreConfig: (config: StoreConfig) => void;
  onUpdateOrder: (order: Order) => void;
  onAddOrder: (order: Order) => void;
  onUpdateOrderPriority: (id: string, isPriority: boolean) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddFont: (font: FontOption) => void;
  onUpdateFont: (oldId: number, font: FontOption) => void;
  onDeleteFont: (id: number) => void;
  onUpdateClient: (phone: string, name: string, newPhone: string, email: string) => void;
  onDeleteClient: (phone: string) => void;
  onResetOrdersAndClients: () => void;
  onResetInventoryCounts: () => void;
  onResetProducts?: () => void;
  onAddFonts?: (fonts: FontOption[]) => void;
  onOpenAssistant?: (query?: string) => void;
  // Navigation Control for Assistant
  activeTab?: 'DASHBOARD' | 'ORDERS' | 'PRODUCTION' | 'INVENTORY' | 'SETTINGS' | 'FONTS' | 'CLIENTS' | 'FINANCE' | 'GALERIA' | 'CALENDAR' | 'CONTENT' | 'EMPRESAS';
  onTabChange?: (tab: 'DASHBOARD' | 'ORDERS' | 'PRODUCTION' | 'INVENTORY' | 'SETTINGS' | 'FONTS' | 'CLIENTS' | 'FINANCE' | 'GALERIA' | 'CALENDAR' | 'CONTENT' | 'EMPRESAS') => void;
  settingsTab?: 'BRANDING' | 'COLORS' | 'MESSAGES' | 'FINANCE' | 'PRICING' | 'COUPONS' | 'INVENTORY_CATS' | 'SYSTEM';
  onSettingsTabChange?: (tab: 'BRANDING' | 'COLORS' | 'MESSAGES' | 'FINANCE' | 'PRICING' | 'COUPONS' | 'INVENTORY_CATS' | 'SYSTEM') => void;
}

// --- UTILS ---
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const formatDateSimple = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });

// Helper para normalizar fechas a formato YYYY-MM-DD (para comparación correcta en calendario)
const normalizeDate = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '');
    const time = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    return `${day} ${month}, ${time}`;
};

const getStatusColorStrip = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.COMPLETED: return 'badge-success';
        case OrderStatus.READY: return 'badge-info';
        case OrderStatus.IN_PRODUCTION: return 'badge-warning';
        case OrderStatus.WAITING_APPROVAL: return 'badge-info';
        case OrderStatus.CANCELLED: return 'badge-error';
        default: return 'badge-neutral';
    }
};

const getStatusBadgeColor = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.COMPLETED: return 'badge-success';
        case OrderStatus.READY: return 'badge-info';
        case OrderStatus.IN_PRODUCTION: return 'badge-warning';
        case OrderStatus.WAITING_APPROVAL: return 'badge-info';
        case OrderStatus.CANCELLED: return 'badge-error';
        default: return 'badge-neutral';
    }
};

const getWhatsAppLink = (phone: string, messageTemplate: string, order?: Order, clientName?: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) cleaned = `52${cleaned}`;
    if (!cleaned) return '#';

    let msg = messageTemplate;
    
    if (order) {
        // Generate tracking link - use a relative path that works in production
        const trackingLink = `${window.location.origin}/?view=TRACKING&id=${order.id}`;
        
        msg = msg
            .replace(/{NOMBRE}/g, order.customerName.split(' ')[0])
            .replace(/{ID}/g, order.id)
            .replace(/{TOTAL}/g, formatCurrency(order.total))
            .replace(/{GUIA}/g, order.shippingTracking || 'PENDIENTE')
            .replace(/{PAQUETERIA}/g, order.shippingProvider || 'PENDIENTE')
            .replace(/{LINK}/g, trackingLink);
    } else if (clientName) {
        msg = msg.replace(/{NOMBRE}/g, clientName.split(' ')[0]);
    }
    
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
};

const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
};

// --- HELPER: GENERATE TIME SLOTS (30 MIN) ---
const generateTimeSlots = () => {
    const times = [];
    for (let i = 8; i <= 20; i++) { // 8 AM to 8 PM
        const hour = i.toString().padStart(2, '0');
        times.push(`${hour}:00`);
        times.push(`${hour}:30`);
    }
    return times;
};
const TIME_SLOTS = generateTimeSlots();

// --- MODALS ---

const BulkFontModal = ({ isOpen, onClose, onAddFonts, existingFonts = [] }: { isOpen: boolean, onClose: () => void, onAddFonts: (fonts: FontOption[]) => void, existingFonts?: FontOption[] }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [defaultCategory, setDefaultCategory] = useState<FontCategory>('FONTS 2026');
    const [startFontNumber, setStartFontNumber] = useState<number>(Math.max(0, ...existingFonts.map(f => f.id)) + 1);
    const [isDragOver, setIsDragOver] = useState(false);
    const [processedFonts, setProcessedFonts] = useState<FontOption[]>([]);
    const [previewText, setPreviewText] = useState('AaBbCc 123');

    // Validar archivo
    const validateFile = (file: File): { valid: boolean; error?: string } => {
        const validExtensions = ['.ttf', '.otf'];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!validExtensions.includes(ext)) {
            return { valid: false, error: 'Extensión no válida' };
        }
        
        if (file.size > 5 * 1024 * 1024) {
            return { valid: false, error: 'Archivo muy grande (máx 5MB)' };
        }
        
        // Verificar duplicados
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
        const isDuplicate = existingFonts.some(f => 
            f.name.toUpperCase().replace(/[-_]/g, ' ') === fileNameWithoutExt.replace(/[-_]/g, ' ')
        );
        
        if (isDuplicate) {
            return { valid: false, error: 'Fuente ya existente' };
        }
        
        return { valid: true };
    };

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        const validFiles: File[] = [];
        const errors: string[] = [];
        
        newFiles.forEach(file => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });
        
        if (errors.length > 0) {
            alert(`Archivos omitidos:\n${errors.join('\n')}`);
        }
        
        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const processUpload = async () => {
        setIsProcessing(true);
        const newFonts: FontOption[] = [];
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").toUpperCase();
                    const fontNumber = startFontNumber + i;
                    newFonts.push({
                        id: fontNumber,
                        name: cleanName,
                        category: defaultCategory,
                        cssFamily: `font-custom-${fontNumber}`,
                        isCustom: true,
                        fileData: result,
                        active: false
                    });
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }
        
        setProcessedFonts(newFonts);
        onAddFonts(newFonts);
        setIsProcessing(false);
        setSelectedFiles([]);
        setProcessedFonts([]);
        onClose();
        alert(`${newFonts.length} fuentes cargadas.`);
    };

    // Generar previsualización de fuentes
    const previewFonts = async () => {
        const fonts: FontOption[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").toUpperCase();
                    const timestampId = Date.now() + i;
                    fonts.push({
                        id: timestampId,
                        name: cleanName,
                        category: defaultCategory,
                        cssFamily: `font-preview-${timestampId}`,
                        isCustom: true,
                        fileData: result,
                        active: true
                    });
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }
        setProcessedFonts(fonts);
    };

    useEffect(() => {
        if (selectedFiles.length > 0 && processedFonts.length === 0) {
            previewFonts();
        }
    }, [selectedFiles]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20}/></button>
                <h3 className="text-xl font-bold text-white mb-4">Carga Masiva de Fuentes</h3>
                
                {/* Zona de arrastrar y soltar */}
                <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                        isDragOver
                            ? 'border-system-accent bg-system-accent/10'
                            : 'border-zinc-700 hover:border-system-accent hover:bg-zinc-800/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud size={48} className={`mx-auto mb-4 ${isDragOver ? 'text-amber-500' : 'text-zinc-400'}`} />
                    <p className="text-zinc-300 font-medium mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
                    <p className="text-zinc-500 text-sm">Formatos aceptados: .ttf, .otf (máx 5MB)</p>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept=".ttf,.otf" 
                    onChange={(e) => handleFiles(e.target.files)}
                />

                {/* Lista de archivos seleccionados */}
                {selectedFiles.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-zinc-400">{selectedFiles.length} archivos seleccionados</p>
                            <button 
                                onClick={() => { setSelectedFiles([]); setProcessedFonts([]); }}
                                className="text-xs text-red-400 hover:text-red-300"
                            >
                                Limpiar todo
                            </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FileType size={16} className="text-amber-500" />
                                        <span className="text-zinc-300 truncate max-w-[200px]">{file.name}</span>
                                        <span className="text-zinc-500 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button onClick={() => removeFile(index)} className="text-zinc-500 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selector de categoría y número inicial */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Categoría por defecto</label>
                        <select 
                            value={defaultCategory} 
                            onChange={(e) => setDefaultCategory(e.target.value as any)} 
                            className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white text-sm"
                        >
                            {['BASICAS', 'DEPORTE', 'CURSIVA', 'FONTS 2026', 'KIDS'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Número de fuente inicial</label>
                        <input 
                            type="number" 
                            value={startFontNumber} 
                            onChange={(e) => setStartFontNumber(parseInt(e.target.value) || 1)} 
                            className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white text-sm font-mono"
                            min={1}
                        />
                    </div>
                </div>

                {/* Previsualización de fuentes */}
                {processedFonts.length > 0 && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm text-zinc-400">Vista previa</label>
                            <input
                                type="text"
                                value={previewText}
                                onChange={(e) => setPreviewText(e.target.value)}
                                placeholder="Texto de prueba..."
                                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-sm text-white w-48"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {processedFonts.map((font, index) => {
                                // Crear estilo para la fuente
                                const fontStyle = document.createElement('style');
                                fontStyle.textContent = `
                                    @font-face {
                                        font-family: 'font-preview-${font.id}';
                                        src: url('${font.fileData}');
                                    }
                                `;
                                if (!document.getElementById(`font-preview-${font.id}`)) {
                                    fontStyle.id = `font-preview-${font.id}`;
                                    document.head.appendChild(fontStyle);
                                }
                                
                                return (
                                    <div key={index} className="bg-zinc-800/50 rounded-lg p-3 flex flex-col gap-1">
                                        <span className="text-xs text-zinc-500 uppercase">{font.name}</span>
                                        <span 
                                            className="text-2xl text-white truncate"
                                            style={{ fontFamily: `font-preview-${font.id}` }}
                                        >
                                            {previewText || 'Aa'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Botón de subir */}
                <button 
                    onClick={processUpload} 
                    disabled={isProcessing || selectedFiles.length === 0}
                    className="w-full mt-6 btn-system btn-system-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <><RefreshCw size={20} className="animate-spin" /> Procesando...</>
                    ) : (
                        <><UploadCloud size={20} /> Subir {selectedFiles.length} Fuentes</>
                    )}
                </button>
            </div>
        </div>
    );
};

const ProductFormModal = ({isOpen, onClose, product, onSave, presetColors, categories}: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const variantsInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<Product>(product || { id: `prod-${Date.now()}`, name: '', brand: ProductBrand.GENERIC, category: 'General', price: 0, stockThreshold: 5, imageUrl: '', colors: [] });
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [croppingTarget, setCroppingTarget] = useState<'MAIN' | string>('MAIN'); 
    
    useEffect(() => { if(product) setFormData(product); }, [product]);

    const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => { setImageToCrop(ev.target?.result as string); setCroppingTarget('MAIN'); };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedUrl: string) => {
        if (croppingTarget === 'MAIN') {
            setFormData({...formData, imageUrl: croppedUrl});
        } else {
            // Color variant crop
            setFormData({...formData, colors: formData.colors.map(c => c.id === croppingTarget ? {...c, imageUrl: croppedUrl} : c)});
        }
        setImageToCrop(null);
    };

    const handleVariantFiles = (files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const url = ev.target?.result as string;
                const match = presetColors?.find((pc:any) => file.name.toLowerCase().includes(pc.name.toLowerCase()));
                setFormData(prev => ({
                    ...prev,
                    colors: [...prev.colors, {
                        id: `var-${Date.now()}-${Math.random()}`,
                        name: match ? match.name : 'NUEVO COLOR',
                        hex: match ? match.hex : '#888888',
                        stock: 0,
                        imageUrl: url
                    }]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    if (!isOpen) return null;

    // Validation before save
    const handleSave = () => {
        if (!formData.name.trim()) {
            alert('El nombre del producto es obligatorio.');
            return;
        }
        if (formData.price <= 0) {
            alert('El precio debe ser mayor a 0.');
            return;
        }
        if (!formData.imageUrl) {
            alert('Debes subir una imagen principal.');
            return;
        }
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogTrigger asChild>
        {/* Este trigger no se usará directamente ya que el modal se abre por estado, pero es necesario para Dialog */}
        <button hidden>Open Dialog</button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-0">
        {imageToCrop && <ImageCropper imageSrc={imageToCrop} onCropComplete={handleCropComplete} onCancel={() => setImageToCrop(null)} aspect={5/6}/>}
        <DialogHeader className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">{product ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-400">Modifica los detalles del producto.</DialogDescription>
        </DialogHeader>
        <React.Fragment>

                    <div className="w-1/3 p-6 border-r border-zinc-200 dark:border-zinc-700 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-zinc-900">
                        <div className="aspect-[5/6] bg-zinc-200 dark:bg-zinc-700 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer relative group" onClick={() => fileInputRef.current?.click()}>
                            {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-contain"/> : <ImageIcon className="text-zinc-400 dark:text-zinc-600"/>}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">CAMBIAR PORTADA</div>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleMainImageUpload}/>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-zinc-600 dark:text-zinc-400 text-xs font-bold mb-1" htmlFor="product-name">Nombre del Producto</label>
                                <input id="product-name" className="w-full bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre del Producto"/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-zinc-600 dark:text-zinc-400 text-xs font-bold mb-1" htmlFor="product-price">Precio</label>
                                    <input id="product-price" type="number" className="w-full bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="Precio" min={0}/>
                                </div>
                                <div>
                                    <label className="block text-zinc-600 dark:text-zinc-400 text-xs font-bold mb-1" htmlFor="product-brand">Marca</label>
                                    <select id="product-brand" className="w-full bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value as any})}>
                                        {Object.values(ProductBrand).map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-zinc-600 dark:text-zinc-400 text-xs font-bold mb-1" htmlFor="product-category">Categoría</label>
                                <select id="product-category" className="w-full bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-zinc-900 dark:text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    {(categories || ['General']).map((c: string) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-900">
                        <div className="flex justify-between mb-4 items-end">
                            <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Variantes de Color</h4>
                            <button onClick={() => variantsInputRef.current?.click()} className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"><UploadCloud size={14}/> SUBIR FOTOS</button>
                            <input type="file" ref={variantsInputRef} hidden multiple accept="image/*" onChange={(e) => handleVariantFiles(e.target.files)}/>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {/* Header row for variants */}
                            {formData.colors.length > 0 && (
                                <div className="grid grid-cols-12 gap-2 px-2 pb-1 text-[11px] text-zinc-400 dark:text-zinc-600 font-bold uppercase">
                                    <div className="col-span-1">Imagen</div>
                                    <div className="col-span-4">Nombre</div>
                                    <div className="col-span-3">Color</div>
                                    <div className="col-span-2">Stock</div>
                                    <div className="col-span-2 text-right">Acción</div>
                                </div>
                            )}
                            {formData.colors.map(color => (
                                <div key={color.id} className="grid grid-cols-12 items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                    <div className="col-span-1 flex justify-center">
                                        <img src={color.imageUrl} className="w-10 h-10 rounded bg-zinc-200 dark:bg-zinc-700 object-cover"/>
                                    </div>
                                    <div className="col-span-4">
                                        <input className="w-full bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-zinc-900 dark:text-white text-xs font-bold" value={color.name} onChange={e => setFormData({...formData, colors: formData.colors.map(c => c.id === color.id ? {...c, name: e.target.value} : c)})} placeholder="Nombre variante"/>
                                    </div>
                                    <div className="col-span-3 flex items-center gap-2">
                                        <input type="color" className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer" value={color.hex} onChange={e => setFormData({...formData, colors: formData.colors.map(c => c.id === color.id ? {...c, hex: e.target.value} : c)})}/>
                                    </div>
                                    <div className="col-span-2">
                                        <input type="number" className="w-full bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-zinc-900 dark:text-white text-xs text-center" value={color.stock} onChange={e => setFormData({...formData, colors: formData.colors.map(c => c.id === color.id ? {...c, stock: Number(e.target.value)} : c)})} placeholder="Stock" min={0}/>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button onClick={() => setFormData({...formData, colors: formData.colors.filter(c => c.id !== color.id)})} className="text-system-danger hover:bg-system-error/30 p-2 rounded"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>
                        </React.Fragment>
              </DialogContent>
            </Dialog>
          );
};

const ALL_CATEGORIES = ['BASICAS', 'DEPORTE', 'CURSIVA', 'FONTS 2026', 'KIDS'];

const FontFormModal = ({ isOpen, onClose, font, onSave, existingFonts = [] }: { isOpen: boolean; onClose: () => void; font?: FontOption; onSave: (font: FontOption) => void; existingFonts?: FontOption[] }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<FontOption>(font || { id: 0, name: '', cssFamily: '', category: 'BASICAS' });
    const [fontFile, setFontFile] = useState<string | null>(font?.fileData || null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [fontIdError, setFontIdError] = useState('');
    const [previewText, setPreviewText] = useState('Laser Machine México 2026');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(font?.category ? [font.category] : ['BASICAS']);
    
    const generateShortId = () => Math.floor(1 + Math.random() * 999);
    
    const validateFontId = (id: number, currentFontId?: number): boolean => {
        if (!id || id < 1 || id > 999) {
            setFontIdError('El ID debe estar entre 1 y 999');
            return false;
        }
        if (currentFontId && id === currentFontId) {
            setFontIdError('');
            return true;
        }
        const exists = existingFonts.some(f => f.id === id && f.id !== currentFontId);
        if (exists) {
            setFontIdError('Este número de fuente ya está en uso');
            return false;
        }
        setFontIdError('');
        return true;
    };
    
    useEffect(() => { 
        if (isOpen && !font) {
            let newId = generateShortId();
            let attempts = 0;
            while (existingFonts.some(f => f.id === newId) && attempts < 10) {
                newId = generateShortId();
                attempts++;
            }
            setData({ id: newId, name: '', cssFamily: '', category: 'BASICAS' });
            setFontFile(null);
            setFontIdError('');
            setSelectedCategories(['BASICAS']);
            setPreviewText('Laser Machine México 2026');
        } else if (font) {
            setData(font);
            setFontFile(font.fileData || null);
            setFontIdError('');
            setSelectedCategories(font.category ? [font.category] : ['BASICAS']);
            setPreviewText('Laser Machine México 2026');
        }
    }, [isOpen, font, existingFonts]);
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validExtensions = ['.ttf', '.otf'];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!validExtensions.includes(ext)) {
            alert('Solo se aceptan archivos .ttf y .otf');
            return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) { clearInterval(progressInterval); return prev; }
                return prev + 20;
            });
        }, 100);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setFontFile(result);
            setUploadProgress(100);
            setIsUploading(false);
            clearInterval(progressInterval);
            if (!data.name) {
                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase();
                setData({ ...data, name: cleanName });
            }
        };
        reader.onerror = () => { setIsUploading(false); clearInterval(progressInterval); alert('Error al leer el archivo'); };
        reader.readAsDataURL(file);
    };
    
    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newId = parseInt(e.target.value) || 0;
        setData({ ...data, id: newId });
        validateFontId(newId, font?.id);
    };
    
    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(cat)) {
                return prev.length > 1 ? prev.filter(c => c !== cat) : prev;
            }
            return [...prev, cat];
        });
    };
    
    const handleSave = () => {
        if (fontIdError) { alert('Corrige el número de fuente antes de guardar'); return; }
        if (!data.name.trim()) { alert('Ingresa un nombre para la fuente'); return; }
        
        const existingFileData = font?.fileData;
        const newFileData = fontFile;
        const hasFile = existingFileData || newFileData;
        
        if (!font && !hasFile) { alert('Sube un archivo de fuente (.ttf o .otf)'); return; }
        
        const cssFamily = hasFile ? `font-custom-${data.id}` : (data.cssFamily || `font-system-${data.id}`);
        
        const fontData = {
            ...data,
            category: selectedCategories[0] as any,
            categories: selectedCategories,
            cssFamily: cssFamily,
            isCustom: !!hasFile,
            fileData: newFileData || existingFileData || null,
            active: true
        };
        onSave(fontData);
        alert(font ? `Fuente #${fontData.id} actualizada correctamente` : `Fuente #${data.id} guardada`);
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
                <div className="bg-zinc-100 dark:bg-zinc-800 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{font ? 'Editar Fuente' : 'Nueva Fuente'}</h3>
                        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"><X size={22}/></button>
                    </div>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Archivo de Fuente</label>
                        <div 
                            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isUploading ? 'border-amber-500 bg-amber-500/10' : fontFile ? 'border-green-500 bg-green-500/10' : 'border-zinc-300 dark:border-zinc-700 hover:border-amber-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} className="hidden" accept=".ttf,.otf" onChange={handleFileUpload}/>
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-40 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all" style={{width: `${uploadProgress}%`}}/></div>
                                    <span className="text-amber-500 text-sm font-medium">Cargando... {uploadProgress}%</span>
                                </div>
                            ) : fontFile ? (
                                <div className="flex items-center gap-3 text-green-500"><CheckCircle size={22}/><span className="font-medium text-zinc-700 dark:text-zinc-300">Archivo cargado</span></div>
                            ) : (
                                <div className="text-zinc-400"><UploadCloud size={28} className="mx-auto mb-2"/><span className="text-sm">Click para subir .ttf o .otf</span></div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID de Fuente</label>
                            <input type="number" value={data.id} onChange={handleIdChange} min={1} max={999}
                                className={`w-full bg-zinc-100 dark:bg-zinc-800 border ${fontIdError ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-mono text-lg focus:border-amber-500 focus:outline-none transition-colors`}/>
                            {fontIdError && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/>{fontIdError}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nombre</label>
                            <input type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Nombre de la fuente"
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none transition-colors"/>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Categorías</label>
                        <div className="grid grid-cols-5 gap-2">
                            {ALL_CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => toggleCategory(cat)}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${selectedCategories.includes(cat) ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Texto de Preview</label>
                        <input type="text" value={previewText} onChange={e => setPreviewText(e.target.value)} placeholder="Escribe tu texto..."
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none transition-colors"/>
                    </div>
                    
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Vista Previa</span>
                            <span className="text-xs text-zinc-400">#{data.id} · {data.name || 'Sin nombre'}</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
                            {fontFile ? (
                                <p className="text-3xl md:text-4xl text-zinc-900 dark:text-white text-center break-words" style={{ fontFamily: `font-preview-${data.id}` }}>{previewText || 'Tu texto aquí'}</p>
                            ) : (
                                <p className="text-3xl md:text-4xl text-zinc-900 dark:text-white text-center break-words">{previewText || 'Tu texto aquí'}</p>
                            )}
                            {fontFile && <style>{`@font-face { font-family: 'font-preview-${data.id}'; src: url('${fontFile}'); }`}</style>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedCategories.map(cat => (
                                <span key={cat} className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-[10px] text-zinc-600 dark:text-zinc-400">{cat}</span>
                            ))}
                        </div>
                    </div>
                    
                    <button onClick={handleSave} disabled={!!fontIdError || isUploading}
                        className={`w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${fontIdError || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Save size={20}/> {font ? 'Actualizar Fuente' : 'Crear Fuente'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BulkDistributorModal = ({ isOpen, onClose, products, onApplyChanges, globalColors }: any) => {
    // Demo implementation for response brevity
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-zinc-900 p-8 rounded-xl text-center border border-zinc-800">
                <h3 className="text-white font-bold mb-4">Distribución Masiva (Demo)</h3>
                <p className="text-zinc-400 text-sm mb-6">Esta función requiere lógica compleja de servidor.</p>
                <button onClick={onClose} className="btn-system btn-system-error px-6 py-2 rounded-lg">Cerrar</button>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders, products, fonts, pricing, storeConfig, user, setUser,
  onUpdatePricing, onUpdateStoreConfig, onUpdateOrder,
  onAddOrder, onUpdateOrderPriority,
  onAddProduct, onUpdateProduct, onDeleteProduct,
  onAddFont, onDeleteFont, onUpdateFont,
  onUpdateClient, onDeleteClient,
  onResetOrdersAndClients, onResetInventoryCounts,
  onResetProducts, onAddFonts, onOpenAssistant,
  activeTab: propActiveTab, onTabChange,
  settingsTab: propSettingsTab, onSettingsTabChange
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'DASHBOARD' | 'ORDERS' | 'PRODUCTION' | 'INVENTORY' | 'SETTINGS' | 'FONTS' | 'CLIENTS' | 'FINANCE' | 'GALERIA' | 'CALENDAR' | 'CONTENT' | 'EMPRESAS'>('DASHBOARD');
  const [internalSettingsTab, setInternalSettingsTab] = useState<'BRANDING' | 'COLORS' | 'MESSAGES' | 'FINANCE' | 'PRICING' | 'COUPONS' | 'INVENTORY_CATS' | 'SYSTEM'>('BRANDING');
  
  // Business accounts state
  const [businessAccounts, setBusinessAccounts] = useState<BusinessAccount[]>(() => {
    try {
      const saved = localStorage.getItem('lm_business_accounts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('lm_business_accounts_v1', JSON.stringify(businessAccounts));
    } catch {}
  }, [businessAccounts]);
  
  // Gallery state
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<'TODAS' | 'LOGO' | 'ICON' | 'ILUSTRACION' | 'FORMS' | 'CLIPART' | 'OTHER'>('TODAS');
  const [galleryViewMode, setGalleryViewMode] = useState<'folders' | 'grid' | 'compact' | 'list'>('folders');

  // Content config for client dashboard
  const [contentConfig, setContentConfig] = useState<{ banners: any[], promotions: any[] }>(() => {
    const saved = localStorage.getItem('lm_content_config');
    if (saved) {
      return JSON.parse(saved);
    }
    return { banners: [], promotions: [] };
  });

  const activeTab = propActiveTab || internalActiveTab;
  const setActiveTab = (tab: any) => {
      setInternalActiveTab(tab);
      if (onTabChange) onTabChange(tab);
  };

  const settingsTab = propSettingsTab || internalSettingsTab;
  const setSettingsTab = (tab: any) => {
      setInternalSettingsTab(tab);
      if (onSettingsTabChange) onSettingsTabChange(tab);
  };

  // Listen for navigation events from notifications
  useEffect(() => {
    const handleNavigateToTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab === 'INVENTORY' || tab === 'ORDERS' || tab === 'SETTINGS' || tab === 'FONTS') {
        setInternalActiveTab(tab);
        if (onTabChange) onTabChange(tab);
      }
    };

    window.addEventListener('navigateToTab', handleNavigateToTab);
    return () => window.removeEventListener('navigateToTab', handleNavigateToTab);
  }, [onTabChange]);

  const [rabInputValue, setRabInputValue] = useState('');
  
  // Context Menu Hook
  const { showMenu } = useContextMenu();
  
  // States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isBulkFontModalOpen, setIsBulkFontModalOpen] = useState(false);
  const [isBulkDistributorOpen, setIsBulkDistributorOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingFont, setEditingFont] = useState<FontOption | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newColorPreset, setNewColorPreset] = useState({ name: '', hex: '#000000' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: 10, maxUses: 100, expiryDate: '', assignedToPhone: '' });
  const [newCategory, setNewCategory] = useState(''); 
  const [newPricing, setNewPricing] = useState(pricing);
  const [messages, setMessages] = useState(storeConfig.messageTemplates);
  const [activeFontCategory, setActiveFontCategory] = useState<FontCategory | 'TODAS'>('TODAS');
  const [fontViewMode, setFontViewMode] = useState<'GRID' | 'LIST' | 'COMPACT'>('GRID');
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [fontSortBy, setFontSortBy] = useState<'name' | 'id' | 'category'>('id');
  const [fontSortOrder, setFontSortOrder] = useState<'asc' | 'desc'>('asc');
  const [fontStatusFilter, setFontStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [bankInfo, setBankInfo] = useState(storeConfig.bankInfo || '');
  const [clientCouponData, setClientCouponData] = useState({ code: '', discount: 10 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calendarViewMode, setCalendarViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [weekOffset, setWeekOffset] = useState(0);
  const [notes, setNotes] = useState<string>(() => localStorage.getItem('admin_dashboard_notes') || '');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAsset, setUploadingAsset] = useState<'LOGO' | 'FAVICON' | 'BANNER' | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [fontPreviewText, setFontPreviewText] = useState('');
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppingTarget, setCroppingTarget] = useState<string>('MAIN');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'TODOS'>('TODOS');
  const [financeDrawerOpen, setFinanceDrawerOpen] = useState(false);
  const [orderNoteInput, setOrderNoteInput] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);

  // Computed Values
  const todaysRevenue = useMemo(() => {

      const today = new Date().toDateString();
      return orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status !== OrderStatus.CANCELLED).reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  // Weekly Stats Calculation
  const weeklyStats = useMemo(() => {
      const today = new Date();
      const stats = [];
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toDateString();
          
          const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === dateStr && o.status !== OrderStatus.CANCELLED);
          const completed = dayOrders.filter(o => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + o.total, 0);
          const total = dayOrders.reduce((sum, o) => sum + o.total, 0);
          const potential = total - completed;

          stats.push({ day: days[d.getDay()], completed, potential, total });
      }

      const maxVal = Math.max(...stats.map(s => s.total), 100);

      return stats.map(s => ({
          ...s,
          completedHeight: (s.completed / maxVal) * 100,
          potentialHeight: (s.potential / maxVal) * 100
      }));
  }, [orders]);

  const next7Days = useMemo(() => {
      const days = [];
      const baseDate = new Date(selectedCalendarDate);
      for (let i = 0; i < 7; i++) {
          const d = new Date(baseDate);
          d.setDate(baseDate.getDate() + i);
          days.push(d);
      }
      return days;
  }, [selectedCalendarDate]);

  const ordersByStatus = useMemo(() => {
      const counts = {
          [OrderStatus.RECEIVED]: 0,
          [OrderStatus.WAITING_APPROVAL]: 0,
          [OrderStatus.IN_PRODUCTION]: 0,
          [OrderStatus.READY]: 0,
          [OrderStatus.COMPLETED]: 0
      };
      orders.forEach(o => {
          if (counts[o.status] !== undefined) counts[o.status]++;
      });
      return counts;
  }, [orders]);

  const topProducts = useMemo(() => {
      const productCounts: Record<string, number> = {};
      orders.forEach(o => {
          o.items.forEach(item => {
              productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
          });
      });
      return Object.entries(productCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([id, count]) => {
              const product = products.find(p => p.id === id);
              return { name: product?.name || id, count, image: product?.imageUrl };
          });
  }, [orders, products]);

  const lowStockProducts = useMemo(() => {
      return products.filter(p => {
          const totalStock = (p.colors || []).reduce((sum, c) => sum + c.stock, 0);
          return totalStock <= p.stockThreshold;
      });
  }, [products]);

  // Daily sales data for chart (last 7 days)
  const dailySales = useMemo(() => {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const today = new Date();
      const data = [];
      
      for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayName = i === 0 ? 'Hoy' : days[date.getDay()];
          
          const dayOrders = orders.filter(o => {
              const orderDate = new Date(o.createdAt);
              return orderDate.toDateString() === date.toDateString();
          });
          
          const amount = dayOrders.reduce((sum, o) => sum + o.total, 0);
          data.push({ day: dayName, amount, orders: dayOrders.length });
      }
      return data;
  }, [orders]);

  const weeklyRevenue = useMemo(() => dailySales.reduce((sum, d) => sum + d.amount, 0), [dailySales]);
  
  // ===== PROFIT CALCULATIONS (assuming 40% margin) =====
  const PROFIT_MARGIN = 0.4;
  const todaysProfit = useMemo(() => todaysRevenue * PROFIT_MARGIN, [todaysRevenue]);
  const weeklyProfit = useMemo(() => weeklyRevenue * PROFIT_MARGIN, [weeklyRevenue]);
  
  // Monthly calculations
  const monthlyRevenue = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return orders
      .filter(o => new Date(o.createdAt) >= startOfMonth && o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);
  const monthlyProfit = useMemo(() => monthlyRevenue * PROFIT_MARGIN, [monthlyRevenue]);
  
  const recentOrders = useMemo(() =>
      [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [orders]);

  // ===== NEW ENHANCED METRICS FOR DASHBOARD =====
  
  // Revenue comparison with yesterday
  const yesterdayRevenue = useMemo(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return orders
          .filter(o => new Date(o.createdAt).toDateString() === yesterday.toDateString() && o.status !== OrderStatus.CANCELLED)
          .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const revenueChange = useMemo(() => {
      if (yesterdayRevenue === 0) return 100; // If no sales yesterday, consider 100% increase
      return ((todaysRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
  }, [todaysRevenue, yesterdayRevenue]);

  // Weekly comparison
  const lastWeekRevenue = useMemo(() => {
      const today = new Date();
      let total = 0;
      for (let i = 7; i < 14; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          total += orders
              .filter(o => new Date(o.createdAt).toDateString() === date.toDateString() && o.status !== OrderStatus.CANCELLED)
              .reduce((sum, o) => sum + o.total, 0);
      }
      return total;
  }, [orders]);

  const weeklyChange = useMemo(() => {
      if (lastWeekRevenue === 0) return 100;
      return ((weeklyRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
  }, [weeklyRevenue, lastWeekRevenue]);

  // Completed orders today
  const completedToday = useMemo(() => {
      const today = new Date().toDateString();
      return orders.filter(o => 
          o.status === OrderStatus.COMPLETED && 
          o.history?.some(h => h.status === OrderStatus.COMPLETED && new Date(h.timestamp).toDateString() === today)
      ).length;
  }, [orders]);

  // Average production time (hours)
  const avgProductionTime = useMemo(() => {
      const completedOrders = orders.filter(o => 
          o.status === OrderStatus.COMPLETED && 
          o.history && 
          o.history.some(h => h.status === OrderStatus.IN_PRODUCTION)
      );
      
      if (completedOrders.length === 0) return 0;
      
      const totalHours = completedOrders.reduce((sum, o) => {
          const productionStart = o.history.find(h => h.status === OrderStatus.IN_PRODUCTION)?.timestamp;
          const productionEnd = o.history.find(h => h.status === OrderStatus.COMPLETED)?.timestamp;
          
          if (productionStart && productionEnd) {
              const hours = (new Date(productionEnd).getTime() - new Date(productionStart).getTime()) / (1000 * 60 * 60);
              return sum + hours;
          }
          return sum;
      }, 0);
      
      return Math.round(totalHours / completedOrders.length);
  }, [orders]);

  // Daily revenue goal (example: $10,000)
  const DAILY_GOAL = 10000;
  const dailyGoalProgress = Math.min((todaysRevenue / DAILY_GOAL) * 100, 100);
  const dailyGoalMet = todaysRevenue >= DAILY_GOAL;

  // Pending amount
  const pendingAmount = useMemo(() => {
      return orders
          .filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED)
          .reduce((sum, o) => sum + (o.total - (o.amountPaid || 0)), 0);
  }, [orders]);

  // Pending orders count
  const pendingOrdersCount = useMemo(() => {
      return orders.filter(o => 
          o.status !== OrderStatus.CANCELLED && 
          o.status !== OrderStatus.COMPLETED
      ).length;
  }, [orders]);

  // Urgent orders (in production with priority)
  const urgentOrdersCount = useMemo(() => {
      return orders.filter(o => 
          o.status === OrderStatus.IN_PRODUCTION && 
          o.isPriority
      ).length;
  }, [orders]);

  // Sparkline data (last 7 days revenue)
  const sparklineData = useMemo(() => {
      const data = [];
      for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const amount = orders
              .filter(o => new Date(o.createdAt).toDateString() === date.toDateString() && o.status !== OrderStatus.CANCELLED)
              .reduce((sum, o) => sum + o.total, 0);
          data.push(amount);
      }
      return data;
  }, [orders]);

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `Hace ${diffMins}m`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays === 1) return 'Ayer';
      return `Hace ${diffDays}d`;
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const digits = searchQuery.replace(/\D/g, '');
    let filtered = orders.filter(o => {
      const matchesTerm =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(searchQuery.trim())) ||
        (digits.length >= 4 && o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(digits)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'TODOS' || o.status === statusFilter;
      const matchesPayment =
        paymentStatusFilter === 'ALL' || o.paymentStatus === paymentStatusFilter;
      return matchesTerm && matchesStatus && matchesPayment;
    });
    
    // Apply date filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.createdAt);
        if (dateFilter === 'TODAY') {
          return orderDate >= today;
        } else if (dateFilter === 'WEEK') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        } else if (dateFilter === 'MONTH') {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        }
        return true;
      });
    }
    
    // Sort: Priority first, then by date
    return filtered.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, searchQuery, statusFilter, dateFilter, paymentStatusFilter]);

  const filteredProducts = useMemo(() => products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())), [products, searchQuery]);
  const filteredFonts = useMemo(() => { 
    let result = fonts;
    
    // Filtrar por categoría
    if (activeFontCategory !== 'TODAS') {
      result = result.filter(f => (f.category || 'BASICAS') === activeFontCategory);
    }
    
    // Filtrar por estado
    if (fontStatusFilter === 'ACTIVE') {
      result = result.filter(f => f.active !== false);
    } else if (fontStatusFilter === 'INACTIVE') {
      result = result.filter(f => f.active === false);
    }
    
    // Filtrar por búsqueda
    if (fontSearchQuery) {
      const query = fontSearchQuery.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.id.toString().includes(query) ||
        (f.category || '').toLowerCase().includes(query)
      );
    }
    
    // Ordenar
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (fontSortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (fontSortBy === 'id') {
        comparison = a.id - b.id;
      } else if (fontSortBy === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      }
      return fontSortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [fonts, activeFontCategory, fontStatusFilter, fontSearchQuery, fontSortBy, fontSortOrder]);
  
  const filteredClients = useMemo(() => {
      const clientMap = new Map();
      orders.forEach(o => { 
          const key = o.customerPhone;
          if (!clientMap.has(key)) {
              clientMap.set(key, { 
                  name: o.customerName, 
                  phone: o.customerPhone, 
                  email: o.customerEmail || '-', 
                  totalOrders: 0, 
                  totalSpent: 0, 
                  lastOrderDate: o.createdAt, 
                  orders: [],
                  pointsRedeemed: 0
              });
          }
          const c = clientMap.get(key);
          c.totalOrders++;
          c.totalSpent += o.total;
          c.orders.push(o);
          if(o.pointsRedeemed) c.pointsRedeemed += o.pointsRedeemed;
      });
      return Array.from(clientMap.values()).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [orders, searchQuery]);

  const handleGoToClient = (phone: string) => {
      const client = filteredClients.find(c => c.phone === phone);
      if(client) {
          setSelectedClient(client);
          setActiveTab('CLIENTS');
      }
  };

  // Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset('LOGO');
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      const newAsset: BrandingAsset = {
        id: Date.now().toString(),
        name: file.name.split('.')[0].toUpperCase(),
        url,
        type: 'LOGO'
      };
      onUpdateStoreConfig({
        ...storeConfig,
        brandingAssets: [...(storeConfig.brandingAssets || []), newAsset],
        logoUrl: url
      });
      setUploadingAsset(null);
    };
    reader.onerror = () => {
      setUploadingAsset(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset('FAVICON');
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      const newAsset: BrandingAsset = {
        id: 'fav-' + Date.now().toString(),
        name: file.name.split('.')[0].toUpperCase(),
        url,
        type: 'ICON'
      };
      onUpdateStoreConfig({
        ...storeConfig,
        faviconUrl: url,
        brandingAssets: [...(storeConfig.brandingAssets || []), newAsset]
      });
      setUploadingAsset(null);
    };
    reader.onerror = () => {
      setUploadingAsset(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset('BANNER');
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      const newAsset: BrandingAsset = {
        id: 'ban-' + Date.now().toString(),
        name: file.name.split('.')[0].toUpperCase(),
        url,
        type: 'ILUSTRACION'
      };
      onUpdateStoreConfig({
        ...storeConfig,
        bannerUrl: url,
        brandingAssets: [...(storeConfig.brandingAssets || []), newAsset]
      });
      setUploadingAsset(null);
    };
    reader.onerror = () => {
      setUploadingAsset(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  
  // Handler for uploading to gallery with category selection
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newAsset: BrandingAsset = { 
          id: 'gal-' + Date.now().toString(), 
          name: file.name.split('.')[0].toUpperCase(), 
          url: ev.target?.result as string, 
          type: category as 'LOGO' | 'ICON' | 'ILUSTRACION' | 'FORMS' | 'OTHER'
        };
        onUpdateStoreConfig({ 
          ...storeConfig, 
          galleryAssets: [...(storeConfig.galleryAssets || []), newAsset]
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };
  const handleDeleteGlobalColor = (name: string) => { onUpdateStoreConfig({ ...storeConfig, globalColors: storeConfig.globalColors.filter(c => c.name !== name) }); };
  const toggleFontActive = (font: FontOption) => { onUpdateFont(font.id, { ...font, active: !font.active }); };
  const createClientCoupon = () => { if(!selectedClient || !clientCouponData.code) return; const newCpn: Coupon = { code: clientCouponData.code.toUpperCase(), discountPercent: clientCouponData.discount, active: true, assignedToPhone: selectedClient.phone, createdAt: new Date().toISOString(), maxUses: 1, usedCount: 0 }; onUpdateStoreConfig({ ...storeConfig, coupons: [...storeConfig.coupons, newCpn] }); setClientCouponData({ code: '', discount: 10 }); alert("Cupón personal creado."); };
  const handleAddGlobalColor = () => { if(!newColorPreset.name) return; onUpdateStoreConfig({ ...storeConfig, globalColors: [...(storeConfig.globalColors || []), { name: newColorPreset.name.toUpperCase(), hex: newColorPreset.hex }] }); setNewColorPreset({ name: '', hex: '#000000' }); };
  
  const creditPointsToUser = (order: Order) => {
    if (!user || !order.pointsEarned || order.pointsEarned <= 0) return;
    
    const newBalance = (user.laserPoints || 0) + order.pointsEarned;
    const newHistory = [...(user.pointsHistory || []), {
      id: Date.now().toString() + '-earn',
      type: 'EARNED' as const,
      amount: order.pointsEarned,
      date: new Date().toISOString(),
      orderId: order.id,
      description: `Premio compra #${order.id}`
    }];
    
    setUser({ ...user, laserPoints: newBalance, pointsHistory: newHistory });
  };

  const handleUpdateOrderField = (field: keyof Order, value: any) => { 
    if (!selectedOrder) return; 
    let updated = { ...selectedOrder, [field]: value }; 
    if (field === 'paymentStatus' && value === 'PAGADO') { 
      updated.amountPaid = updated.total;
      creditPointsToUser(updated);
    } 
    setSelectedOrder(updated); 
    onUpdateOrder(updated); 
  };
  
  const handleStatusChange = (order: Order, newStatus: OrderStatus) => { 
    const updated = { 
      ...order, 
      status: newStatus, 
      history: [...order.history, { timestamp: new Date().toISOString(), status: newStatus, operator: 'ADMIN' }] 
    }; 
    if (newStatus === OrderStatus.COMPLETED && order.paymentStatus === 'PAGADO' && !order.pointsEarned) {
      creditPointsToUser(updated);
    }
    setSelectedOrder(updated); 
    onUpdateOrder(updated); 
    
    // Send notification to customer
    notificationService.notifyOrderStatusChange(
      order.id,
      order.customerName,
      newStatus,
      order.total
    );
  };

  const handleWhatsAppClick = (order: Order) => {
    const link = getWhatsAppLink(order.customerPhone, 'confirmation', order, order.customerName);
    window.open(link, '_blank');
  };

  const handleDuplicateOrder = (order: Order) => {
    const newOrder: Order = {
      ...order,
      id: `LM-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: OrderStatus.RECEIVED,
      history: [{ timestamp: new Date().toISOString(), status: OrderStatus.RECEIVED, operator: 'ADMIN', note: `Duplicado de ${order.id}` }],
      isPriority: false
    };
    onAddOrder(newOrder);
    setSelectedOrder(newOrder);
  };
   
   
  const handleTogglePriority = (order: Order) => {
    const updated = { ...order, isPriority: !order.isPriority };
    setSelectedOrder(updated);
    onUpdateOrder(updated);
  };
  
  const handleAddOrderNote = (order: Order, note: string) => {
    const updated = { 
      ...order, 
      internalNotes: [...(order.internalNotes || []), { 
        id: Date.now().toString(), 
        text: note, 
        timestamp: new Date().toISOString(), 
        author: 'ADMIN' 
      }]
    };
    setSelectedOrder(updated);
    onUpdateOrder(updated);
  };
  
  const handleDeleteOrderNote = (order: Order, noteId: string) => {
    const updated = { 
      ...order, 
      internalNotes: (order.internalNotes || []).filter(n => n.id !== noteId)
    };
    setSelectedOrder(updated);
    onUpdateOrder(updated);
  };
   
  const handleQuickStatusUpdate = (orderId: string, newStatus: OrderStatus) => { const order = orders.find(o => o.id === orderId); if(order) handleStatusChange(order, newStatus); };
  const handleBulkUpdateProducts = (updatedProducts: Product[]) => { updatedProducts.forEach(p => onUpdateProduct(p)); alert(`Se actualizaron ${updatedProducts.length} productos correctamente.`); };
  const handleCloudMigration = async () => { if (!confirm("Esto subirá TODOS tus datos locales a Firebase. ¿Continuar?")) return; setIsMigrating(true); try { await migrateConfigToCloud(storeConfig); await migrateFontsToCloud(fonts); await migrateProductsToCloud(products); await migrateOrdersToCloud(orders); alert("¡Migración Completada! Recarga la página."); window.location.reload(); } catch (error) { console.error(error); alert("Error durante la migración."); } finally { setIsMigrating(false); } };
  
  const handleDownloadBackup = () => {
      const backup = {
          storeConfig,
          products,
          fonts,
          orders,
          pricing,
          exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lasermachine-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };
    // ...existing code...
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setNotes(e.target.value); localStorage.setItem('admin_dashboard_notes', e.target.value); };

  // Context Menu Helper for Orders
  const getOrderContextMenuItems = (order: Order): import('../types').ContextMenuItem[] => [
    {
      id: 'edit',
      label: 'Editar orden',
      icon: <Edit size={16} />,
      onClick: () => { setSelectedOrder(order); }
    },
    {
      id: 'duplicate',
      label: 'Duplicar orden',
      icon: <Copy size={16} />,
      onClick: () => handleDuplicateOrder(order)
    },
    {
      id: 'priority',
      label: order.isPriority ? 'Quitar prioridad' : 'Marcar prioridad',
      icon: <Star size={16} className={order.isPriority ? 'fill-amber-500 text-amber-500' : ''} />,
      onClick: () => onUpdateOrderPriority(order.id, !order.isPriority)
    },
    {
      id: 'whatsapp',
      label: 'Enviar WhatsApp',
      icon: <MessageCircle size={16} />,
      onClick: () => handleWhatsAppClick(order)
    },
    {
      id: 'print',
      label: 'Imprimir / PDF',
      icon: <Printer size={16} />,
      onClick: () => window.print()
    },
    {
      id: 'separator1',
      label: '---'
    },
    {
      id: 'status',
      label: 'Cambiar estado',
      icon: <ArrowRight size={16} />,
      submenu: Object.values(OrderStatus).map(status => ({
        id: `status-${status}`,
        label: status.replace('_', ' '),
        onClick: () => handleStatusChange(order, status)
      }))
    },
    {
      id: 'separator2',
      label: '---'
    },
    {
      id: 'delete',
      label: 'Eliminar orden',
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: () => {
        if (confirm(`¿Eliminar orden ${order.id}?`)) {
          onUpdateOrder({ ...order, status: OrderStatus.CANCELLED });
        }
      }
    }
  ];

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const days = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
          const d = new Date(year, month, i);
          days.push(d);
      }
      return days;
  };

  return (
        <div className="flex flex-col md:flex-row h-full bg-zinc-100 dark:bg-black font-sans overflow-hidden">
            {/* Sidebar glassmorphism - Desktop only */}
            <aside className="hidden md:flex w-24 flex-col shrink-0 h-full items-center py-6 gap-4 bg-zinc-200 dark:bg-zinc-900 border-r border-zinc-300 dark:border-zinc-800 rounded-3xl m-4 shadow-xl">
                <div className="flex flex-col items-center gap-3 w-full">
                    {/* Menu Items */}
                    {[ 
                        { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart3 },
                        { id: 'PRODUCTION', label: 'Producción', icon: Zap },
                        { id: 'ORDERS', label: 'Pedidos', icon: LayoutDashboard },
                        { id: 'CALENDAR', label: 'Calendario', icon: CalendarDays },
                        { id: 'INVENTORY', label: 'Inventario', icon: Package },
                        { id: 'CLIENTS', label: 'CRM Clientes', icon: Users },
                        { id: 'FONTS', label: 'Fonts', icon: Type },
                        { id: 'GALERIA', label: 'Galería', icon: Images },
                        { id: 'CONTENT', label: 'Contenido', icon: LayoutGrid },
                        { id: 'EMPRESAS', label: 'Empresas', icon: Building2 },
                        { id: 'SETTINGS', label: 'Ajustes', icon: Settings },
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id as any)}
                            className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all ${activeTab === item.id ? 'bg-amber-500 text-white shadow-lg shadow-black/20 scale-110' : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white'}`}
                            title={item.label}
                        >
                            <item.icon size={22} />
                        </button>
                    ))}
                </div>
                <div className="flex-1"></div>
                
                {/* RAB Button in Sidebar */}
                {onOpenAssistant && (
                    <button 
                        onClick={() => onOpenAssistant()}
                        className="w-14 h-14 flex items-center justify-center rounded-2xl transition-all bg-gradient-to-br from-amber-400 to-amber-500 text-zinc-900 shadow-lg shadow-amber-500/25 hover:scale-110 hover:shadow-amber-500/40 group relative"
                        title="RAB (Cmd+K)"
                    >
                        <img src="/assets/icons/2svgagenticon.svg" alt="RAB" className="w-7 h-7" />
                    </button>
                )}
            </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative bg-zinc-50 dark:bg-zinc-950 w-full">
        <header className="h-14 md:h-16 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-between px-6 md:px-12 z-10 shrink-0">
           <div className="flex items-center gap-8 overflow-hidden w-full md:w-auto">
                {activeTab === 'ORDERS' && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                        <button 
                            onClick={() => setStatusFilter('TODOS')}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all active:scale-95 flex items-center gap-2 ${statusFilter === 'TODOS' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-300 dark:border-zinc-700'}`}
                         >
                            Todos <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-1.5 py-0.5 rounded-lg text-[10px] font-bold">{orders.length}</span>
                         </button>
                        {Object.values(OrderStatus).map(status => (
                            <button 
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all active:scale-95 flex items-center gap-2 ${statusFilter === status ? getStatusBadgeColor(status) + ' ring-2 ring-offset-1 dark:ring-offset-black' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-300 dark:border-zinc-700'}`}
                            >
                                {status.replace('_', ' ')} 
                                <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${statusFilter === status ? 'bg-white/20 dark:bg-zinc-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                    {ordersByStatus[status] || 0}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
           </div>
        </header>

        <div className={`flex-1 overflow-y-auto custom-scrollbar ${activeTab === 'ORDERS' ? 'p-0' : 'p-6 md:p-12'}`}>
            {activeTab === 'DASHBOARD' && (
                <div className="space-y-6">
                    {/* Enhanced KPI Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* Ventas Hoy */}
                        <KPICard
                            title="Ventas Hoy"
                            value={formatCurrency(todaysRevenue)}
                            subtitle={yesterdayRevenue > 0 ? `vs ${formatCurrency(yesterdayRevenue)} ayer` : 'Sin ventas ayer'}
                            icon={<DollarSign size={18} />}
                            trend={{
                                value: Math.abs(Math.round(revenueChange)),
                                label: 'vs ayer',
                                direction: revenueChange >= 0 ? 'up' : 'down'
                            }}
                            accent="amber"
                            onClick={() => {
                                document.getElementById('advanced-stats-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />

                        {/* Ventas Semana */}
                        <KPICard
                            title="Ventas Semana"
                            value={formatCurrency(weeklyRevenue)}
                            subtitle="Últimos 7 días"
                            icon={<TrendingUp size={18} />}
                            trend={{
                                value: Math.abs(Math.round(weeklyChange)),
                                label: 'vs semana pasada',
                                direction: weeklyChange >= 0 ? 'up' : 'down'
                            }}
                            accent="success"
                            onClick={() => {
                                document.getElementById('advanced-stats-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />

                        {/* Por Aprobar */}
                        <KPICard
                            title="Por Aprobar"
                            value={`${ordersByStatus[OrderStatus.WAITING_APPROVAL] || 0}`}
                            subtitle="Órdenes pendientes"
                            icon={<Eye size={18} />}
                            accent="info"
                            onClick={() => { setStatusFilter(OrderStatus.WAITING_APPROVAL); setActiveTab('ORDERS'); }}
                        />

                        {/* En Producción */}
                        <KPICard
                            title="En Producción"
                            value={`${ordersByStatus[OrderStatus.IN_PRODUCTION] || 0}`}
                            subtitle={urgentOrdersCount > 0 ? `${urgentOrdersCount} urgentes` : 'Sin urgentes'}
                            icon={<Zap size={18} />}
                            accent={urgentOrdersCount > 0 ? 'danger' : 'amber'}
                            onClick={() => setActiveTab('PRODUCTION')}
                        />

                        {/* Completados Hoy */}
                        <KPICard
                            title="Completados Hoy"
                            value={`${completedToday}`}
                            subtitle={avgProductionTime > 0 ? `Prom: ${avgProductionTime}h` : 'Sin datos'}
                            icon={<CheckCircle2 size={18} />}
                            accent="success"
                            onClick={() => { setStatusFilter(OrderStatus.COMPLETED); setActiveTab('ORDERS'); }}
                        />

                        {/* Meta del Día */}
                        <KPICard
                            title="Meta del Día"
                            value={`${Math.round(dailyGoalProgress)}%`}
                            subtitle={`${formatCurrency(todaysRevenue)} / ${formatCurrency(DAILY_GOAL)}`}
                            icon={<Target size={18} />}
                            accent={dailyGoalMet ? 'success' : 'amber'}
                            onClick={() => {
                                document.getElementById('advanced-stats-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                        
                        {/* Utilidad Hoy */}
                        <KPICard
                            title="Utilidad Hoy"
                            value={formatCurrency(todaysProfit)}
                            subtitle={yesterdayRevenue > 0 ? `vs ${formatCurrency(todaysProfit - (yesterdayRevenue * PROFIT_MARGIN))} ayer` : 'Sin datos ayer'}
                            icon={<TrendingUp size={18} />}
                            trend={{
                                value: Math.abs(Math.round(((todaysProfit - (yesterdayRevenue * PROFIT_MARGIN)) / (yesterdayRevenue * PROFIT_MARGIN || 1)) * 100)),
                                label: 'vs ayer',
                                direction: todaysProfit >= (yesterdayRevenue * PROFIT_MARGIN) ? 'up' : 'down'
                            }}
                            accent="success"
                            onClick={() => {
                                document.getElementById('advanced-stats-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                        
                        {/* Utilidad Semana */}
                        <KPICard
                            title="Utilidad Semana"
                            value={formatCurrency(weeklyProfit)}
                            subtitle="Últimos 7 días"
                            icon={<TrendingUp size={18} />}
                            accent="success"
                            onClick={() => {
                                document.getElementById('advanced-stats-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                        
                        {/* Utilidad Mes */}
                        <KPICard
                            title="Utilidad Mes"
                            value={formatCurrency(monthlyProfit)}
                            subtitle="Este mes"
                            icon={<TrendingUp size={18} />}
                            accent="success"
                            onClick={() => {
                                document.getElementById('advanced-stats-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                    </div>

                    {/* Sparkline Chart */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Tendencia de Ventas</h4>
                            <span className="text-xs text-zinc-500">Últimos 7 días</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <Sparkline 
                                data={sparklineData} 
                                width={200} 
                                height={40}
                                color="var(--color-accent-500)"
                            />
                            <span className="text-xs text-zinc-500 mb-1">
                                {sparklineData[sparklineData.length - 1] > sparklineData[sparklineData.length - 2] ? '↑' : '↓'} 
                                {' '}{formatCurrency(sparklineData[sparklineData.length - 1])}
                            </span>
                        </div>
                    </div>

                    {/* RAB Widget */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <div className="flex flex-col sm:flex-row items-stretch">
                            {/* LEFT — branding */}
                            <div className="flex items-center gap-3 px-4 py-3 sm:border-r border-b sm:border-b-0 border-zinc-200 dark:border-zinc-800 shrink-0">
                                <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
                                    <img src="/assets/icons/2svgagenticon.svg" alt="RAB" className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Asistente IA</p>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white">RAB</p>
                                </div>
                            </div>

                            {/* RIGHT — input + suggestions */}
                            <div className="flex-1 flex flex-col px-4 py-3 gap-2">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (rabInputValue.trim()) {
                                            onOpenAssistant?.(rabInputValue.trim());
                                            setRabInputValue('');
                                        }
                                    }}
                                    className="flex items-center gap-2 w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus-within:border-amber-500 transition-all"
                                >
                                    <input
                                        type="text"
                                        value={rabInputValue}
                                        onChange={(e) => setRabInputValue(e.target.value)}
                                        placeholder="Pregúntale algo a RAB…"
                                        className="flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none"
                                    />
                                    {rabInputValue.trim() ? (
                                        <button type="submit" className="text-xs bg-amber-500 hover:bg-amber-400 text-white font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0">
                                            Enviar
                                        </button>
                                    ) : (
                                        <kbd className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded font-mono text-zinc-500 shrink-0">
                                            ⌘K
                                        </kbd>
                                    )}
                                </form>
                                
                                {/* Quick actions */}
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: 'Ventas hoy', icon: TrendingUp },
                                        { label: 'Pedidos pendientes', icon: Clock },
                                        { label: 'Stock bajo', icon: Package },
                                    ].map(({ label, icon: Icon }) => (
                                        <button
                                            key={label}
                                            onClick={() => onOpenAssistant?.(label.toLowerCase())}
                                            className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 px-2 py-1 rounded transition-colors flex items-center gap-1 border border-zinc-200 dark:border-zinc-700"
                                        >
                                            <Icon size={10}/>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Widget - Compact with Actions */}
                    <AlertsWidget 
                      products={products} 
                      orders={orders}
                      className="mb-4"
                      onNavigate={(view, filter) => {
                        setActiveTab(view as any);
                        if (filter) setStatusFilter(filter);
                      }}
                      onViewProduct={(productId) => {
                        setActiveTab('INVENTORY');
                        // Could add logic to scroll to product or open edit modal
                      }}
                    />

                    {/* Main Content - Orders List + Weekly Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Weekly Sales - Functional: Click day to see orders */}
                        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase">Ventas Semanales</h4>
                                <span className="text-lg font-black text-amber-500">{formatCurrency(weeklyRevenue)}</span>
                            </div>
                            
                            <div className="space-y-3">
                                {dailySales.map((day, i) => {
                                    const maxVal = Math.max(...dailySales.map(d => d.amount), 1);
                                    const percentage = (day.amount / maxVal) * 100;
                                    const isToday = i === dailySales.length - 1;
                                    const hasOrders = day.orders > 0;
                                    
                                    return (
                                        <button 
                                            key={i} 
                                            onClick={() => {
                                                // Filter orders for this specific day
                                                const dayDate = new Date();
                                                dayDate.setDate(dayDate.getDate() - (6 - i));
                                                const dayStart = new Date(dayDate);
                                                dayStart.setHours(0,0,0,0);
                                                const dayEnd = new Date(dayDate);
                                                dayEnd.setHours(23,59,59,999);
                                                
                                                // Set date filter and go to orders
                                                setStatusFilter('TODOS');
                                                setActiveTab('ORDERS');
                                            }}
                                            className="w-full flex items-center gap-3 group transition-all active:scale-95"
                                        >
                                            <span className={`text-xs font-bold w-8 ${isToday ? 'text-amber-500' : 'text-zinc-500'}`}>{day.day}</span>
                                            <div className="flex-1 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden relative">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${isToday ? 'bg-amber-500' : hasOrders ? 'bg-zinc-400 dark:bg-zinc-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                                    style={{ width: `${Math.max(percentage, hasOrders ? 4 : 0)}%` }}
                                                />
                                                {hasOrders && (
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                                        {day.orders}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 w-16 text-right">
                                                {formatCurrency(day.amount)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Orders - Full width functional list */}
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase">Órdenes Recientes</h4>
                                <button 
                                    onClick={() => setActiveTab('ORDERS')}
                                    className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase transition-all active:scale-95"
                                >
                                    Ver todas →
                                </button>
                            </div>
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {recentOrders.slice(0, 6).map((order) => (
                                    <button 
                                        key={order.id}
                                        onClick={() => { setSelectedOrder(order); setActiveTab('ORDERS'); }}
                                        className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95 text-left rounded-xl"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-black text-zinc-600 dark:text-zinc-400">
                                                {order.customerName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-zinc-900 dark:text-white truncate">{order.customerName}</span>
                                                <span className="text-xs text-zinc-500">#{order.id.slice(-4)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span>{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</span>
                                                <span>•</span>
                                                <span>{formatTimeAgo(order.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-zinc-900 dark:text-white">{formatCurrency(order.total)}</p>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusBadgeColor(order.status)}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                                {recentOrders.length === 0 && (
                                    <div className="p-8 text-center text-zinc-500">
                                        <ClipboardList size={32} className="mx-auto mb-2 opacity-30"/>
                                        <p className="text-sm">No hay órdenes aún</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* Advanced Stats - Only show on DASHBOARD tab */}
            {activeTab === 'DASHBOARD' && (
            <div id="advanced-stats-section" className="p-6 md:p-12 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                <AdvancedStats orders={orders} products={products} />
            </div>
            )}

            {activeTab === 'CALENDAR' && (
                <div className="h-full flex flex-col font-sans relative overflow-hidden">
                    
                    {/* TOP NAV & TIMELINE */}
                    <div className="shrink-0 pb-8">
                        <div className="flex justify-between items-center mb-8 px-2">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-black/20">
                                    {currentDate.getDate()}
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">
                                        Nivel: Producción
                                    </h1>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1 hover:bg-zinc-200/20 dark:hover:bg-zinc-800/30 rounded text-zinc-500"><ChevronLeft size={14}/></button>
                                            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1 hover:bg-zinc-200/20 dark:hover:bg-zinc-800/30 rounded text-zinc-500"><ChevronRight size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
                                <CalendarClock size={16}/> Agenda Global
                            </button>
                        </div>

                        {/* HORIZONTAL TIMELINE */}
                        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-proximity scrollbar-hide px-2">
                            {next7Days.map((day, idx) => {
                                const dateStr = day.toISOString().split('T')[0];
                                const isSelected = dateStr === selectedCalendarDate;
                                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                const hasOrders = orders.some(o => normalizeDate(o.deliveryDate) === dateStr);
                                
                                return (
                                    <button 
                                        key={dateStr}
                                        onClick={() => setSelectedCalendarDate(dateStr)}
                                        className={`flex flex-col items-center gap-3 min-w-[3rem] group transition-all duration-300 ${isSelected ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">{day.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}</span>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black transition-all shadow-sm relative ${isSelected ? 'bg-amber-500 text-white shadow-black/20' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200/40 dark:border-zinc-700/40'}`}>
                                            {day.getDate()}
                                            {isToday && <div className="absolute -top-1 -right-1 w-3 h-3 bg-system-success rounded-full border-2 border-white dark:border-zinc-900"></div>}
                                            {hasOrders && !isSelected && <div className="absolute -bottom-1 w-1 h-1 bg-system-accent rounded-full"></div>}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-12">
                        
                        {/* SECTION: OBJECTIVES (Daily Orders) */}
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                Entregas del Día <span className="bg-zinc-200/20 dark:bg-zinc-800/30 text-zinc-500 text-[10px] px-2 py-1 rounded-full">{orders.filter(o => normalizeDate(o.deliveryDate) === selectedCalendarDate).length}</span>
                            </h3>
                            
                            <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory">
                                {orders.filter(o => normalizeDate(o.deliveryDate) === selectedCalendarDate).length === 0 ? (
                                    <div className="w-full py-12 border-2 border-dashed border-zinc-200/40 dark:border-zinc-700/40 rounded-3xl flex flex-col items-center justify-center text-zinc-500">
                                        <CalendarClock size={48} className="mb-4 opacity-20"/>
                                        <p className="font-bold uppercase tracking-widest text-xs">Sin entregas programadas</p>
                                    </div>
                                ) : (
                                    orders.filter(o => normalizeDate(o.deliveryDate) === selectedCalendarDate).map(order => (
                                        <div 
                                            key={order.id} 
                                            onClick={() => { setSelectedOrder(order); setActiveTab('ORDERS'); }}
                                            className="min-w-[320px] md:min-w-[400px] bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] p-8 shadow-xl border border-zinc-200 dark:border-zinc-700 relative group cursor-pointer hover:-translate-y-2 transition-transform duration-500 snap-center"
                                        >
                                            <div className="absolute top-6 right-6">
                                                <div className={`w-3 h-3 rounded-full ${order.status === OrderStatus.COMPLETED ? 'bg-system-success' : 'bg-white dark:bg-zinc-800'}`}></div>
                                            </div>
                                            
                                            <div className="mb-8">
                                                <span className="inline-block px-3 py-1 bg-zinc-200/20 dark:bg-zinc-800/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Orden #{order.id}</span>
                                                <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase leading-none">{order.customerName}</h4>
                                                <p className="text-xs text-zinc-500 mt-2 font-medium">{order.items.length} productos • {order.deliveryTime || 'S/H'}</p>
                                            </div>

                                            <div className="flex gap-3 mt-auto">
                                                <div className="h-12 w-full bg-zinc-200/20 dark:bg-zinc-800/30 rounded-xl border border-zinc-200/40 dark:border-zinc-700/40 flex items-center px-4">
                                                    <div className="w-full h-1.5 bg-zinc-200/40 dark:bg-zinc-800/40 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-amber-500" 
                                                            style={{ width: order.status === OrderStatus.COMPLETED ? '100%' : order.status === OrderStatus.IN_PRODUCTION ? '60%' : '20%' }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <button className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                                                    <ArrowRight size={18}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* SECTION: PRACTICAL (Widgets) */}
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight mb-6">Resumen Operativo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                
                                {/* Widget 1: Pendientes Aprobación */}
                                <button 
                                    onClick={() => { setStatusFilter(OrderStatus.WAITING_APPROVAL); setActiveTab('ORDERS'); }}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl relative overflow-hidden shadow-sm group min-h-[200px] flex flex-col justify-between text-left hover:border-amber-500/50 transition-all active:scale-95"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors">
                                            <AlertCircle size={20} className="text-zinc-600 dark:text-zinc-400 group-hover:text-amber-600"/>
                                        </div>
                                        {ordersByStatus[OrderStatus.WAITING_APPROVAL] > 0 && (
                                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"/>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-black text-zinc-900 dark:text-white">{ordersByStatus[OrderStatus.WAITING_APPROVAL]}</h4>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Por Aprobar</p>
                                        <p className="text-[10px] text-zinc-500 mt-2">Requieren acción inmediata</p>
                                    </div>
                                </button>

                                {/* Widget 2: Pagos Parciales */}
                                <button 
                                    onClick={() => { setStatusFilter('TODOS'); setActiveTab('ORDERS'); }}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl relative overflow-hidden shadow-sm group min-h-[200px] flex flex-col justify-between text-left hover:border-amber-500/50 transition-all active:scale-95"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors">
                                            <DollarSign size={20} className="text-zinc-600 dark:text-zinc-400 group-hover:text-amber-600"/>
                                        </div>
                                        <span className="text-[10px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500">Finanzas</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold uppercase leading-tight text-zinc-900 dark:text-white">Saldos<br/>Pendientes</h4>
                                        <p className="text-xs font-medium text-zinc-500 mt-2">
                                            {orders.filter(o => o.paymentStatus === 'PARCIAL').length} órdenes con pago parcial
                                        </p>
                                    </div>
                                </button>

                                {/* Widget 3: Stock */}
                                <button 
                                    onClick={() => setActiveTab('INVENTORY')}
                                    className={`p-6 rounded-2xl flex flex-col justify-between relative group text-left transition-all active:scale-95 ${lowStockProducts.length > 0 ? 'bg-amber-500' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${lowStockProducts.length > 0 ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-600'}`}>
                                        <Package size={24}/>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold uppercase text-sm ${lowStockProducts.length > 0 ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>Alerta Stock</h4>
                                        <p className={`text-xs mt-1 line-clamp-2 ${lowStockProducts.length > 0 ? 'text-white/80' : 'text-zinc-500'}`}>
                                            {lowStockProducts.length > 0 
                                                ? `${lowStockProducts.length} productos bajo mínimo.` 
                                                : "Inventario saludable."}
                                        </p>
                                    </div>
                                </button>

                                {/* Widget 4: Producción */}
                                <button 
                                    onClick={() => { setStatusFilter(OrderStatus.IN_PRODUCTION); setActiveTab('ORDERS'); }}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex flex-col justify-between text-left hover:border-amber-500/50 transition-all active:scale-95 group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors">
                                            <Zap size={20} className="text-zinc-600 dark:text-zinc-400 group-hover:text-amber-600"/>
                                        </div>
                                        <span className="text-2xl font-black text-zinc-900 dark:text-white">{ordersByStatus[OrderStatus.IN_PRODUCTION] || 0}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900 dark:text-white uppercase text-sm">En Producción</h4>
                                        <p className="text-xs text-zinc-500 mt-1">Órdenes activas</p>
                                    </div>
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ORDERS' && (
                <div className="flex flex-col h-full overflow-hidden relative bg-zinc-50 dark:bg-zinc-950">
                    {/* FINANCE DRAWER - Overlay from right */}
                    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${financeDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFinanceDrawerOpen(false)}/>
                        <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl transform transition-transform duration-300 ${financeDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                            {selectedOrder && (
                                <div className="h-full flex flex-col">
                                    {/* Drawer Header */}
                                    <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                                        <div>
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Resumen Financiero</h3>
                                            <p className="text-sm text-zinc-500">Orden #{selectedOrder.id.replace('LM-', '')}</p>
                                        </div>
                                        <button onClick={() => setFinanceDrawerOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                            <X size={20} className="text-zinc-500"/>
                                        </button>
                                    </div>
                                    
                                    {/* Drawer Content */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {/* Total Amount - Big Display */}
                                        <div className="bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl p-6 text-center">
                                            <p className="text-amber-900/60 text-xs font-bold uppercase tracking-wider mb-1">Monto Total</p>
                                            <p className="text-4xl font-black text-amber-950 tracking-tight">{formatCurrency(selectedOrder.total)}</p>
                                        </div>
                                        
                                        {/* Payment Status */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado de Pago</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['PENDIENTE', 'PARCIAL', 'PAGADO', 'REEMBOLSADO'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleUpdateOrderField('paymentStatus', status)}
                                                        className={`px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 ${
                                                            selectedOrder.paymentStatus === status
                                                                ? status === 'PAGADO' ? 'bg-system-success text-white shadow-lg'
                                                                : status === 'PENDIENTE' ? 'bg-system-error text-white shadow-lg'
                                                                : status === 'PARCIAL' ? 'bg-system-accent text-white shadow-lg'
                                                                : 'bg-zinc-600 text-white'
                                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                        }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Payment Method */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Método de Pago</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                                                    { id: 'TRANSFERENCIA', label: 'Transferencia', icon: ArrowRight },
                                                    { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                                                    { id: 'MERCADOPAGO', label: 'MercadoPago', icon: QrCode },
                                                ].map((method) => (
                                                    <button
                                                        key={method.id}
                                                        onClick={() => handleUpdateOrderField('paymentMethod', method.id)}
                                                        className={`px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                                            selectedOrder.paymentMethod === method.id 
                                                                ? 'bg-amber-500 text-white shadow-lg'
                                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                        }`}
                                                    >
                                                        <method.icon size={14}/>
                                                        {method.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Amount Paid Input */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Monto Abonado</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-lg">$</span>
                                                <input 
                                                    type="number" 
                                                    value={selectedOrder.amountPaid || 0} 
                                                    onChange={(e) => handleUpdateOrderField('amountPaid', parseFloat(e.target.value))}
                                                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-4 font-mono font-bold text-2xl text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-all"
                                                />
                                            </div>
                                            {selectedOrder.paymentStatus === 'PARCIAL' && (
                                                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800/50">
                                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">Restante</span>
                                                    <span className="text-xl font-black text-red-600 dark:text-red-400">{formatCurrency(selectedOrder.total - (selectedOrder.amountPaid || 0))}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Delivery Info */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Logística</label>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Fecha de Entrega</label>
                                                    <input 
                                                        type="date" 
                                                        value={selectedOrder.deliveryDate || ''} 
                                                        onChange={(e) => handleUpdateOrderField('deliveryDate', e.target.value)}
                                                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Hora</label>
                                                    <select
                                                        value={selectedOrder.deliveryTime || ''}
                                                        onChange={(e) => handleUpdateOrderField('deliveryTime', e.target.value)}
                                                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-amber-500 appearance-none"
                                                    >
                                                        <option value="">Seleccionar hora</option>
                                                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Quick Client Info */}
                                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                                                    <UserCircle size={20} className="text-white"/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{selectedOrder.customerName}</p>
                                                    <p className="text-xs text-zinc-500 font-mono">{formatPhoneDisplay(selectedOrder.customerPhone)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* HISTORY MODAL */}
                    {showHistoryModal && selectedOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800">
                                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Historial de Cambios</h3>
                                    <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                                        <X size={20} className="text-zinc-500"/>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="space-y-4">
                                        {selectedOrder.history.map((event, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-3 h-3 rounded-full bg-amber-500"/>
                                                    {idx < selectedOrder.history.length - 1 && <div className="w-0.5 h-full bg-zinc-200 dark:bg-zinc-700 mt-2"/>}
                                                </div>
                                                <div className="pb-6">
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{event.status.replace('_', ' ')}</p>
                                                    <p className="text-xs text-zinc-500">{formatDateTime(event.timestamp)} • {event.operator}</p>
                                                    {event.note && <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{event.note}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TOP SECTION: Order List */}
                    <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        {/* Search & Filters Row */}
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-col gap-3">
                            <div className="flex flex-col xl:flex-row xl:flex-wrap items-stretch xl:items-center gap-3">
                                <div className="relative flex-1 max-w-md w-full min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
                                    <input 
                                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                        placeholder="ID (LM-…), nombre, teléfono o email…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        aria-label="Buscar pedidos"
                                    />
                                </div>
                                <select
                                  value={paymentStatusFilter}
                                  onChange={(e) => setPaymentStatusFilter(e.target.value as 'ALL' | PaymentStatus)}
                                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-200 shrink-0"
                                  aria-label="Filtrar por estado de pago"
                                >
                                  <option value="ALL">Pago: todos</option>
                                  {Object.values(PaymentStatus).map((ps) => (
                                    <option key={ps} value={ps}>Pago: {ps}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => exportOrdersToCsv(filteredOrders, `pedidos-${new Date().toISOString().slice(0, 10)}.csv`)}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-black uppercase text-zinc-800 transition-all hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 active:scale-95 shrink-0"
                                >
                                  <Download size={14} /> Exportar CSV
                                </button>
                                {/* Date Filter */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            type="button"
                                            onClick={() => setDateFilter(filter)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 ${
                                                dateFilter === filter
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                            }`}
                                        >
                                            {filter === 'ALL' ? 'Todas' : filter === 'TODAY' ? 'Hoy' : filter === 'WEEK' ? '7 días' : '30 días'}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-sm text-zinc-500 shrink-0 xl:ml-auto">
                                    <span className="font-bold text-zinc-900 dark:text-white">{filteredOrders.length}</span> órdenes
                                </div>
                            </div>
                            </div>
                        </div>
                        
                        {/* Orders Horizontal Scroll */}
                        <div className="flex overflow-x-auto gap-3 px-6 py-4 no-scrollbar">
                            {filteredOrders.length === 0 && (
                                <div className="w-full flex items-center justify-center text-zinc-500 py-4">
                                    <Package size={20} className="mr-2"/>
                                    <span className="text-sm font-medium">Sin resultados</span>
                                </div>
                            )}
                            {filteredOrders.map((order, index) => {
                                const isSelected = selectedOrder?.id === order.id;
                                const isPriority = order.isPriority;
                                return (
                                    <button
                                        key={`${order.id}-${index}`}
                                        onClick={() => setSelectedOrder(order)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            showMenu(
                                                { x: e.clientX, y: e.clientY },
                                                getOrderContextMenuItems(order),
                                                order
                                            );
                                        }}
                                        className={`shrink-0 w-[280px] rounded-xl border text-left transition-all duration-200 active:scale-95 overflow-hidden relative ${
                                            isSelected 
                                                ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/25 ring-2 ring-amber-500/20' 
                                                : isPriority
                                                    ? 'bg-white dark:bg-zinc-800 border-red-400 dark:border-red-500 shadow-md'
                                                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-amber-500 hover:shadow-md'
                                        }`}
                                    >
                                        {/* Priority Indicator */}
                                        {isPriority && (
                                            <div className={`absolute top-0 right-0 w-0 h-0 border-t-[24px] border-l-[24px] border-transparent ${isSelected ? 'border-t-red-500' : 'border-t-red-500'}`}>
                                                <span className="absolute -top-[20px] right-[2px] text-[8px] font-bold text-white">!</span>
                                            </div>
                                        )}
                                        <div className={`p-4 ${isSelected ? '' : 'bg-zinc-50/50 dark:bg-zinc-800/50'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className={`font-bold text-sm truncate pr-6 ${isSelected ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                                                    {order.customerName}
                                                </h4>
                                                <span className={`text-[10px] font-medium shrink-0 ${isSelected ? 'text-amber-100' : 'text-zinc-400'}`}>
                                                    #{order.id.replace('LM-', '')}
                                                </span>
                                            </div>
                                            <p className={`text-xs ${isSelected ? 'text-amber-100' : 'text-zinc-500'}`}>
                                                {order.items.length} producto{order.items.length !== 1 ? 's' : ''} • {formatDateSimple(order.createdAt)}
                                            </p>
                                            {isPriority && !isSelected && (
                                                <p className="text-[10px] text-red-500 font-bold uppercase mt-1">⚠ Prioridad</p>
                                            )}
                                        </div>
                                        <div className={`px-4 py-2.5 flex items-center justify-between border-t ${
                                            isSelected 
                                                ? 'border-amber-400/30 bg-amber-500' 
                                                : isPriority
                                                    ? 'border-red-800/50 bg-red-50 dark:bg-red-950/30'
                                                    : 'border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColorStrip(order.status).split(' ')[0].replace('bg-', '').replace('dark:bg-', '')}`} 
                                                     style={{background: isSelected ? 'white' : undefined}}/>
                                                <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                                                {formatCurrency(order.total)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 overflow-hidden">
                        {selectedOrder ? (
                            <div className="h-full flex flex-col lg:flex-row">
                                {/* LEFT: Order Details */}
                                <div className="print-area flex-1 h-full overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950">
                                    {/* Sticky Header */}
                                    <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">
                                                            {selectedOrder.customerName}
                                                        </h1>
                                                        {selectedOrder.isPriority && (
                                                            <span className="px-2 py-0.5 bg-system-error text-white text-[10px] font-bold uppercase rounded-full">
                                                                Prioridad
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-sm text-zinc-500 font-mono">#{selectedOrder.id.replace('LM-', '')}</span>
                                                        <span className="w-1 h-1 rounded-full bg-zinc-300"/>
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeColor(selectedOrder.status)}`}>
                                                            {selectedOrder.status.replace('_', ' ')}
                                                        </span>
                                                        <button 
                                                            onClick={() => setShowHistoryModal(true)}
                                                            className="text-[10px] text-amber-500 hover:text-amber-600 font-bold underline"
                                                        >
                                                            Ver historial
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {/* Priority Toggle */}
                                                <button 
                                                    type="button"
                                                    onClick={() => handleTogglePriority(selectedOrder)}
                                                    className={`no-print flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                                                        selectedOrder.isPriority
                                                            ? 'bg-system-error text-white border-system-error'
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-system-error'
                                                    }`}
                                                    title={selectedOrder.isPriority ? 'Quitar prioridad' : 'Marcar como prioridad'}
                                                >
                                                    <AlertTriangle size={16}/>
                                                </button>

                                                <button
                                                  type="button"
                                                  className="no-print flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                                  title="Imprimir ficha de pedido"
                                                  onClick={() => window.print()}
                                                >
                                                  <Printer size={16} />
                                                  <span className="hidden sm:inline">Imprimir</span>
                                                </button>
                                                
                                                {/* WhatsApp Quick Actions */}
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => {setShowWhatsAppMenu(!showWhatsAppMenu); setShowActionsMenu(false);}}
                                                        className="flex items-center gap-2 px-3 py-2 btn-system btn-system-success text-white rounded-xl text-sm font-bold transition-all"
                                                    >
                                                        <MessageCircle size={16}/>
                                                        <span className="hidden sm:inline">WhatsApp</span>
                                                        <ChevronDown size={14} className={`transition-transform ${showWhatsAppMenu ? 'rotate-180' : ''}`}/>
                                                    </button>
                                                    {showWhatsAppMenu && (
                                                        <>
                                                            <div className="fixed inset-0 z-20" onClick={() => setShowWhatsAppMenu(false)}/>
                                                            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-30">
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase px-3 py-2">Mensajes Rápidos</p>
                                                                <p className="text-[10px] text-zinc-500 px-3 pb-2 leading-snug">
                                                                  Sugerido según estado: {selectedOrder.status === OrderStatus.RECEIVED ? 'Confirmación' : selectedOrder.status === OrderStatus.IN_PRODUCTION || selectedOrder.status === OrderStatus.WAITING_APPROVAL ? 'Producción' : selectedOrder.status === OrderStatus.READY ? 'Listo' : 'Personalizado'}
                                                                </p>
                                                                <a 
                                                                    href={getWhatsAppLink(selectedOrder.customerPhone, storeConfig.messageTemplates.confirmation, selectedOrder)}
                                                                    target="_blank"
                                                                    onClick={() => setShowWhatsAppMenu(false)}
                                                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-bold text-zinc-900 dark:text-white"
                                                                >
                                                                    <CheckCircle size={16} className="text-blue-500"/>
                                                                    Confirmación
                                                                </a>
                                                                <a 
                                                                    href={getWhatsAppLink(selectedOrder.customerPhone, storeConfig.messageTemplates.production, selectedOrder)}
                                                                    target="_blank"
                                                                    onClick={() => setShowWhatsAppMenu(false)}
                                                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-bold text-zinc-900 dark:text-white"
                                                                >
                                                                    <Zap size={16} className="text-amber-500"/>
                                                                    En Producción
                                                                </a>
                                                                <a 
                                                                    href={getWhatsAppLink(selectedOrder.customerPhone, storeConfig.messageTemplates.ready, selectedOrder)}
                                                                    target="_blank"
                                                                    onClick={() => setShowWhatsAppMenu(false)}
                                                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-bold text-zinc-900 dark:text-white"
                                                                >
                                                                    <Check size={16} className="text-green-500"/>
                                                                    Pedido Listo
                                                                </a>
                                                                <div className="border-t border-zinc-200 dark:border-zinc-700 my-1"/>
                                                                <a 
                                                                    href={getWhatsAppLink(selectedOrder.customerPhone, `Hola {NOMBRE}, sobre tu orden #{ID}: `, selectedOrder)}
                                                                    target="_blank"
                                                                    onClick={() => setShowWhatsAppMenu(false)}
                                                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-bold text-zinc-900 dark:text-white"
                                                                >
                                                                    <MessageSquare size={16} className="text-zinc-400"/>
                                                                    Personalizado
                                                                </a>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {/* Primary Action: Finance Drawer */}
                                                <button 
                                                    onClick={() => setFinanceDrawerOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
                                                >
                                                    <DollarSign size={16}/>
                                                    <span className="hidden sm:inline">Finanzas</span>
                                                    <PanelRight size={16}/>
                                                </button>
                                                
                                                {/* Secondary Actions Menu - Status Change */}
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => {setShowActionsMenu(!showActionsMenu); setShowWhatsAppMenu(false);}}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${showActionsMenu ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700'}`}
                                                    >
                                                        <MoreVertical size={16}/>
                                                    </button>
                                                    {showActionsMenu && (
                                                        <>
                                                            <div className="fixed inset-0 z-20" onClick={() => setShowActionsMenu(false)}/>
                                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1 z-30">
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase px-3 py-2">Cambiar Estado</p>
                                                                {Object.values(OrderStatus).map(s => (
                                                                    <button 
                                                                        key={s} 
                                                                        onClick={() => {handleStatusChange(selectedOrder, s); setShowActionsMenu(false);}} 
                                                                        className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold uppercase text-zinc-900 dark:text-white flex items-center justify-between"
                                                                    >
                                                                        {s.replace('_', ' ')}
                                                                        {selectedOrder.status === s && <Check size={14} className="text-amber-500"/>}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-6 space-y-6">
                                        {/* Meta Info Bar */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Clock size={14}/>
                                                <span>{formatDateTime(selectedOrder.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Phone size={14}/>
                                                <span className="font-mono">{formatPhoneDisplay(selectedOrder.customerPhone)}</span>
                                            </div>
                                            {selectedOrder.deliveryDate && (
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <Calendar size={14}/>
                                                    <span className="font-bold">Entrega: {new Date(selectedOrder.deliveryDate).toLocaleDateString('es-MX')}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Items */}
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Productos</h3>
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                                    {/* Item Header */}
                                                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                                                <Package size={18} className="text-amber-600"/>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-zinc-900 dark:text-white">{item.productId}</h4>
                                                                <p className="text-xs text-zinc-500">{item.colorName} • Cantidad: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <span className="text-[10px] text-zinc-400 uppercase block">Fuente Frente</span>
                                                                <span className="font-mono font-bold text-zinc-900 dark:text-white">#{item.frontFontId}</span>
                                                            </div>
                                                            {item.backText && (
                                                                <div className="text-right pl-3 border-l border-zinc-200 dark:border-zinc-700">
                                                                    <span className="text-[10px] text-zinc-400 uppercase block">Fuente Dorso</span>
                                                                    <span className="font-mono font-bold text-zinc-900 dark:text-white">#{item.backFontId}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {item.notes && (
                                                      <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/25 border-b border-amber-200/80 dark:border-amber-900/50">
                                                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">Notas (taller / cliente)</p>
                                                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 whitespace-pre-wrap">{item.notes}</p>
                                                      </div>
                                                    )}
                                                    
                                                    {/* Previews */}
                                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                                                        <TechnicalPreview 
                                                            imageUrl={item.customBackgroundImage || products.find(p => p.id === item.productId)?.colors.find(c => c.name === item.colorName || c.name.toLowerCase() === item.colorName.toLowerCase())?.imageUrl || products.find(p => p.id === item.productId)?.imageUrl} 
                                                            text={item.frontText} text2={item.frontText2} 
                                                            fontName={item.frontFontName} fontCss={fonts.find(f => f.id === item.frontFontId)?.cssFamily || ''} 
                                                            logos={item.frontLogos} 
                                                            designState={item.frontDesignState} designState2={item.frontDesignState2} 
                                                            sideLabel="FRENTE"
                                                        />
                                                        <TechnicalPreview 
                                                            imageUrl={item.customBackgroundImage || products.find(p => p.id === item.productId)?.colors.find(c => c.name === item.colorName || c.name.toLowerCase() === item.colorName.toLowerCase())?.imageUrl || products.find(p => p.id === item.productId)?.imageUrl} 
                                                            text={item.backText} text2={item.backText2} 
                                                            fontName={item.backFontName} fontCss={fonts.find(f => f.id === item.backFontId)?.cssFamily || ''} 
                                                            logos={item.backLogos} 
                                                            designState={item.backDesignState} designState2={item.backDesignState2} 
                                                            sideLabel="DORSO"
                                                        />
                                                    </div>
                                                    
                                                    {/* Assets if any */}
                                                    {(item.customBackgroundImage || item.frontLogos.length > 0 || item.backLogos.length > 0) && (
                                                        <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                                            <p className="text-[10px] font-bold text-zinc-400 uppercase mb-3 flex items-center gap-1">
                                                                <Paperclip size={12}/> Archivos Adjuntos
                                                            </p>
                                                            <div className="flex gap-2 overflow-x-auto pb-1">
                                                                {item.customBackgroundImage && (
                                                                    <a href={item.customBackgroundImage} target="_blank" className="shrink-0 relative group">
                                                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                                                            <img src={item.customBackgroundImage} className="w-full h-full object-cover" alt={`Imagen de fondo del pedido ${item.id}`}/>
                                                                        </div>
                                                                         <span className="absolute -top-1 -right-1 w-4 h-4 bg-system-success rounded-full flex items-center justify-center">
                                                                            <Download size={8} className="text-white"/>
                                                                        </span>
                                                                    </a>
                                                                )}
                                                                {[...item.frontLogos, ...item.backLogos].map((logo, i) => (
                                                                    <a key={i} href={logo.originalUrl || logo.url} target="_blank" className="shrink-0 relative group">
                                                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white flex items-center justify-center p-1">
                                                                            <img src={logo.url} className="w-full h-full object-contain" alt={`Logo del pedido ${item.id}`}/>
                                                                        </div>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Internal Notes Section */}
                                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <StickyNote size={14}/> Notas Internas (Staff)
                                            </h3>
                                            
                                            {/* Add Note Input */}
                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    value={orderNoteInput}
                                                    onChange={(e) => setOrderNoteInput(e.target.value)}
                                                    placeholder="Agregar nota interna..."
                                                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && orderNoteInput.trim()) {
                                                            handleAddOrderNote(selectedOrder, orderNoteInput.trim());
                                                            setOrderNoteInput('');
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (orderNoteInput.trim()) {
                                                            handleAddOrderNote(selectedOrder, orderNoteInput.trim());
                                                            setOrderNoteInput('');
                                                        }
                                                    }}
                                                    disabled={!orderNoteInput.trim()}
                                                    className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Plus size={18}/>
                                                </button>
                                            </div>
                                            
                                            {/* Notes List */}
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {(selectedOrder.internalNotes || []).length === 0 ? (
                                                    <p className="text-xs text-zinc-400 text-center py-4">Sin notas internas</p>
                                                ) : (
                                                    (selectedOrder.internalNotes || []).slice().reverse().map((note) => (
                                                        <div key={note.id} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                                                                <span className="text-[10px] font-bold text-amber-600">{note.author[0]}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-zinc-700 dark:text-zinc-300">{note.text}</p>
                                                                <p className="text-[10px] text-zinc-400 mt-1">{formatDateTime(note.timestamp)}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteOrderNote(selectedOrder, note.id)}
                                                                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={14}/>
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* RIGHT: Info Sidebar (Desktop only) */}
                                <div className="hidden lg:block w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 overflow-y-auto">
                                    <div className="space-y-5">
                                        {/* Single Action - Client Profile */}
                                        <button 
                                            onClick={() => handleGoToClient(selectedOrder.customerPhone)}
                                            className="w-full flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-amber-400 transition-all shadow-sm"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                                                <UserCircle size={20} className="text-amber-600"/>
                                            </div>
                                            <div className="text-left">
                                                <span className="text-xs text-zinc-400 uppercase block">Cliente</span>
                                                <span className="font-bold text-sm text-zinc-900 dark:text-white">Ver Perfil</span>
                                            </div>
                                        </button>
                                        
                                        {/* Payment Summary */}
                                        <div>
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Resumen de Pago</h4>
                                            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-zinc-500">Total</span>
                                                    <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(selectedOrder.total)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-zinc-500">Abonado</span>
                                                    <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(selectedOrder.amountPaid || 0)}</span>
                                                </div>
                                                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Estado</span>
                                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                                                            selectedOrder.paymentStatus === 'PAGADO' ? 'badge-success'
                                                            : selectedOrder.paymentStatus === 'PARCIAL' ? 'badge-warning'
                                                            : 'badge-error'
                                                        }`}>
                                                            {selectedOrder.paymentStatus || 'PENDIENTE'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Delivery Summary */}
                                        {(selectedOrder.deliveryDate || selectedOrder.deliveryTime) && (
                                            <div>
                                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Entrega</h4>
                                                <div className="space-y-2">
                                                    {selectedOrder.deliveryDate && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar size={14} className="text-zinc-400"/>
                                                            <span className="text-zinc-700 dark:text-zinc-300">
                                                                {new Date(selectedOrder.deliveryDate).toLocaleDateString('es-MX', {weekday: 'short', day: 'numeric', month: 'short'})}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedOrder.deliveryTime && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock size={14} className="text-zinc-400"/>
                                                            <span className="text-zinc-700 dark:text-zinc-300">{selectedOrder.deliveryTime}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Shipping Address */}
                                        {selectedOrder.shippingAddress && (
                                            <div>
                                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Dirección / Notas</h4>
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl">
                                                    {selectedOrder.shippingAddress}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* Quick Stats */}
                                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Estadísticas</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Items</span>
                                                    <span className="font-bold text-zinc-900 dark:text-white">{selectedOrder.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Productos</span>
                                                    <span className="font-bold text-zinc-900 dark:text-white">{selectedOrder.items.length}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Método</span>
                                                    <span className="font-bold text-zinc-900 dark:text-white">{selectedOrder.paymentMethod || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                    <Package size={32} className="text-zinc-300"/>
                                </div>
                                <p className="font-bold text-zinc-600 dark:text-zinc-400">Selecciona una orden</p>
                                <p className="text-sm mt-1">Elige una orden de la lista superior para ver sus detalles</p>
                                {filteredOrders.length === 0 && searchQuery && (
                                    <button 
                                        onClick={() => {setSearchQuery(''); setStatusFilter('TODOS'); setDateFilter('ALL');}}
                                        className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'PRODUCTION' && (
                <ProductionSection
                    orders={orders}
                    products={products}
                    fonts={fonts}
                    onUpdateOrder={(orderId, updates) => {
                        const order = orders.find(o => o.id === orderId);
                        if (order) {
                            onUpdateOrder({ ...order, ...updates });
                        }
                    }}
                />
            )}

            {activeTab === 'INVENTORY' && (
                <InventoryManager
                    products={products}
                    categories={storeConfig.productCategories || ['General']}
                    globalColors={storeConfig.globalColors}
                    onAddProduct={onAddProduct}
                    onUpdateProduct={onUpdateProduct}
                    onDeleteProduct={onDeleteProduct}
                    onBulkDistributor={() => setIsBulkDistributorOpen(true)}
                />
            )}

            {activeTab === 'FONTS' && (
                <div className="space-y-6">
                    {/* Header Compacto */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Fonts</h3>
                            <p className="text-xs text-zinc-500 mt-1">{filteredFonts.length} de {fonts.length} fuentes</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsBulkFontModalOpen(true)} 
                                className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Layers size={14}/> Bulk
                            </button>
                            <button 
                                onClick={() => { setEditingFont(null); setIsFontModalOpen(true); }} 
                                className="px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500/80 shadow-lg shadow-black/20 transition-all flex items-center gap-2"
                            >
                                <Plus size={16}/> Nueva
                            </button>
                        </div>
                    </div>

                    {/* Toolbar Compacta */}
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Búsqueda */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
                            <input
                                type="text"
                                value={fontSearchQuery}
                                onChange={(e) => setFontSearchQuery(e.target.value)}
                                placeholder="Buscar fuentes..."
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-10 pr-9 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                            {fontSearchQuery && (
                                <button 
                                    onClick={() => setFontSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    <X size={14}/>
                                </button>
                            )}
                        </div>
                        
                        {/* Filtros en dropdowns */}
                        <div className="flex gap-2">
                            <select 
                                value={activeFontCategory} 
                                onChange={(e) => setActiveFontCategory(e.target.value as any)}
                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                                {['TODAS', 'BASICAS', 'DEPORTE', 'CURSIVA', 'FONTS 2026', 'KIDS'].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            
                            <select 
                                value={fontStatusFilter} 
                                onChange={(e) => setFontStatusFilter(e.target.value as any)}
                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                                <option value="ALL">Todas</option>
                                <option value="ACTIVE">Activas</option>
                                <option value="INACTIVE">Inactivas</option>
                            </select>
                            
                            <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 rounded-xl p-1">
                                <select 
                                    value={fontSortBy} 
                                    onChange={(e) => setFontSortBy(e.target.value as any)}
                                    className="bg-transparent border-none py-1.5 px-2 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                                >
                                    <option value="id">Número #</option>
                                    <option value="name">Nombre A-Z</option>
                                    <option value="category">Categoría</option>
                                </select>
                                <button 
                                    onClick={() => setFontSortOrder(fontSortOrder === 'asc' ? 'desc' : 'asc')}
                                    className={`p-1.5 rounded-lg transition-colors ${fontSortOrder === 'asc' ? 'bg-amber-500 text-black' : 'bg-zinc-400 text-white'}`}
                                    title={fontSortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                                >
                                    {fontSortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>}
                                </button>
                                {/* Botones de ordenamiento rápido */}
                                <div className="flex border-l border-zinc-400 ml-1 pl-1 gap-0.5">
                                    <button
                                        onClick={() => { setFontSortBy('name'); setFontSortOrder('asc'); }}
                                        className={`p-1 rounded text-[10px] font-bold ${fontSortBy === 'name' && fontSortOrder === 'asc' ? 'text-amber-500' : 'text-zinc-500'}`}
                                        title="Ordenar A-Z"
                                    >
                                        A→Z
                                    </button>
                                    <button
                                        onClick={() => { setFontSortBy('name'); setFontSortOrder('desc'); }}
                                        className={`p-1 rounded text-[10px] font-bold ${fontSortBy === 'name' && fontSortOrder === 'desc' ? 'text-amber-500' : 'text-zinc-500'}`}
                                        title="Ordenar Z-A"
                                    >
                                        Z→A
                                    </button>
                                    <button
                                        onClick={() => { setFontSortBy('id'); setFontSortOrder('asc'); }}
                                        className={`p-1 rounded text-[10px] font-bold ${fontSortBy === 'id' && fontSortOrder === 'asc' ? 'text-amber-500' : 'text-zinc-500'}`}
                                        title="Número menor a mayor"
                                    >
                                        #↑
                                    </button>
                                    <button
                                        onClick={() => { setFontSortBy('id'); setFontSortOrder('desc'); }}
                                        className={`p-1 rounded text-[10px] font-bold ${fontSortBy === 'id' && fontSortOrder === 'desc' ? 'text-amber-500' : 'text-zinc-500'}`}
                                        title="Número mayor a menor"
                                    >
                                        #↓
                                    </button>
                                </div>
                            </div>
                            
                            {/* Vista toggle */}
                            <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-xl p-1">
                                {[
                                    { mode: 'GRID', icon: LayoutGrid },
                                    { mode: 'LIST', icon: List },
                                    { mode: 'COMPACT', icon: AlignLeft }
                                ].map(({ mode, icon: Icon }) => (
                                    <button 
                                        key={mode}
                                        onClick={() => setFontViewMode(mode as any)}
                                        className={`p-2 rounded-lg transition-all ${fontViewMode === mode ? 'bg-white dark:bg-zinc-700 text-amber-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                        title={mode}
                                    >
                                        <Icon size={14}/>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview Input */}
                    <div className="relative">
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/>
                        <input 
                            value={fontPreviewText}
                            onChange={(e) => setFontPreviewText(e.target.value)}
                            placeholder="Escribe aquí para probar tus fuentes..."
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 py-4 pl-12 pr-4 rounded-xl text-lg font-medium text-zinc-900 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        />
                    </div>
                    
                    {/* Vista de fonts según el modo seleccionado */}
                    {fontViewMode === 'GRID' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredFonts.map(font => (
                                <div
                                    key={font.id}
                                    className={`bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-700/40 rounded-2xl overflow-hidden flex flex-col cursor-pointer group hover:border-amber-500 hover:shadow-lg transition-all ${font.active === false ? 'opacity-40' : ''}`}
                                    onClick={() => { setEditingFont(font); setIsFontModalOpen(true); }}
                                >
                                    {/* Preview area */}
                                    <div className="flex-1 flex items-center justify-center px-6 pt-8 pb-6 min-h-[160px]">
                                        <span className={`${font.cssFamily} text-6xl md:text-7xl text-zinc-900 dark:text-white text-center leading-none select-none`}>
                                            {fontPreviewText || 'Aa'}
                                        </span>
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-zinc-200/40 dark:border-zinc-700/40 px-5 py-3 flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-amber-500 tabular-nums">#{font.id}</span>
                                                <p className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wide truncate">{font.name}</p>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">{font.category || 'BÁSICA'}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingFont(font); setIsFontModalOpen(true); }}
                                                className="p-2 rounded-lg text-zinc-400 hover:text-amber-500 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={15}/>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleFontActive(font); }}
                                                className={`p-2 rounded-lg transition-colors ${font.active === false ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200' : 'text-green-500 hover:text-green-600'}`}
                                                title={font.active === false ? 'Activar' : 'Desactivar'}
                                            >
                                                {font.active === false ? <EyeOff size={15}/> : <Eye size={15}/>}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar esta fuente?')) onDeleteFont(font.id); }}
                                                className="p-2 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {fontViewMode === 'LIST' && (
                        <div className="space-y-3">
                            {filteredFonts.map(font => (
                                <div
                                    key={font.id}
                                    className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 cursor-pointer group hover:border-amber-500 hover:shadow-md transition-all ${font.active === false ? 'opacity-40' : ''}`}
                                    onClick={() => { setEditingFont(font); setIsFontModalOpen(true); }}
                                >
                                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                                        <span className={`${font.cssFamily} text-4xl text-zinc-900 dark:text-white`}>
                                            {fontPreviewText ? fontPreviewText.charAt(0) : 'A'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-black text-amber-500 tabular-nums">#{font.id}</span>
                                            <p className="font-bold text-sm text-zinc-900 dark:text-white uppercase truncate">{font.name}</p>
                                        </div>
                                        <p className="text-xs text-zinc-500 uppercase">{font.category || 'BÁSICA'}</p>
                                        <p className={`${font.cssFamily} text-lg text-zinc-700 dark:text-zinc-300 mt-1 truncate`}>
                                            {fontPreviewText || ' preview text'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingFont(font); setIsFontModalOpen(true); }}
                                            className="p-2 rounded-lg text-zinc-400 hover:text-amber-500 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={18}/>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFontActive(font); }}
                                            className={`p-2 rounded-lg transition-colors ${font.active === false ? 'text-zinc-400 hover:text-zinc-600' : 'text-green-500 hover:text-green-600'}`}
                                            title={font.active === false ? 'Activar' : 'Desactivar'}
                                        >
                                            {font.active === false ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar esta fuente?')) onDeleteFont(font.id); }}
                                            className="p-2 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {fontViewMode === 'COMPACT' && (
                        <div className="space-y-1">
                            {/* Encabezados */}
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase">
                                <div className="col-span-2">#</div>
                                <div className="col-span-4">Nombre</div>
                                <div className="col-span-3">Categoría</div>
                                <div className="col-span-2 text-center">Estado</div>
                                <div className="col-span-1"></div>
                            </div>
                            {filteredFonts.map(font => (
                                <div
                                    key={font.id}
                                    className={`grid grid-cols-12 gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg items-center cursor-pointer group hover:border-amber-500 transition-all ${font.active === false ? 'opacity-40' : ''}`}
                                    onClick={() => { setEditingFont(font); setIsFontModalOpen(true); }}
                                >
                                    <div className="col-span-2">
                                        <span className="text-sm font-black text-amber-500 tabular-nums">#{font.id}</span>
                                    </div>
                                    <div className="col-span-4">
                                        <p className="font-bold text-xs text-zinc-900 dark:text-white uppercase truncate">{font.name}</p>
                                    </div>
                                    <div className="col-span-3">
                                        <span className="text-[10px] text-zinc-500 uppercase">{font.category || 'BÁSICA'}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${font.active !== false ? 'badge-success' : 'bg-zinc-100 text-zinc-500'}`}>
                                            {font.active !== false ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                    <div className="col-span-1 flex justify-end gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingFont(font); setIsFontModalOpen(true); }}
                                            className="p-1.5 rounded text-zinc-400 hover:text-amber-500 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={14}/>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFontActive(font); }}
                                            className={`p-1.5 rounded transition-colors ${font.active === false ? 'text-zinc-400 hover:text-zinc-600' : 'text-green-500 hover:text-green-600'}`}
                                            title={font.active === false ? 'Activar' : 'Desactivar'}
                                        >
                                            {font.active === false ? <EyeOff size={14}/> : <Eye size={14}/>}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar esta fuente?')) onDeleteFont(font.id); }}
                                            className="p-1.5 rounded text-zinc-400 hover:text-red-500 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredFonts.length === 0 && (
                        <div className="text-center py-12">
                            <Type size={48} className="mx-auto text-zinc-300 mb-4"/>
                            <p className="text-zinc-500 font-medium">No hay fuentes en esta categoría</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'CLIENTS' && (
                <div className="flex flex-col md:flex-row gap-6 h-full">
                    {/* CLIENT LIST */}
                    <div className={`flex flex-col gap-4 overflow-y-auto pr-2 pb-12 ${selectedClient ? 'hidden md:flex md:w-[320px] shrink-0' : 'w-full md:w-[400px]'}`}>
                        {/* Header Compacto */}
                        <div className="flex items-center justify-between pb-2">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Clientes</h3>
                                <p className="text-xs text-zinc-500">{filteredClients.length} clientes</p>
                            </div>
                        </div>
                        
                        {/* SEARCH */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
                            <input 
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none focus:border-amber-500 dark:text-white placeholder:text-zinc-400"
                                placeholder="Buscar cliente..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    <X size={14}/>
                                </button>
                            )}
                        </div>
                        
                        {/* CLIENT LIST */}
                        <div className="space-y-2">
                            {filteredClients.map((client, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setSelectedClient(client)} 
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedClient?.phone === client.phone ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-black text-zinc-600 dark:text-zinc-300">
                                            {client.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white uppercase truncate">{client.name}</h4>
                                            <p className="text-xs text-zinc-500 font-mono">{client.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-amber-500">{formatCurrency(client.totalSpent)}</span>
                                            <p className="text-[10px] text-zinc-400">{client.totalOrders} pedidos</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {filteredClients.length === 0 && (
                            <div className="text-center py-12 text-zinc-400">
                                <Users size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-xs">No se encontraron clientes</p>
                            </div>
                        )}
                    </div>
                    {/* CLIENT DETAIL - Always visible */}
                    <div className="flex-1 h-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 overflow-y-auto relative">
                        {selectedClient ? (
                            <>
                                <button onClick={() => setSelectedClient(null)} className="md:hidden absolute top-4 right-4 p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg"><X size={18}/></button>
                                
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xl font-black text-zinc-600 dark:text-zinc-300">
                                        {selectedClient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white uppercase">{selectedClient.name}</h2>
                                        <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                                            <span className="flex items-center gap-1"><Phone size={12}/> {selectedClient.phone}</span>
                                            <span className="flex items-center gap-1"><Mail size={12}/> {selectedClient.email}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                                        <span className="text-[10px] font-bold uppercase text-zinc-400">Total</span>
                                        <p className="text-lg font-black text-amber-500 mt-1">{formatCurrency(selectedClient.totalSpent)}</p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                                        <span className="text-[10px] font-bold uppercase text-zinc-400">Pedidos</span>
                                        <p className="text-lg font-black text-zinc-900 dark:text-white mt-1">{selectedClient.totalOrders}</p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                                        <span className="text-[10px] font-bold uppercase text-zinc-400">Última</span>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{formatDateSimple(selectedClient.lastOrderDate)}</p>
                                    </div>
                                    <div className="bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-500/30 text-center">
                                        <span className="text-[10px] font-bold uppercase text-amber-500">Points</span>
                                        <p className="text-lg font-black text-amber-500 mt-1">{selectedClient.currentPoints}</p>
                                    </div>
                                </div>
                                
                                {/* Coupons */}
                                <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6">
                                    <h4 className="text-xs font-bold uppercase mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Ticket size={14}/> Cupón Personal
                                    </h4>
                                    <div className="flex gap-3 items-end mb-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Código</label>
                                            <input 
                                                value={clientCouponData.code} 
                                                onChange={e => setClientCouponData({...clientCouponData, code: e.target.value.toUpperCase()})}
                                                placeholder={`${selectedClient.name.split(' ')[0].toUpperCase()}VIP`}
                                                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg text-xs font-bold uppercase outline-none focus:border-amber-500 dark:text-white"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">% Desc.</label>
                                            <input 
                                                type="number"
                                                value={clientCouponData.discount} 
                                                onChange={e => setClientCouponData({...clientCouponData, discount: Number(e.target.value)})}
                                                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-amber-500 dark:text-white"
                                            />
                                        </div>
                                        <button onClick={createClientCoupon} className="bg-amber-500 hover:bg-amber-600 text-zinc-900 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 transition-colors">
                                            <Plus size={14}/> Crear
                                        </button>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        {(storeConfig.coupons || [])
                                            .filter(c => c.assignedToPhone === selectedClient.phone)
                                            .length === 0 ? (
                                                <p className="text-xs text-zinc-400 py-3 text-center">Sin cupones asignados</p>
                                            ) : (
                                                (storeConfig.coupons || [])
                                                .filter(c => c.assignedToPhone === selectedClient.phone)
                                                .map(c => (
                                                    <div key={c.code} className="flex justify-between items-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Ticket size={14} className="text-amber-500"/>
                                                            <div>
                                                                <span className="block font-bold text-sm text-zinc-900 dark:text-white">{c.code}</span>
                                                                <span className="text-[10px] text-zinc-500">{c.discountPercent}% OFF • {c.usedCount} usos</span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => onUpdateStoreConfig({...storeConfig, coupons: storeConfig.coupons.filter(x => x.code !== c.code)})}
                                                            className="text-zinc-400 hover:text-red-500 p-1.5"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </div>
                                                ))
                                            )
                                        }
                                    </div>
                                </div>
                                
                                {/* Order History */}
                                <h4 className="text-xs font-bold uppercase mb-3 text-zinc-400">Historial</h4>
                                <div className="space-y-2">
                                    {selectedClient.orders.map((o: Order) => (
                                        <div key={o.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                            <div>
                                                <span className="font-bold text-sm text-zinc-900 dark:text-white block">#{o.id}</span>
                                                <span className="text-[10px] text-zinc-400">{formatDate(o.createdAt)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-bold text-sm text-zinc-900 dark:text-white">{formatCurrency(o.total)}</span>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeColor(o.status)}`}>{o.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Danger Zone */}
                                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    <button onClick={() => onDeleteClient(selectedClient.phone)} className="text-red-500 hover:text-red-600 text-[10px] font-bold uppercase flex items-center gap-1"><Trash2 size={12}/> Borrar cliente</button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                <Users size={32} className="mb-3 opacity-30"/>
                                <p className="text-xs">Selecciona un cliente</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'GALERIA' && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase">Galería de Imágenes</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                Administra logos, íconos e ilustraciones que luego usarás en el personalizador.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {['LOGO', 'ICON', 'ILUSTRACION', 'FORMS', 'CLIPART', 'OTHER'].map(cat => (
                                <label 
                                    key={cat} 
                                    className="bg-zinc-100 dark:bg-zinc-800 hover:bg-system-accent/90 hover:text-zinc-900 dark:hover:bg-system-accent dark:hover:text-zinc-900 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1.5 transition-colors border border-zinc-200 dark:border-zinc-700"
                                >
                                    <Upload size={12}/> {cat}
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="image/*" 
                                        onChange={(e) => handleGalleryUpload(e, cat)}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Filtros y búsqueda */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <input
                                type="text"
                                value={gallerySearch}
                                onChange={(e) => setGallerySearch(e.target.value)}
                                placeholder="Buscar por nombre de imagen..."
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 pl-9 pr-3 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                        </div>

                        {/* Category Filters */}
                        <div className="flex flex-wrap gap-2">
                            {(['TODAS', 'LOGO', 'ICON', 'ILUSTRACION', 'FORMS', 'CLIPART', 'OTHER'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setGalleryCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                        galleryCategory === cat
                                            ? 'bg-system-accent text-zinc-900 shadow-md'
                                            : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-system-accent hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    {cat === 'TODAS' ? 'Todas' : cat}
                                </button>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            <span>
                                {(storeConfig.galleryAssets || []).length} imágenes •{' '}
                                {galleryCategory === 'TODAS' 
                                    ? 'Todas las categorías' 
                                    : (storeConfig.galleryAssets || []).filter(a => a.type === galleryCategory).length + ` en ${galleryCategory}`}
                            </span>
                            {gallerySearch && (
                                <button onClick={() => setGallerySearch('')} className="text-amber-500 hover:text-yellow-600">
                                    Limpiar búsqueda
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {(
                                (storeConfig.galleryAssets || [])
                                    .filter(a => galleryCategory === 'TODAS' || a.type === galleryCategory)
                                    .filter(a => !gallerySearch || a.name.toLowerCase().includes(gallerySearch.toLowerCase()))
                            ).length > 0 ? (
                                (storeConfig.galleryAssets || [])
                                    .filter(a => galleryCategory === 'TODAS' || a.type === galleryCategory)
                                    .filter(a => !gallerySearch || a.name.toLowerCase().includes(gallerySearch.toLowerCase()))
                                    .map(asset => (
                                        <div 
                                            key={asset.id} 
                                            className="group relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-amber-500 hover:shadow-md transition-all"
                                        >
                                            <div className="aspect-square p-3 flex items-center justify-center">
                                                <img src={asset.url} alt={asset.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                                            </div>
                                            {/* Info Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-2">
                                                <p className="text-[9px] font-bold text-white truncate">{asset.name}</p>
                                                <select
                                                    value={asset.type}
                                                    onChange={(e) => {
                                                        const newType = e.target.value as 'LOGO' | 'ICON' | 'ILUSTRACION' | 'FORMS' | 'CLIPART' | 'OTHER';
                                                        onUpdateStoreConfig({
                                                            ...storeConfig,
                                                            galleryAssets: storeConfig.galleryAssets?.map(a => 
                                                                a.id === asset.id ? { ...a, type: newType } : a
                                                            )
                                                        });
                                                    }}
                                                    className="w-full mt-1 text-[8px] font-bold uppercase bg-black/50 text-white rounded px-1 py-0.5 cursor-pointer"
                                                >
                                                    <option value="LOGO">LOGO</option>
                                                    <option value="ICON">ICON</option>
                                                    <option value="ILUSTRACION">ILUSTRACION</option>
                                                    <option value="FORMS">FORMS</option>
                                                    <option value="CLIPART">CLIPART</option>
                                                    <option value="OTHER">OTHER</option>
                                                </select>
                                            </div>
                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => onUpdateStoreConfig({...storeConfig, galleryAssets: storeConfig.galleryAssets?.filter(a => a.id !== asset.id)})}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                title="Eliminar imagen"
                                            >
                                                <X size={12}/>
                                            </button>
                                            {/* Crop Button */}
                                            <button 
                                                onClick={() => {
                                                    setImageToCrop(asset.url);
                                                    setCroppingTarget(asset.id);
                                                }} 
                                                className="absolute top-2 left-2 bg-system-info text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-color-info-600"
                                                title="Recortar imagen"
                                            >
                                                <Crop size={12}/>
                                            </button>
                                        </div>
                                    ))
                            ) : (
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/30">
                                    <ImageIcon size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
                                        {gallerySearch ? 'No se encontraron imágenes' : 'No hay imágenes en esta categoría aún'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'CONTENT' && (
                <ContentManager 
                    config={contentConfig}
                    onSave={(config) => {
                        setContentConfig(config);
                        localStorage.setItem('lm_content_config', JSON.stringify(config));
                        window.dispatchEvent(new Event('lm-content-config-updated'));
                        alert('Contenido guardado correctamente');
                    }}
                />
            )}

            {activeTab === 'EMPRESAS' && (
                <BusinessManager
                  accounts={businessAccounts}
                  onUpdateAccounts={setBusinessAccounts}
                />
            )}

            {activeTab === 'SETTINGS' && (
                <div>
                    <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800">
                        {['BRANDING', 'COLORS', 'MESSAGES', 'FINANCE', 'COUPONS', 'INVENTORY_CATS', 'SYSTEM', 'ASSISTANT'].map(t => (
                            <button key={t} onClick={() => setSettingsTab(t as any)} className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 ${settingsTab === t ? 'border-amber-500 text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500'}`}>{t}</button>
                        ))}
                    </div>
                    {settingsTab === 'ASSISTANT' && (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <Sparkles className="text-amber-500" /> Configuración de RAB
                            </h3>
                            
                            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6">
                                <h4 className="text-sm font-bold uppercase text-zinc-500 tracking-widest mb-6">Atajos de Teclado</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Zap size={16}/></div>
                                            <div>
                                                <p className="font-bold text-sm text-zinc-900 dark:text-white">Abrir Spotlight</p>
                                                <p className="text-xs text-zinc-500">Activa el asistente desde cualquier pantalla</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-500">⌘</kbd>
                                            <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-500">K</kbd>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 rounded-lg"><X size={16}/></div>
                                            <div>
                                                <p className="font-bold text-sm text-zinc-900 dark:text-white">Cerrar</p>
                                                <p className="text-xs text-zinc-500">Salir del asistente sin ejecutar</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-500">ESC</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6">
                                <h4 className="text-sm font-bold uppercase text-zinc-500 tracking-widest mb-6">Preferencias AI</h4>
                                <div className="space-y-4">
                                     <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm text-zinc-900 dark:text-white">Modelo de Lenguaje</p>
                                            <p className="text-xs text-zinc-500">Selecciona la inteligencia detrás de RAB</p>
                                        </div>
                                        <select className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold uppercase p-2 outline-none">
                                            <option>Llama 3 70B (Rápido)</option>
                                            <option>Mixtral 8x7B</option>
                                            <option>Gemma 7B</option>
                                        </select>
                                     </div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-4 items-start">
                                <Sparkles className="text-amber-500 shrink-0 mt-1" size={20}/>
                                <div>
                                    <p className="font-bold text-sm text-amber-600 dark:text-amber-500 mb-1">Tips Pro</p>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        RAB aprende de tus comandos. Intenta ser específico con nombres y fechas para obtener mejores resultados.
                                        Puedes ver tu historial reciente directamente en la ventana de comandos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {settingsTab === 'SYSTEM' && (
                        <div className="space-y-10 max-w-4xl">
                            <div className="bg-gradient-to-br from-color-info-900 to-black p-8 rounded-3xl border border-color-info-800 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-color-info-500/20 rounded-full blur-[80px]"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-4 bg-color-info-600 rounded-2xl text-white shadow-lg shadow-info">
                                            <UploadCloud size={32}/>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white uppercase">Migración a la Nube</h3>
                                            <p className="text-blue-200 text-xs font-medium">Sincroniza tus datos locales (LocalStorage) con Firebase Real.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                            <span className="block text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Productos</span>
                                            <span className="text-2xl font-mono text-white">{products.length}</span>
                                        </div>
                                        <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                            <span className="block text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Fuentes</span>
                                            <span className="text-2xl font-mono text-white">{fonts.length}</span>
                                        </div>
                                        <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                            <span className="block text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Órdenes</span>
                                            <span className="text-2xl font-mono text-white">{orders.length}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={handleDownloadBackup} className="flex-1 py-5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                                            <FileJson size={20}/> Descargar Backup JSON
                                        </button>
                                        <button onClick={handleCloudMigration} disabled={isMigrating} className="flex-[2] py-5 bg-color-info-50 dark:bg-color-info-900/30 text-color-info-900 dark:text-color-info-200 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-color-info-50 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 disabled:cursor-wait">
                                            {isMigrating ? (<><RefreshCw className="animate-spin" size={20}/> Procesando Lotes...</>) : (<><Database size={20}/> Iniciar Sincronización Total</>)}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Background / System Settings */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                                <h4 className="text-lg font-bold text-zinc-900 dark:text-white uppercase mb-4">Fondo del Sistema</h4>
                                <BackgroundSettings />
                            </div>
                            <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/10 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
                                    <AlertOctagon size={24}/>
                                    <h4 className="font-bold uppercase text-sm">Zona de Peligro Local</h4>
                                </div>
                                <div className="space-y-3">
                                    <button onClick={() => { if(confirm("¿Seguro?")) onResetOrdersAndClients(); }} className="w-full py-4 bg-transparent border-2 border-red-500 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Trash2 size={16}/> Limpiar Datos Locales
                                    </button>
                                    <button onClick={() => { if(confirm("Esto reemplazará todos los productos con los valores por defecto. ¿Continuar?")) onResetProducts?.(); }} className="w-full py-4 bg-transparent border-2 border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-100 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                        <RefreshCw size={16}/> Resetear Productos a Default
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {settingsTab === 'BRANDING' && (
                        <div className="space-y-8">
                            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-start">
                                {/* Columna izquierda: Formulario de Brand Studio */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Sparkles size={14} className="text-amber-500" />
                                            Brand Studio · Identidad Visual
                                        </p>
                                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                            Configura la cara de tu marca
                                        </h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            Define logo, nombre comercial, colores y fondo para que todo el sistema se sienta coherente.
                                        </p>
                                    </div>

                                    {/* Identidad básica */}
                                    <div className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                            Identidad básica
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                                                    Nombre del Negocio
                                                </label>
                                                <input
                                                    type="text"
                                                    value={storeConfig.businessName || ''}
                                                    onChange={e =>
                                                        onUpdateStoreConfig({
                                                            ...storeConfig,
                                                            businessName: e.target.value
                                                        })
                                                    }
                                                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500"
                                                    placeholder="Ej. BLACKFLAG LASER STUDIO"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                                                    Slogan
                                                </label>
                                                <input
                                                    type="text"
                                                    value={storeConfig.slogan || ''}
                                                    onChange={e =>
                                                        onUpdateStoreConfig({
                                                            ...storeConfig,
                                                            slogan: e.target.value
                                                        })
                                                    }
                                                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500"
                                                    placeholder="Ej. Personalizamos tu mundo, un tumbler a la vez."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logo y assets principales */}
                                    <div className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                            Logo y assets principales
                                        </h4>

                                        {/* Logo principal */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold uppercase text-zinc-500">
                                                Logo principal
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 bg-zinc-200/40 dark:bg-zinc-800/60 rounded-2xl flex items-center justify-center overflow-hidden border border-dashed border-zinc-300/70 dark:border-zinc-700/80">
                                                    {storeConfig.logoUrl ? (
                                                        <img
                                                            src={storeConfig.logoUrl}
                                                            className="w-full h-full object-contain p-2"
                                                            alt="Logo principal"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="text-zinc-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => logoInputRef.current?.click()}
                                                        disabled={uploadingAsset === 'LOGO'}
                                                        className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 transition-all duration-200 ${uploadingAsset === 'LOGO' ? 'opacity-60 cursor-wait' : ''}`}
                                                    >
                                                        <Upload size={14} className="mr-2" />
                                                        {uploadingAsset === 'LOGO' ? 'Subiendo...' : 'Subir logo'}
                                                    </button>
                                                    {storeConfig.logoUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onUpdateStoreConfig({
                                                                    ...storeConfig,
                                                                    logoUrl: '',
                                                                    brandingAssets: (storeConfig.brandingAssets || []).filter(
                                                                        a => !(a.type === 'LOGO' && a.url === storeConfig.logoUrl)
                                                                    )
                                                                })
                                                            }
                                                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
                                                        >
                                                            <Trash2 size={14} className="mr-2" />
                                                            Quitar
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={logoInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                />
                                            </div>
                                        </div>

                                        {/* Favicon */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold uppercase text-zinc-500">
                                                Favicon (icono de pestaña)
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-zinc-200/40 dark:bg-zinc-800/60 rounded-xl flex items-center justify-center overflow-hidden border border-dashed border-zinc-300/70 dark:border-zinc-700/80">
                                                    {storeConfig.faviconUrl ? (
                                                        <img
                                                            src={storeConfig.faviconUrl}
                                                            className="w-full h-full object-contain p-1"
                                                            alt="Favicon"
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] font-semibold uppercase text-zinc-500">
                                                            32×32
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => faviconInputRef.current?.click()}
                                                        disabled={uploadingAsset === 'FAVICON'}
                                                        className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 transition-all duration-200 ${uploadingAsset === 'FAVICON' ? 'opacity-60 cursor-wait' : ''}`}
                                                    >
                                                        <Upload size={14} className="mr-2" />
                                                        {uploadingAsset === 'FAVICON' ? 'Subiendo...' : storeConfig.faviconUrl ? 'Reemplazar' : 'Subir favicon'}
                                                    </button>
                                                    {storeConfig.faviconUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onUpdateStoreConfig({
                                                                    ...storeConfig,
                                                                    faviconUrl: '',
                                                                    brandingAssets: (storeConfig.brandingAssets || []).filter(
                                                                        a => !(a.type === 'ICON' && a.url === storeConfig.faviconUrl)
                                                                    )
                                                                })
                                                            }
                                                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
                                                        >
                                                            <Trash2 size={14} className="mr-2" />
                                                            Quitar
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={faviconInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFaviconUpload}
                                                />
                                            </div>
                                        </div>

                                        {/* Banner principal */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold uppercase text-zinc-500">
                                                Banner principal (hero)
                                            </label>
                                            <div className="space-y-2">
                                                <div className="w-full h-24 md:h-28 bg-zinc-200/40 dark:bg-zinc-800/60 rounded-2xl flex items-center justify-center overflow-hidden border border-dashed border-zinc-300/70 dark:border-zinc-700/80">
                                                    {storeConfig.bannerUrl ? (
                                                        <img
                                                            src={storeConfig.bannerUrl}
                                                            className="w-full h-full object-cover"
                                                            alt="Banner principal"
                                                        />
                                                    ) : (
                                                        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                                                            16:9 · Imagen para hero / landing
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => bannerInputRef.current?.click()}
                                                        disabled={uploadingAsset === 'BANNER'}
                                                        className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 transition-all duration-200 ${uploadingAsset === 'BANNER' ? 'opacity-60 cursor-wait' : ''}`}
                                                    >
                                                        <Upload size={14} className="mr-2" />
                                                        {uploadingAsset === 'BANNER'
                                                            ? 'Subiendo...'
                                                            : storeConfig.bannerUrl
                                                            ? 'Reemplazar banner'
                                                            : 'Subir banner'}
                                                    </button>
                                                    {storeConfig.bannerUrl && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => window.open(storeConfig.bannerUrl, '_blank')}
                                                                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-zinc-300/80 dark:border-zinc-700 text-zinc-100 bg-white/5 hover:bg-white/10 dark:hover:bg-zinc-800/80 transition-all duration-200"
                                                            >
                                                                <Eye size={14} className="mr-2" />
                                                                Ver grande
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onUpdateStoreConfig({
                                                                        ...storeConfig,
                                                                        bannerUrl: '',
                                                                        brandingAssets: (storeConfig.brandingAssets || []).filter(
                                                                            a => !(a.type === 'ILUSTRACION' && a.url === storeConfig.bannerUrl)
                                                                        )
                                                                    })
                                                                }
                                                                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
                                                            >
                                                                <Trash2 size={14} className="mr-2" />
                                                                Quitar
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={bannerInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleBannerUpload}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Colores y fondo de marca */}
                                    <div className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                            Colores y fondo de marca
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase text-zinc-500">
                                                    Color de acento
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={storeConfig.accentColor || '#f59e0b'}
                                                        onChange={e =>
                                                            onUpdateStoreConfig({
                                                                ...storeConfig,
                                                                accentColor: e.target.value
                                                            })
                                                        }
                                                        className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={storeConfig.accentColor || '#f59e0b'}
                                                        onChange={e =>
                                                            onUpdateStoreConfig({
                                                                ...storeConfig,
                                                                accentColor: e.target.value
                                                            })
                                                        }
                                                        className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-xs font-mono"
                                                    />
                                                </div>
                                                <p className="text-[11px] text-zinc-500">
                                                    Se usa en botones principales, resaltes y elementos interactivos.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase text-zinc-500">
                                                    Fondo oscuro de marca
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={storeConfig.themeDarkModeBg || '#030712'}
                                                        onChange={e =>
                                                            onUpdateStoreConfig({
                                                                ...storeConfig,
                                                                themeDarkModeBg: e.target.value
                                                            })
                                                        }
                                                        className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={storeConfig.themeDarkModeBg || '#030712'}
                                                        onChange={e =>
                                                            onUpdateStoreConfig({
                                                                ...storeConfig,
                                                                themeDarkModeBg: e.target.value
                                                            })
                                                        }
                                                        className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-xs font-mono"
                                                    />
                                                </div>
                                                <p className="text-[11px] text-zinc-500">
                                                    Ideal para el header o fondos hero en modo oscuro.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tipografía de marca */}
                                        <div className="mt-4 space-y-2">
                                            <label className="block text-xs font-bold uppercase text-zinc-500">
                                                Fuente de marca (logotipo)
                                            </label>
                                            <select
                                                value={storeConfig.logoFont || ''}
                                                onChange={e =>
                                                    onUpdateStoreConfig({
                                                        ...storeConfig,
                                                        logoFont: e.target.value || undefined
                                                    })
                                                }
                                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-100"
                                            >
                                                <option value="">Usar sistema por defecto</option>
                                                {fonts
                                                    .slice()
                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                    .map(font => (
                                                        <option key={font.id} value={font.cssFamily}>
                                                            {font.name}
                                                            {font.category ? ` · ${font.category}` : ''}
                                                        </option>
                                                    ))}
                                            </select>
                                            <p
                                                className={`text-sm mt-1 text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-tight ${storeConfig.logoFont || ''}`}
                                            >
                                                {storeConfig.businessName || 'Vista previa tipografía de marca'}
                                            </p>
                                            <p className="text-[11px] text-zinc-500">
                                                Esta fuente se usa en el logo de la barra de navegación y en el personalizador.
                                            </p>
                                        </div>

                                        {/* Patrón y presets de fondo (sólo afectan al preview y estilo general) */}
                                        <div className="space-y-3 pt-2">
                                            <label className="block text-xs font-bold uppercase text-zinc-500">
                                                Patrón de fondo del sistema
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {(['none', 'dots', 'grid', 'lines'] as const).map(pattern => (
                                                    <button
                                                        key={pattern}
                                                        type="button"
                                                        onClick={() =>
                                                            onUpdateStoreConfig({
                                                                ...storeConfig,
                                                                bgPattern: pattern
                                                            })
                                                        }
                                                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest border ${
                                                            storeConfig.bgPattern === pattern
                                                                ? 'bg-amber-500 text-white border-amber-500'
                                                                : 'bg-zinc-100 dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                                                        }`}
                                                    >
                                                        {pattern === 'none'
                                                            ? 'Sin patrón'
                                                            : pattern === 'dots'
                                                            ? 'Puntos'
                                                            : pattern === 'grid'
                                                            ? 'Grid'
                                                            : 'Líneas'}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="space-y-2 pt-3">
                                                <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                                                    Presets rápidos
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onUpdateStoreConfig({
                                                                ...storeConfig,
                                                                accentColor: '#f59e0b',
                                                                themeDarkModeBg: '#111827',
                                                                bgPattern: 'dots'
                                                            })
                                                        }
                                                        className="px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest border border-amber-300/70 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all duration-200"
                                                    >
                                                        Glass dorado
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onUpdateStoreConfig({
                                                                ...storeConfig,
                                                                accentColor: '#111827',
                                                                themeDarkModeBg: '#f9fafb',
                                                                bgPattern: 'none'
                                                            })
                                                        }
                                                        className="px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 transition-all duration-200"
                                                    >
                                                        Claro neutro
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna derecha: Brand Card Preview */}
                                <div className="w-full">
                                    <div className="bg-zinc-950 rounded-3xl p-1.5">
                                        <div
                                            className="relative rounded-2xl overflow-hidden p-6 md:p-8 min-h-[260px] flex flex-col justify-between"
                                            style={{
                                                background:
                                                    storeConfig.themeDarkModeBg ||
                                                    'radial-gradient(circle at top, #fbbf24 0, #111827 55%)'
                                            }}
                                        >
                                            {/* Patrón visual según bgPattern */}
                                            <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light">
                                                {storeConfig.bgPattern === 'dots' && (
                                                    <div className="w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08)_1px,_transparent_0)] bg-[length:18px_18px]" />
                                                )}
                                                {storeConfig.bgPattern === 'grid' && (
                                                    <div className="w-full h-full bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:26px_26px]" />
                                                )}
                                                {storeConfig.bgPattern === 'lines' && (
                                                    <div className="w-full h-full bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_8px)]" />
                                                )}
                                            </div>

                                            <div className="relative z-10 flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                                                        {storeConfig.logoUrl ? (
                                                            <img
                                                                src={storeConfig.logoUrl}
                                                                alt="Logo preview"
                                                                className="w-full h-full object-contain p-1.5"
                                                            />
                                                        ) : (
                                                            <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                                                                LOGO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-[0.25em] text-amber-300/80 font-semibold">
                                                            Vista previa de marca
                                                        </p>
                                                        <p className="text-xs text-white/60">
                                                            Así se verá tu branding en la app.
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center rounded-full bg-black/40 border border-white/10 px-3 py-1 text-[10px] font-semibold tracking-widest uppercase text-white/70">
                                                    ADMIN BRANDING
                                                </span>
                                            </div>

                                            <div className="relative z-10 space-y-4 mt-6">
                                                <div>
                                                    <h4 className={`text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white ${storeConfig.logoFont || ''}`}>
                                                        {storeConfig.businessName || 'Tu marca láser premium'}
                                                    </h4>
                                                    <p className="text-sm text-white/70 mt-1 max-w-md">
                                                        {storeConfig.slogan ||
                                                            'Crea experiencias memorables con productos personalizados de alto impacto.'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center justify-center px-4 md:px-5 py-2.5 rounded-full text-xs md:text-[11px] font-semibold uppercase tracking-[0.22em] shadow-accent-md"
                                                        style={{
                                                            backgroundColor: storeConfig.accentColor || '#f59e0b',
                                                            color: '#111827'
                                                        }}
                                                    >
                                                        Ver catálogo
                                                        <ArrowUpRight size={14} className="ml-2" />
                                                    </button>
                                                    <span className="text-[11px] text-white/60 flex items-center gap-1.5">
                                                        <Sparkles size={13} className="text-amber-300" />
                                                        Personalizador, lealtad y WhatsApp integrados.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {settingsTab === 'COLORS' && (
                        <div className="space-y-6">
                            <h4 className="text-xl font-bold text-zinc-900 dark:text-white uppercase mb-4">Catálogo de Colores</h4>
                            <div className="flex gap-4 items-end bg-zinc-200/20 dark:bg-zinc-800/30 p-4 rounded-xl">
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-zinc-500">Nombre Color</label>
                                    <input value={newColorPreset.name} onChange={e => setNewColorPreset({...newColorPreset, name: e.target.value.toUpperCase()})} className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm font-bold uppercase" placeholder="EJ. DORADO"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-zinc-500">Hex</label>
                                    <input type="color" value={newColorPreset.hex} onChange={e => setNewColorPreset({...newColorPreset, hex: e.target.value})} className="h-11 w-20 cursor-pointer block rounded-lg"/>
                                </div>
                                <button onClick={handleAddGlobalColor} className="bg-amber-500 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase hover:bg-amber-500/80">Agregar</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {storeConfig.globalColors.map(c => (
                                    <div key={c.name} className="flex items-center justify-between p-3 border border-zinc-200/40 dark:border-zinc-700/40 rounded-xl bg-white/50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full border border-zinc-200/40 dark:border-zinc-700/40 shadow-sm" style={{backgroundColor: c.hex}}></div>
                                            <span className="font-bold text-xs">{c.name}</span>
                                        </div>
                                        <button onClick={() => handleDeleteGlobalColor(c.name)} className="text-zinc-500 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {settingsTab === 'MESSAGES' && (
                        <div className="space-y-6 max-w-2xl">
                            <h4 className="text-xl font-bold text-zinc-900 dark:text-white uppercase mb-4">Mensajes Predefinidos</h4>
                            {Object.entries(messages).map(([key, val]) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-2 tracking-widest">{key}</label>
                                    <textarea value={val} onChange={e => {const newMsgs = {...messages, [key]: e.target.value}; setMessages(newMsgs); onUpdateStoreConfig({...storeConfig, messageTemplates: newMsgs});}} className="w-full bg-zinc-200/20 dark:bg-zinc-800/30 border border-zinc-200/40 dark:border-zinc-700/40 p-4 rounded-xl text-sm h-32 focus:border-amber-500 outline-none"/>
                                    <p className="text-xs text-zinc-500 mt-1">Variables: {'{NOMBRE}, {ID}, {TOTAL}, {GUIA}'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {settingsTab === 'FINANCE' && (
                        <div className="space-y-6 max-w-xl">
                            <div className="p-6 bg-zinc-200/20 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/40">
                                <h4 className="text-sm font-bold uppercase mb-4 text-zinc-500">Configuración de Precios</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Precio Base Grabado</label>
                                        <input type="number" value={newPricing.baseEngravingPrice} onChange={e => { const p = {...newPricing, baseEngravingPrice: Number(e.target.value)}; setNewPricing(p); onUpdatePricing(p); }} className="w-32 p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-right font-mono font-bold"/>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Costo Lado Extra</label>
                                        <input type="number" value={newPricing.extraSidePrice} onChange={e => { const p = {...newPricing, extraSidePrice: Number(e.target.value)}; setNewPricing(p); onUpdatePricing(p); }} className="w-32 p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-right font-mono font-bold"/>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Costo por Logo</label>
                                        <input type="number" value={newPricing.logoSurcharge} onChange={e => { const p = {...newPricing, logoSurcharge: Number(e.target.value)}; setNewPricing(p); onUpdatePricing(p); }} className="w-32 p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-right font-mono font-bold"/>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl">
                                <h4 className="text-sm font-bold uppercase mb-4 text-amber-500">Programa de Lealtad (LaserPoints)</h4>
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Porcentaje de Cashback (%)</label>
                                    <input type="number" value={storeConfig.pointsPercentage || 5} onChange={e => onUpdateStoreConfig({...storeConfig, pointsPercentage: Number(e.target.value)})} className="w-32 p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-right font-mono font-bold"/>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">El cliente ganará este porcentaje del total de su compra en puntos.</p>
                            </div>
                            <div>
                                <div className="bg-zinc-200/20 dark:bg-zinc-800/30 p-6 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/40">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/40 dark:border-zinc-700/40">
                                            <Wallet size={20} className="text-zinc-500"/>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold uppercase text-zinc-900 dark:text-white">Datos Bancarios para el Cliente</h4>
                                            <p className="text-xs text-zinc-500">Esta información aparecerá al elegir "Transferencia"</p>
                                        </div>
                                    </div>
                                    <textarea value={bankInfo} onChange={e => { setBankInfo(e.target.value); onUpdateStoreConfig({...storeConfig, bankInfo: e.target.value}); }} className="w-full h-40 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 p-4 rounded-xl text-sm font-mono focus:border-amber-500 outline-none" placeholder="Ej: Banco: BBVA - Cuenta: 1234567890"/>
                                </div>
                            </div>
                        </div>
                    )}
                    {settingsTab === 'INVENTORY_CATS' && (
                        <div className="max-w-md space-y-6">
                            <div className="flex gap-2">
                                <input value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 bg-zinc-200/20 dark:bg-zinc-800/30 border border-zinc-200/40 dark:border-zinc-700/40 p-3 rounded-lg text-sm uppercase font-bold" placeholder="NUEVA CATEGORÍA"/>
                                <button onClick={() => { if(newCategory) { onUpdateStoreConfig({...storeConfig, productCategories: [...(storeConfig.productCategories || []), newCategory.toUpperCase()]}); setNewCategory(''); } }} className="bg-amber-500 text-white px-4 rounded-lg font-bold text-xs uppercase hover:bg-amber-500/80">Agregar</button>
                            </div>
                            <div className="space-y-2">
                                {(storeConfig.productCategories || []).map(cat => (
                                    <div key={cat} className="flex justify-between items-center p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                                        <span className="font-bold text-xs uppercase">{cat}</span>
                                        <button onClick={() => onUpdateStoreConfig({...storeConfig, productCategories: storeConfig.productCategories.filter(c => c !== cat)})} className="text-zinc-500 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {settingsTab === 'COUPONS' && (
                        <CouponManager 
                          coupons={storeConfig.coupons || []}
                          onUpdateStoreConfig={onUpdateStoreConfig}
                        />
                      )}
                </div>
            )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {[
            { id: 'DASHBOARD', icon: BarChart3, label: 'Home' },
            { id: 'PRODUCTION', icon: Zap, label: 'Grabado' },
            { id: 'ORDERS', icon: LayoutDashboard, label: 'Pedidos' },
            { id: 'INVENTORY', icon: Package, label: 'Stock' },
            { id: 'SETTINGS', icon: Settings, label: 'Más' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                activeTab === item.id 
                  ? 'text-amber-500' 
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile nav spacer - adds padding to prevent content being hidden */}
      <div className="md:hidden h-16" />
      
      {/* Modals */}
      <ProductFormModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} product={editingProduct} onSave={(prod: Product) => { if(editingProduct) onUpdateProduct(prod); else onAddProduct(prod); setIsProductModalOpen(false); }} presetColors={storeConfig.globalColors} categories={storeConfig.productCategories}/>
      <FontFormModal isOpen={isFontModalOpen} onClose={() => setIsFontModalOpen(false)} font={editingFont} onSave={(font: FontOption) => { console.log('FontFormModal onSave:', font); if (editingFont) { console.log('Calling onUpdateFont:', editingFont.id, font); onUpdateFont(editingFont.id, font); } else onAddFont(font); setIsFontModalOpen(false); }} existingFonts={fonts} />
      <BulkDistributorModal isOpen={isBulkDistributorOpen} onClose={() => setIsBulkDistributorOpen(false)} products={products} onApplyChanges={handleBulkUpdateProducts} globalColors={storeConfig.globalColors}/>
      <BulkFontModal isOpen={isBulkFontModalOpen} onClose={() => setIsBulkFontModalOpen(false)} onAddFonts={onAddFonts || ((fonts) => fonts.forEach(f => onAddFont(f)))} existingFonts={fonts}/>
      {/* Image Cropper for Gallery */}
      {imageToCrop && (
        <ImageCropper 
          imageSrc={imageToCrop} 
          onCropComplete={(croppedUrl) => {
            if (croppingTarget.startsWith('gal-')) {
              onUpdateStoreConfig({
                ...storeConfig,
                galleryAssets: storeConfig.galleryAssets?.map(a => 
                  a.id === croppingTarget ? { ...a, url: croppedUrl } : a
                )
              });
            }
            setImageToCrop(null);
          }} 
          onCancel={() => setImageToCrop(null)} 
          aspect={1}
        />
      )}
      {/* CommandAssistant lifted to App.tsx */}
    </div>
  );
};
export { AdminDashboard };

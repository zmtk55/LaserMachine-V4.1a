import React, { useState, useMemo } from 'react';
import { 
  Zap, Clock, CheckCircle2, AlertCircle, Package, 
  Play, Check, ArrowLeft, User, Calendar, MessageSquare,
  ChevronRight, Printer, MoreHorizontal
} from 'lucide-react';
import { Order, OrderStatus, OrderItem, Product, FontOption, ProductionItem, ProductionStatus } from '../types';

interface ProductionSectionProps {
  orders: Order[];
  products: Product[];
  fonts: FontOption[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
}

// Transform Order + OrderItem to ProductionItem
function orderToProductionItems(
  order: Order, 
  products: Product[], 
  fonts: FontOption[]
): ProductionItem[] {
  const getFontInfo = (fontId?: number) => {
    if (!fontId) return { name: 'Default', cssFamily: 'sans-serif' };
    const font = fonts.find(f => f.id === fontId);
    return {
      name: font?.name || 'Default',
      cssFamily: font?.cssFamily || 'sans-serif'
    };
  };

  return order.items.map((item, index) => {
    const product = products.find(p => p.id === item.productId);
    const color = product?.colors.find(c => c.name === item.colorName);
    const frontFont = getFontInfo(item.frontFontId);
    const backFont = getFontInfo(item.backFontId);
    
    // Determine production status based on order status
    let productionStatus: ProductionStatus = ProductionStatus.PENDING;
    if (order.status === OrderStatus.IN_PRODUCTION) {
      productionStatus = ProductionStatus.IN_PROGRESS;
    } else if (order.status === OrderStatus.READY || order.status === OrderStatus.COMPLETED) {
      productionStatus = ProductionStatus.COMPLETED;
    }
    
    return {
      orderId: order.id,
      orderItemId: item.id,
      sequenceNumber: index + 1,
      
      productName: product?.name || 'Producto desconocido',
      productBrand: product?.brand || 'OTHER' as any,
      colorName: item.colorName,
      colorHex: color?.hex || '#000000',
      productImageUrl: product?.imageUrl || '',
      
      frontText: item.frontText,
      frontText2: item.frontText2,
      frontFontId: item.frontFontId || 0,
      frontFontName: frontFont.name,
      frontFontCssFamily: frontFont.cssFamily,
      frontDesignState: item.frontDesignState,
      frontDesignState2: item.frontDesignState2,
      frontLogos: item.frontLogos || [],
      
      backText: item.backText,
      backText2: item.backText2,
      backFontId: item.backFontId,
      backFontName: backFont.name,
      backFontCssFamily: backFont.cssFamily,
      backDesignState: item.backDesignState,
      backDesignState2: item.backDesignState2,
      backLogos: item.backLogos || [],
      
      quantity: item.quantity,
      notes: item.notes,
      specialInstructions: order.internalNotes?.[0]?.text,
      
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      isPriority: order.isPriority,
      customerName: order.customerName,
      
      productionStatus,
      startedAt: order.history?.find(h => h.status === OrderStatus.IN_PRODUCTION)?.timestamp,
      completedAt: order.history?.find(h => h.status === OrderStatus.READY)?.timestamp,
      estimatedCompletionAt: order.estimatedDeliveryDate,
    };
  });
}

// Production Card Component
const ProductionCard: React.FC<{
  item: ProductionItem;
  onStart: () => void;
  onComplete: () => void;
  onViewDetail: () => void;
}> = ({ item, onStart, onComplete, onViewDetail }) => {
  const statusConfig = {
    [ProductionStatus.PENDING]: {
      color: 'bg-amber-500',
      text: 'Pendiente',
      icon: Clock
    },
    [ProductionStatus.IN_PROGRESS]: {
      color: 'bg-blue-500',
      text: 'En Proceso',
      icon: Play
    },
    [ProductionStatus.COMPLETED]: {
      color: 'bg-green-500',
      text: 'Completado',
      icon: CheckCircle2
    }
  };

  const status = statusConfig[item.productionStatus];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-amber-500/50 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${status.color}`} />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            #{item.sequenceNumber} · {item.orderId}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.color.replace('bg-', 'bg-').replace('500', '100')} ${status.color.replace('bg-', 'text-').replace('500', '700')}`}>
          <StatusIcon size={12} />
          {status.text}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div 
            className="w-24 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: item.colorHex + '20' }}
          >
            {item.productImageUrl ? (
              <img 
                src={item.productImageUrl} 
                alt={item.productName}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={24} className="text-zinc-400" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-zinc-900 dark:text-white truncate">
              {item.productName}
            </h3>
            <p className="text-sm text-zinc-500">
              {item.colorName} · {item.quantity} unidad{item.quantity > 1 ? 'es' : ''}
            </p>
            
            {/* Text to engrave */}
            {(item.frontText || item.backText) && (
              <div className="mt-2 space-y-1">
                {item.frontText && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                    <span className="text-zinc-400">Frente:</span> "{item.frontText}"
                  </p>
                )}
                {item.backText && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                    <span className="text-zinc-400">Dorso:</span> "{item.backText}"
                  </p>
                )}
              </div>
            )}

            {/* Priority badge */}
            {item.isPriority && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase">
                <AlertCircle size={10} />
                Prioridad
              </span>
            )}
          </div>
        </div>

        {/* Special notes */}
        {item.notes && (
          <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
              <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
              {item.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {item.productionStatus === ProductionStatus.PENDING && (
            <button
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors"
            >
              <Play size={14} fill="currentColor" />
              Iniciar
            </button>
          )}
          
          {item.productionStatus === ProductionStatus.IN_PROGRESS && (
            <button
              onClick={onComplete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors"
            >
              <Check size={14} strokeWidth={3} />
              Completar
            </button>
          )}
          
          {item.productionStatus === ProductionStatus.COMPLETED && (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium text-sm">
              <CheckCircle2 size={14} />
              Terminado
            </div>
          )}

          <button
            onClick={onViewDetail}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Ver
          </button>
        </div>
      </div>
    </div>
  );
};

// Production Detail View
const ProductionDetail: React.FC<{
  item: ProductionItem;
  onBack: () => void;
  onStart: () => void;
  onComplete: () => void;
}> = ({ item, onBack, onStart, onComplete }) => {
  const [checklist, setChecklist] = useState({
    textPositioned: false,
    logoAligned: false,
    noTypos: false,
    depthCorrect: false
  });

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Volver a cola</span>
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
            <Printer size={18} />
          </button>
          <span className="text-xs text-zinc-500">{item.orderId}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Product Preview */}
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-8 mb-6 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            {item.productImageUrl ? (
              <img 
                src={item.productImageUrl}
                alt={item.productName}
                className="max-w-[200px] max-h-[250px] object-contain mx-auto"
              />
            ) : (
              <Package size={64} className="text-zinc-300 mx-auto mb-4" />
            )}
            <p className="text-zinc-500 text-sm">Vista previa del diseño</p>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Front Side */}
          {(item.frontText || item.frontLogos?.length > 0) && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Frente
              </h4>
              {item.frontText && (
                          <div className="mb-3">
                            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Texto</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white" style={{ fontFamily: item.frontFontCssFamily }}>
                              "{item.frontText}"
                            </p>
                            {item.frontText2 && (
                              <p className="text-base text-zinc-600 dark:text-zinc-400 mt-1" style={{ fontFamily: item.frontFontCssFamily }}>
                                "{item.frontText2}"
                              </p>
                            )}
                            <p className="text-sm text-zinc-400 mt-1">Fuente: {item.frontFontName}</p>
                          </div>
                        )}
              {item.frontLogos?.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Logos</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.frontLogos.length} logo(s) adjunto(s)</p>
                </div>
              )}
            </div>
          )}

          {/* Back Side */}
          {(item.backText || item.backLogos?.length > 0) && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                Dorso
              </h4>
              {item.backText && (
                          <div className="mb-3">
                            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Texto</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white" style={{ fontFamily: item.backFontCssFamily }}>
                              "{item.backText}"
                            </p>
                            {item.backText2 && (
                              <p className="text-base text-zinc-600 dark:text-zinc-400 mt-1" style={{ fontFamily: item.backFontCssFamily }}>
                                "{item.backText2}"
                              </p>
                            )}
                            <p className="text-sm text-zinc-400 mt-1">Fuente: {item.backFontName}</p>
                          </div>
                        )}
              {item.backLogos?.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Logos</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.backLogos.length} logo(s) adjunto(s)</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 mb-6">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Información del Cliente</h4>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <User size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">{item.customerName}</p>
              <p className="text-xs text-zinc-500">Orden: {item.orderId}</p>
            </div>
          </div>
          {(item.deliveryDate || item.isPriority) && (
            <div className="mt-3 flex gap-2">
              {item.deliveryDate && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                  <Calendar size={12} />
                  Entrega: {item.deliveryDate}
                </span>
              )}
              {item.isPriority && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={12} />
                  Prioridad
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quality Checklist */}
        {item.productionStatus !== ProductionStatus.COMPLETED && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 mb-6">
            <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Checklist de Calidad</h4>
            <div className="space-y-2">
              {[
                { key: 'textPositioned', label: 'Texto correctamente posicionado' },
                { key: 'logoAligned', label: 'Logo alineado' },
                { key: 'noTypos', label: 'Sin errores ortográficos' },
                { key: 'depthCorrect', label: 'Profundidad de grabado correcta' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist[key as keyof typeof checklist]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {item.specialInstructions && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 mb-6">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Instrucciones Especiales
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-300">{item.specialInstructions}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {item.productionStatus === ProductionStatus.PENDING && (
            <button
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
            >
              <Play size={18} fill="currentColor" />
              Iniciar Grabado
            </button>
          )}
          
          {item.productionStatus === ProductionStatus.IN_PROGRESS && (
            <button
              onClick={onComplete}
              disabled={!allChecked}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
                allChecked 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Check size={18} strokeWidth={3} />
              Marcar como Completado
            </button>
          )}
        </div>

        {!allChecked && item.productionStatus === ProductionStatus.IN_PROGRESS && (
          <p className="text-center text-xs text-zinc-500 mt-2">
            Completa el checklist para habilitar
          </p>
        )}
      </div>
    </div>
  );
};

// Main Production Section Component
const ProductionSection: React.FC<ProductionSectionProps> = ({
  orders,
  products,
  fonts,
  onUpdateOrder
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [selectedItem, setSelectedItem] = useState<ProductionItem | null>(null);

  // Convert orders to production items
  const productionItems = useMemo(() => {
    const items: ProductionItem[] = [];
    orders.forEach(order => {
      // Only include orders that are not cancelled
      if (order.status !== OrderStatus.CANCELLED) {
        const orderItems = orderToProductionItems(order, products, fonts);
        items.push(...orderItems);
      }
    });
    return items.sort((a, b) => {
      // Sort by priority first, then by sequence
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return a.sequenceNumber - b.sequenceNumber;
    });
  }, [orders, products, fonts]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return productionItems;
    return productionItems.filter(item => {
      if (filter === 'PENDING') return item.productionStatus === ProductionStatus.PENDING;
      if (filter === 'IN_PROGRESS') return item.productionStatus === ProductionStatus.IN_PROGRESS;
      if (filter === 'COMPLETED') return item.productionStatus === ProductionStatus.COMPLETED;
      return true;
    });
  }, [productionItems, filter]);

  // Stats
  const stats = useMemo(() => ({
    pending: productionItems.filter(i => i.productionStatus === ProductionStatus.PENDING).length,
    inProgress: productionItems.filter(i => i.productionStatus === ProductionStatus.IN_PROGRESS).length,
    completed: productionItems.filter(i => i.productionStatus === ProductionStatus.COMPLETED).length
  }), [productionItems]);

  // Handlers
  const handleStartProduction = (item: ProductionItem) => {
    const order = orders.find(o => o.id === item.orderId);
    if (order) {
      onUpdateOrder(order.id, {
        status: OrderStatus.IN_PRODUCTION,
        history: [
          ...(order.history || []),
          {
            timestamp: new Date().toISOString(),
            status: OrderStatus.IN_PRODUCTION,
            note: `Item #${item.sequenceNumber} iniciado`
          }
        ]
      });
    }
  };

  const handleCompleteProduction = (item: ProductionItem) => {
    const order = orders.find(o => o.id === item.orderId);
    if (order) {
      // Check if all items are completed
      const orderItems = productionItems.filter(i => i.orderId === item.orderId);
      const allCompleted = orderItems.every(i => 
        i.orderItemId === item.orderItemId || i.productionStatus === ProductionStatus.COMPLETED
      );

      onUpdateOrder(order.id, {
        status: allCompleted ? OrderStatus.READY : OrderStatus.IN_PRODUCTION,
        history: [
          ...(order.history || []),
          {
            timestamp: new Date().toISOString(),
            status: allCompleted ? OrderStatus.READY : OrderStatus.IN_PRODUCTION,
            note: `Item #${item.sequenceNumber} completado${allCompleted ? ' - Orden lista' : ''}`
          }
        ]
      });
    }
    setSelectedItem(null);
  };

  // Detail view
  if (selectedItem) {
    return (
      <ProductionDetail
        item={selectedItem}
        onBack={() => setSelectedItem(null)}
        onStart={() => handleStartProduction(selectedItem)}
        onComplete={() => handleCompleteProduction(selectedItem)}
      />
    );
  }

  // List view
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Estación de Grabado</h2>
              <p className="text-sm text-zinc-500">Vista optimizada para operarios</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Pendientes: {stats.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-zinc-600 dark:text-zinc-400">En proceso: {stats.inProgress}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'ALL', label: 'Todos', count: productionItems.length },
            { key: 'PENDING', label: 'Pendientes', count: stats.pending },
            { key: 'IN_PROGRESS', label: 'En Proceso', count: stats.inProgress },
            { key: 'COMPLETED', label: 'Completados', count: stats.completed }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                filter === key ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Production Queue */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-zinc-300" />
            </div>
            <p className="font-bold text-zinc-600 dark:text-zinc-400">
              {filter === 'ALL' ? 'No hay items en cola' : `No hay items ${filter.toLowerCase()}`}
            </p>
            <p className="text-sm mt-1">
              {filter === 'ALL' 
                ? 'Los pedidos aparecerán aquí cuando estén listos para producción'
                : 'Cambia el filtro para ver otros items'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl">
            {filteredItems.map((item) => (
              <ProductionCard
                key={`${item.orderId}-${item.orderItemId}`}
                item={item}
                onStart={() => handleStartProduction(item)}
                onComplete={() => handleCompleteProduction(item)}
                onViewDetail={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionSection;

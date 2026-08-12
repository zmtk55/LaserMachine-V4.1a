import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Product, Order } from '../types';
import { 
  AlertTriangle, AlertCircle, Package, ShoppingCart, 
  TrendingDown, CheckCircle, Bell, ArrowRight,
  ExternalLink, Plus, Eye, Zap
} from 'lucide-react';

interface AlertsWidgetProps {
  products: Product[];
  orders: Order[];
  className?: string;
  onNavigate?: (view: string, filter?: string) => void;
  onViewProduct?: (productId: string) => void;
  onViewOrder?: (orderId: string) => void;
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({ 
  products, 
  orders, 
  className = '',
  onNavigate,
  onViewProduct,
  onViewOrder
}) => {
  const { notifications, markAsRead, setIsPanelOpen, addNotification } = useNotifications();

  // Calculate alerts
  const lowStockProducts = products.filter(p => {
    const totalStock = p.colors?.reduce((sum, c) => sum + (c.stock || 0), 0) || 0;
    return totalStock <= p.stockThreshold && totalStock > 0;
  });

  const outOfStockProducts = products.filter(p => {
    const totalStock = p.colors?.reduce((sum, c) => sum + (c.stock || 0), 0) || 0;
    return totalStock === 0;
  });

  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const inProductionOrders = orders.filter(o => o.status === 'IN_PROGRESS');

  // Actions - Always navigate to section, regardless of whether there are issues
  const goToInventory = () => {
    console.log('Going to INVENTORY');
    if (onNavigate) onNavigate('INVENTORY');
  };

  const goToOrders = () => {
    console.log('Going to ORDERS');
    if (onNavigate) onNavigate('ORDERS');
  };

  const handleRestock = (e: React.MouseEvent, product?: Product) => {
    e.stopPropagation();
    if (product && onViewProduct) {
      onViewProduct(product.id);
    } else {
      goToInventory();
    }
  };

  const handleViewPendingOrders = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate('ORDERS');
    }
  };

  const handleViewProduction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate('ORDERS');
    }
  };

  const alertItems = [
    {
      id: 'out-of-stock',
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/10',
      borderColor: 'border-red-200 dark:border-red-800/30',
      count: outOfStockProducts.length,
      label: 'Sin stock',
      message: outOfStockProducts.length > 0 
        ? `${outOfStockProducts.slice(0, 2).map(p => p.name).join(', ')}${outOfStockProducts.length > 2 ? ` y ${outOfStockProducts.length - 2} más` : ''}`
        : 'Todo en orden',
      priority: outOfStockProducts.length > 0 ? 'high' : 'low',
      action: {
        label: outOfStockProducts.length > 0 ? 'Reabastecer' : 'Ver inventario',
        onClick: () => goToInventory()
      }
    },
    {
      id: 'low-stock',
      icon: TrendingDown,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/10',
      borderColor: 'border-orange-200 dark:border-orange-800/30',
      count: lowStockProducts.length,
      label: 'Stock bajo',
      message: lowStockProducts.length > 0
        ? `${lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}${lowStockProducts.length > 2 ? ` y ${lowStockProducts.length - 2} más` : ''}`
        : 'Niveles óptimos',
      priority: lowStockProducts.length > 0 ? 'medium' : 'low',
      action: {
        label: 'Ver inventario',
        onClick: () => goToInventory()
      }
    },
    {
      id: 'pending-orders',
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      borderColor: 'border-blue-200 dark:border-blue-800/30',
      count: pendingOrders.length,
      label: 'Pedidos pendientes',
      message: pendingOrders.length > 0
        ? `${pendingOrders.length} por procesar`
        : 'Al día con pedidos',
      priority: pendingOrders.length > 5 ? 'medium' : 'low',
      action: {
        label: 'Ver pedidos',
        onClick: () => goToOrders()
      }
    },
    {
      id: 'in-production',
      icon: Package,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/10',
      borderColor: 'border-amber-200 dark:border-amber-800/30',
      count: inProductionOrders.length,
      label: 'En producción',
      message: inProductionOrders.length > 0
        ? `${inProductionOrders.length} en grabado`
        : 'Sin órdenes activas',
      priority: 'low',
      action: {
        label: 'Ver órdenes',
        onClick: () => goToOrders()
      }
    }
  ];

  const highPriorityCount = alertItems.filter(a => a.priority === 'high').length;
  const mediumPriorityCount = alertItems.filter(a => a.priority === 'medium').length;

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white">Alertas del Sistema</h3>
              <p className="text-xs text-zinc-500">
                {highPriorityCount > 0 ? (
                  <span className="text-red-500 font-medium">{highPriorityCount} requieren atención</span>
                ) : mediumPriorityCount > 0 ? (
                  <span className="text-amber-500 font-medium">{mediumPriorityCount} advertencias</span>
                ) : (
                  'Todo funcionando correctamente'
                )}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsPanelOpen(true)}
            className="text-xs font-medium text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
          >
            Ver todas
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Alert Items - Compact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800">
        {alertItems.map((item) => {
          const Icon = item.icon;
          const hasIssue = item.count > 0;
          
          return (
            <div 
              key={item.id}
              className={`
                p-4 flex items-center gap-3 transition-all cursor-pointer
                ${hasIssue ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:bg-zinc-100 dark:active:bg-zinc-800' : ''}
              `}
              onClick={() => {
                console.log('Alert clicked:', item.id);
                if (item.action?.onClick) {
                  item.action.onClick();
                }
              }}
            >
              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                ${hasIssue ? item.bgColor : 'bg-zinc-100 dark:bg-zinc-800'}
                ${hasIssue ? item.borderColor : ''}
                border
              `}>
                <Icon className={`w-4 h-4 ${hasIssue ? item.color : 'text-zinc-400'}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                    {item.label}
                  </span>
                  {hasIssue && (
                    <span className={`
                      text-[9px] font-bold px-1.5 py-0.5 rounded-full
                      ${item.priority === 'high' 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                        : item.priority === 'medium'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }
                    `}>
                      {item.count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate">
                  {item.message}
                </p>
                
                {/* Action Button */}
                {item.action && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`
                        text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors pointer-events-none
                        ${item.priority === 'high' 
                          ? 'text-red-500' 
                          : 'text-amber-500'
                        }
                      `}
                    >
                      {item.action.label}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
              
              {hasIssue ? (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions Bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="flex gap-2">
          {outOfStockProducts.length > 0 && (
            <button
              onClick={(e) => handleRestock(e)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Reabastecer {outOfStockProducts.length} productos
            </button>
          )}
          {pendingOrders.length > 0 && (
            <button
              onClick={handleViewPendingOrders}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Revisar {pendingOrders.length} pedidos
            </button>
          )}
          {inProductionOrders.length > 0 && (
            <button
              onClick={handleViewProduction}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Producción ({inProductionOrders.length})
            </button>
          )}
          {outOfStockProducts.length === 0 && pendingOrders.length === 0 && inProductionOrders.length === 0 && (
            <span className="text-xs text-zinc-400 text-center w-full py-1">
              No hay acciones pendientes
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsWidget;

import React, { useMemo } from 'react';
import { Order, Product, OrderStatus } from '../types';
import { TrendingUp, TrendingDown, Users, Package, DollarSign, Calendar, Activity, PieChart, BarChart3 } from 'lucide-react';

interface AdvancedStatsProps {
  orders: Order[];
  products: Product[];
  title?: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface TrendData {
  value: number;
  change: number;
  direction: 'up' | 'down' | 'neutral';
}

export const AdvancedStats: React.FC<AdvancedStatsProps> = ({ orders, products, title = 'Análisis Avanzado' }) => {
  
  // Revenue by day (last 30 days)
  const revenueByDay = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      days[key] = 0;
    }
    
    orders.forEach(order => {
      if (order.status !== OrderStatus.CANCELLED) {
        const dateKey = order.createdAt.split('T')[0];
        if (days[dateKey] !== undefined) {
          days[dateKey] += order.total;
        }
      }
    });
    
    return Object.entries(days).map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    }));
  }, [orders]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      'RECIBIDO': 0,
      'ESPERANDO_APROBACIÓN': 0,
      'EN_PRODUCCIÓN': 0,
      'LISTO': 0,
      'ENTREGADO': 0,
      'CANCELADO': 0
    };
    
    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([status, count]) => ({
        status,
        count,
        percentage: orders.length > 0 ? (count / orders.length) * 100 : 0
      }));
  }, [orders]);

  // Top products
  const topProducts = useMemo(() => {
    const productCounts: Record<string, { count: number; revenue: number }> = {};
    
    orders.forEach(order => {
      if (order.status !== OrderStatus.CANCELLED) {
        order.items.forEach(item => {
          if (!productCounts[item.productId]) {
            productCounts[item.productId] = { count: 0, revenue: 0 };
          }
          productCounts[item.productId].count += item.quantity;
          productCounts[item.productId].revenue += item.totalPrice;
        });
      }
    });
    
    return Object.entries(productCounts)
      .map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Producto Desconocido',
          image: product?.imageUrl,
          ...data
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders, products]);

  // Customer retention metrics
  const customerMetrics = useMemo(() => {
    const customerOrders: Record<string, number[]> = {};
    
    orders.forEach(order => {
      if (!customerOrders[order.customerPhone]) {
        customerOrders[order.customerPhone] = [];
      }
      customerOrders[order.customerPhone].push(order.total);
    });
    
    const customers = Object.entries(customerOrders);
    const returningCustomers = customers.filter(([_, totals]) => totals.length > 1).length;
    const totalCustomers = customers.length;
    const avgOrdersPerCustomer = totalCustomers > 0 ? orders.length / totalCustomers : 0;
    
    const totalSpent = customers.reduce((sum, [_, totals]) => 
      sum + totals.reduce((a, b) => a + b, 0), 0);
    const avgSpendPerCustomer = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
    
    return {
      totalCustomers,
      returningCustomers,
      retentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
      avgOrdersPerCustomer,
      avgSpendPerCustomer
    };
  }, [orders]);

  // Revenue trends
  const revenueTrend = useMemo(() => {
    const now = new Date();
    const thisMonth = revenueByDay
      .filter(d => new Date(d.date).getMonth() === now.getMonth())
      .reduce((sum, d) => sum + d.value, 0);
    
    const lastMonth = revenueByDay
      .filter(d => {
        const date = new Date(d.date);
        return date.getMonth() === (now.getMonth() - 1 || 11);
      })
      .reduce((sum, d) => sum + d.value, 0);
    
    const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    
    return {
      thisMonth,
      lastMonth,
      change,
      direction: change >= 0 ? 'up' as const : 'down' as const
    };
  }, [revenueByDay]);

  // Orders trend
  const ordersTrend = useMemo(() => {
    const now = new Date();
    const thisMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }).length;
    
    const lastMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const lastMonth = now.getMonth() - 1 || 11;
      return orderDate.getMonth() === lastMonth;
    }).length;
    
    const change = lastMonthOrders > 0 ? 
      ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0;
    
    return {
      thisMonth: thisMonthOrders,
      lastMonth: lastMonthOrders,
      change,
      direction: change >= 0 ? 'up' as const : 'down' as const
    };
  }, [orders]);

  // Max revenue for chart scaling
  const maxRevenue = Math.max(...revenueByDay.map(d => d.value), 1);

  // Status colors
  const statusColors: Record<string, string> = {
    'RECIBIDO': '#6b7280',
    'ESPERANDO_APROBACIÓN': '#f59e0b',
    'EN_PRODUCCIÓN': '#3b82f6',
    'LISTO': '#8b5cf6',
    'ENTREGADO': '#10b981',
    'CANCELADO': '#ef4444'
  };

  return (
    <div className="space-y-8">
      {title && (
        <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <Activity className="text-amber-500" />
          {title}
        </h3>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-amber-500" size={18} />
            <span className="text-xs font-bold text-zinc-500 uppercase">Ingresos Mes</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">
            ${revenueTrend.thisMonth.toLocaleString('es-MX')}
          </p>
          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${
            revenueTrend.direction === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {revenueTrend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(revenueTrend.change).toFixed(1)}% vs mes anterior
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-blue-500" size={18} />
            <span className="text-xs font-bold text-zinc-500 uppercase">Pedidos Mes</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">
            {ordersTrend.thisMonth}
          </p>
          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${
            ordersTrend.direction === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {ordersTrend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(ordersTrend.change).toFixed(1)}% vs mes anterior
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-green-500" size={18} />
            <span className="text-xs font-bold text-zinc-500 uppercase">Clientes Total</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">
            {customerMetrics.totalCustomers}
          </p>
          <div className="flex items-center gap-1 text-xs font-bold mt-1 text-green-500">
            <TrendingUp size={14} />
            {customerMetrics.retentionRate.toFixed(1)}% recurrentes
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="text-purple-500" size={18} />
            <span className="text-xs font-bold text-zinc-500 uppercase">Ticket Promedio</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">
            ${customerMetrics.avgSpendPerCustomer.toFixed(0)}
          </p>
          <div className="text-xs font-bold mt-1 text-zinc-500">
            {customerMetrics.avgOrdersPerCustomer.toFixed(1)} pedidos/cliente
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 size={16} /> Ingresos Últimos 30 Días
        </h4>
        <div className="h-48 flex items-end gap-1">
          {revenueByDay.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
              <div 
                className="w-full bg-amber-500 rounded-t-md opacity-80 hover:opacity-100 transition-all cursor-pointer relative"
                style={{ 
                  height: `${Math.max((day.value / maxRevenue) * 100, 2)}%`,
                  minHeight: '4px'
                }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  ${day.value.toLocaleString('es-MX')}
                </div>
              </div>
              {idx % 5 === 0 && (
                <span className="text-[8px] text-zinc-400">{day.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PieChart size={16} /> Pedidos por Estado
          </h4>
          <div className="space-y-3">
            {ordersByStatus.map(({ status, count, percentage }) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{status}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{count}</span>
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: statusColors[status] || '#6b7280'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package size={16} /> Productos Más Vendidos
          </h4>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-black text-zinc-500">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-xs text-zinc-500">{product.count} unidades</p>
                </div>
                <span className="font-black text-amber-500">${product.revenue.toLocaleString('es-MX')}</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-4">Sin datos suficientes</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users size={16} /> Insights de Clientes
        </h4>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-black text-amber-400">{customerMetrics.retentionRate.toFixed(1)}%</p>
            <p className="text-sm text-zinc-400">Tasa de Retención</p>
            <p className="text-xs text-zinc-500 mt-1">Clientes que vuelven a comprar</p>
          </div>
          <div>
            <p className="text-3xl font-black text-green-400">${customerMetrics.avgSpendPerCustomer.toFixed(0)}</p>
            <p className="text-sm text-zinc-400">Valor de Cliente</p>
            <p className="text-xs text-zinc-500 mt-1">Gasto promedio por cliente</p>
          </div>
          <div>
            <p className="text-3xl font-black text-blue-400">{customerMetrics.avgOrdersPerCustomer.toFixed(1)}</p>
            <p className="text-sm text-zinc-400">Frecuencia de Compra</p>
            <p className="text-xs text-zinc-500 mt-1">Pedidos promedio por cliente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

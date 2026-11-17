import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Product, Order, UserRole } from '../types';

interface NotificationManagerProps {
  products: Product[];
  orders: Order[];
  user: any;
  businessReady?: boolean;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ products, orders, user, businessReady=true }) => {
  const { addNotification, notifications, persistenceStatus } = useNotifications();
  const previousOrderIds = useRef<Set<string>|null>(null);
  const prevProducts = useRef<Product[]>([]);
  const initialCheckDone = useRef(false);

  useEffect(()=>{initialCheckDone.current=false;previousOrderIds.current=null;},[user?.id]);

  // Check for low stock on mount and when products change
  useEffect(() => {
    if (!businessReady || user?.role!==UserRole.ADMIN || persistenceStatus!=='Cargado de Supabase') return;
    if (!initialCheckDone.current && products.length>0) {
      initialCheckDone.current = true;
      
      // Check initial low stock
      products.forEach(product => {
        // A missing catalog is not verified zero stock.
        if(!product.colors?.length || product.colors.some(c=>!Number.isFinite(c.stock)||c.stock<0))return;
        const totalStock = product.colors?.reduce((sum, c) => sum + (c.stock || 0), 0) || 0;
        if (totalStock <= product.stockThreshold && totalStock > 0) {
          const existingNotif = notifications.find(n => 
            n.type === 'stock' && n.data?.productId === product.id && !n.read
          );
          
          if (!existingNotif) {
            addNotification({
              title: `Stock bajo: ${product.name}`,
              message: `Quedan ${totalStock} unidades. Umbral: ${product.stockThreshold}`,
              type: 'stock',
              actionLabel: 'Ver inventario',
              actionUrl: '#inventory',
              data: { productId: product.id, stock: totalStock }
            });
          }
        }
        
        if (totalStock === 0) {
          const existingNotif = notifications.find(n => 
            (n.type === 'stock'||n.type === 'error') && n.data?.productId === product.id && n.data?.stock === 0 && !n.read
          );
          
          if (!existingNotif) {
            addNotification({
              title: `Sin stock: ${product.name}`,
              message: `Este producto está agotado. Reabastece pronto.`,
              type: 'error',
              actionLabel: 'Reabastecer',
              actionUrl: '#inventory',
              data: { productId: product.id, stock: 0 }
            });
          }
        }
      });
    }
    
    prevProducts.current = products;
  }, [products, addNotification, notifications, persistenceStatus,user?.role,businessReady]);

  // Check for new orders
  useEffect(() => {
    if(!businessReady || user?.role!==UserRole.ADMIN || persistenceStatus!=='Cargado de Supabase')return;
    const previous=previousOrderIds.current;
    if(previous){
      orders.filter(order=>!previous.has(order.id)).forEach(order=>{
        addNotification({title:`Nuevo pedido #${order.id}`,message:`${order.customerName} - ${order.total} - ${order.items.length} item(s)`,type:'order',actionLabel:'Ver pedido',actionUrl:'#orders',data:{orderId:order.id}});
      });
    }
    previousOrderIds.current=new Set(orders.map(o=>o.id));
  }, [orders, addNotification,persistenceStatus,user?.role,businessReady]);

  return null; // This is a logic-only component
};

export default NotificationManager;

import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Product, Order } from '../types';

interface NotificationManagerProps {
  products: Product[];
  orders: Order[];
  user: any;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ products, orders, user }) => {
  const { addNotification, notifications } = useNotifications();
  const prevOrdersLength = useRef(orders.length);
  const prevProducts = useRef<Product[]>([]);
  const initialCheckDone = useRef(false);

  // Check for low stock on mount and when products change
  useEffect(() => {
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      
      // Check initial low stock
      products.forEach(product => {
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
            n.type === 'stock' && n.data?.productId === product.id && n.data?.stock === 0 && !n.read
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
  }, [products, addNotification, notifications]);

  // Check for new orders
  useEffect(() => {
    if (orders.length > prevOrdersLength.current && prevOrdersLength.current > 0) {
      const newOrders = orders.slice(prevOrdersLength.current);
      newOrders.forEach(order => {
        addNotification({
          title: `Nuevo pedido #${order.id}`,
          message: `${order.customerName} - ${order.totalAmount} - ${order.items.length} item(s)`,
          type: 'order',
          actionLabel: 'Ver pedido',
          actionUrl: '#orders',
          data: { orderId: order.id }
        });
      });
    }
    prevOrdersLength.current = orders.length;
  }, [orders, addNotification]);

  return null; // This is a logic-only component
};

export default NotificationManager;

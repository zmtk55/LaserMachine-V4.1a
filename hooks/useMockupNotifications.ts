import { useEffect, useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import {
  requestNotificationPermission,
  subscribeToOrderNotifications,
  sendMockupNotification,
  requiresMockupApproval,
  getMockupApproval
} from '../services/mockupApprovalService';

interface UseMockupNotificationsReturn {
  permission: NotificationPermission | null;
  requestPermission: () => Promise<boolean>;
  pendingApprovals: Order[];
  hasPendingApprovals: boolean;
}

export function useMockupNotifications(
  orders: Order[],
  userId: string
): UseMockupNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<Order[]>([]);

  // Check initial permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  // Filter orders requiring approval
  useEffect(() => {
    const pending = orders.filter(order => {
      const orderUserId = order.customerEmail || order.customerPhone;
      if (orderUserId !== userId) return false;
      
      return requiresMockupApproval(order) && order.status === OrderStatus.WAITING_APPROVAL;
    });
    
    setPendingApprovals(pending);
  }, [orders, userId]);

  // Subscribe to notifications
  useEffect(() => {
    if (!userId || permission !== 'granted') return;

    const unsubscribe = subscribeToOrderNotifications(
      orders,
      userId,
      (order, type) => {
        console.log(`Notification received: ${type} for order ${order.id}`);
      }
    );

    return unsubscribe;
  }, [orders, userId, permission]);

  return {
    permission,
    requestPermission,
    pendingApprovals,
    hasPendingApprovals: pendingApprovals.length > 0
  };
}

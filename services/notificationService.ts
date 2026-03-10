// Web Push Notifications Service
// Maneja notificaciones del navegador cuando cambia el status de órdenes

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string }[];
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private subscription: PushSubscription | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Request permission for notifications
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notifications denied by user');
      return false;
    }

    this.permission = await Notification.requestPermission();
    return this.permission === 'granted';
  }

  // Check current permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  // Show a local notification
  async show(payload: NotificationPayload): Promise<boolean> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/assets/icons/notification-icon.png',
        badge: payload.badge || '/assets/icons/badge-icon.png',
        tag: payload.tag,
        data: payload.data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (payload.data?.orderId) {
          window.location.href = `?view=TRACKING&order=${payload.data.orderId}`;
        }
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Notification templates for order status changes
  async notifyOrderStatusChange(
    orderId: string,
    customerName: string,
    newStatus: string,
    total: number
  ): Promise<boolean> {
    const statusMessages: Record<string, { title: string; body: string }> = {
      'RECIBIDO': {
        title: '📦 Orden Recibida',
        body: `Tu orden #${orderId} ha sido confirmada. Total: $${total}`,
      },
      'ESPERANDO_APROBACIÓN': {
        title: '⏰ Esperando Aprobación',
        body: `Tu orden #${orderId} está esperando tu aprobación del diseño.`,
      },
      'EN_PRODUCCIÓN': {
        title: '🔥 En Producción',
        body: `Tu orden #${orderId} ya está en producción. Pronto tendrás tus productos listos.`,
      },
      'LISTO': {
        title: '✅ ¡Listo para Entregar!',
        body: `Tu orden #${orderId} está lista. Pásala a recoger.`,
      },
      'ENTREGADO': {
        title: '🎉 Orden Entregada',
        body: `Tu orden #${orderId} ha sido entregada. ¡Gracias por tu compra!`,
      },
      'CANCELADO': {
        title: '❌ Orden Cancelada',
        body: `Tu orden #${orderId} ha sido cancelada.`,
      },
    };

    const message = statusMessages[newStatus] || {
      title: '📋 Actualización de Orden',
      body: `Tu orden #${orderId} ha sido actualizada.`,
    };

    return this.show({
      title: message.title,
      body: message.body,
      tag: `order-${orderId}`,
      data: { orderId, status: newStatus },
    });
  }

  // Notify about payment status
  async notifyPaymentUpdate(
    orderId: string,
    paymentStatus: string,
    amount: number
  ): Promise<boolean> {
    const isPaid = paymentStatus === 'PAGADO';
    
    return this.show({
      title: isPaid ? '💰 Pago Confirmado' : '💳 Pago Pendiente',
      body: isPaid 
        ? `El pago de $${amount} para #${orderId} ha sido confirmado.`
        : `Tu pago de $${amount} para #${orderId} está pendiente.`,
      tag: `payment-${orderId}`,
      data: { orderId, paymentStatus },
    });
  }

  // Notify about appointment/reservation
  async notifyAppointment(
    type: 'created' | 'reminder' | 'cancelled',
    appointmentDate: string,
    details: string
  ): Promise<boolean> {
    const messages = {
      created: {
        title: '📅 Cita Agendada',
        body: `Tu cita ha sido programada para el ${appointmentDate}. ${details}`,
      },
      reminder: {
        title: '⏰ Recordatorio de Cita',
        body: `Tu cita es mañana ${appointmentDate}. ${details}`,
      },
      cancelled: {
        title: '❌ Cita Cancelada',
        body: `Tu cita del ${appointmentDate} ha sido cancelada.`,
      },
    };

    return this.show({
      title: messages[type].title,
      body: messages[type].body,
      tag: 'appointment',
    });
  }

  // Close all notifications
  closeAll(): void {
    if (typeof window !== 'undefined' && 'ServiceWorkerRegistration' in window) {
      (window as unknown as { ServiceWorkerRegistration: { getNotifications: () => Promise<Notification[]> } }).ServiceWorkerRegistration?.getNotifications?.().then((notifications: Notification[]) => {
        notifications.forEach(n => n.close());
      }).catch(() => {});
    }
  }
}

export const notificationService = new NotificationService();

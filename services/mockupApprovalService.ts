import { Order, OrderStatus } from '../types';

export type MockupApprovalStatus = 
  | 'PENDING'      // Esperando aprobación
  | 'APPROVED'     // Aprobado por cliente
  | 'REJECTED'     // Rechazado, se necesitan cambios
  | 'REVISION'     // En revisión después de rechazo
  | 'NONE';        // No requiere aprobación

export interface MockupApproval {
  orderId: string;
  status: MockupApprovalStatus;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  revisionNotes?: string;
  approvedBy?: string;
  history: MockupApprovalHistory[];
}

export interface MockupApprovalHistory {
  timestamp: string;
  action: 'SENT' | 'APPROVED' | 'REJECTED' | 'REVISION_SUBMITTED';
  by: 'CLIENT' | 'ADMIN';
  notes?: string;
}

// Storage key
const APPROVAL_STORAGE_KEY = 'lasermachine_mockup_approvals';

/**
 * Check if an order requires mockup approval
 */
export function requiresMockupApproval(order: Order): boolean {
  // Only orders with custom text/logos need approval
  const hasCustomDesign = order.items.some(item => 
    item.frontText || 
    item.frontText2 || 
    item.backText ||
    (item.frontLogos && item.frontLogos.length > 0) ||
    (item.backLogos && item.backLogos.length > 0)
  );
  
  // Only if status is WAITING_APPROVAL or earlier
  const isEarlyStage = [
    OrderStatus.RECEIVED,
    OrderStatus.WAITING_APPROVAL
  ].includes(order.status);
  
  return hasCustomDesign && isEarlyStage;
}

/**
 * Get mockup approval data for an order
 */
export function getMockupApproval(orderId: string): MockupApproval | null {
  try {
    const data = localStorage.getItem(`${APPROVAL_STORAGE_KEY}_${orderId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading mockup approval:', e);
  }
  
  return null;
}

/**
 * Save mockup approval data
 */
export function saveMockupApproval(approval: MockupApproval): void {
  try {
    localStorage.setItem(
      `${APPROVAL_STORAGE_KEY}_${approval.orderId}`,
      JSON.stringify(approval)
    );
  } catch (e) {
    console.error('Error saving mockup approval:', e);
  }
}

/**
 * Approve mockup
 */
export function approveMockup(
  orderId: string,
  approvedBy: string
): MockupApproval {
  const existing = getMockupApproval(orderId);
  
  const approval: MockupApproval = {
    orderId,
    status: 'APPROVED',
    approvedAt: new Date().toISOString(),
    approvedBy,
    history: [
      ...(existing?.history || []),
      {
        timestamp: new Date().toISOString(),
        action: 'APPROVED',
        by: 'CLIENT'
      }
    ]
  };
  
  saveMockupApproval(approval);
  
  // Dispatch event for notifications
  window.dispatchEvent(new CustomEvent('mockupApproved', {
    detail: { orderId, approvedBy }
  }));
  
  return approval;
}

/**
 * Reject mockup
 */
export function rejectMockup(
  orderId: string,
  reason: string,
  revisionNotes?: string
): MockupApproval {
  const existing = getMockupApproval(orderId);
  
  const approval: MockupApproval = {
    orderId,
    status: 'REJECTED',
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
    revisionNotes,
    history: [
      ...(existing?.history || []),
      {
        timestamp: new Date().toISOString(),
        action: 'REJECTED',
        by: 'CLIENT',
        notes: reason
      }
    ]
  };
  
  saveMockupApproval(approval);
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('mockupRejected', {
    detail: { orderId, reason, revisionNotes }
  }));
  
  return approval;
}

/**
 * Generate WhatsApp message for mockup approval
 */
export function generateWhatsAppApprovalMessage(
  order: Order,
  action: 'APPROVE' | 'REJECT' | 'QUESTION',
  notes?: string
): string {
  const customerName = order.customerName;
  const orderId = order.id.slice(-6);
  
  if (action === 'APPROVE') {
    return `¡Hola! Soy ${customerName}. ✓\n\nQuiero aprobar el mockup del pedido #${orderId}.\n\nTodo se ve perfecto, pueden continuar con la producción.\n\nGracias!`;
  }
  
  if (action === 'REJECT') {
    return `¡Hola! Soy ${customerName}.\n\nRevisé el mockup del pedido #${orderId} y necesito algunos cambios:\n\n${notes || 'Por favor contactarme para discutir los detalles.'}\n\nGracias!`;
  }
  
  // QUESTION
  return `¡Hola! Soy ${customerName}.\n\nTengo una pregunta sobre el mockup del pedido #${orderId}:\n\n${notes}\n\nGracias!`;
}

/**
 * Get WhatsApp link for mockup communication
 */
export function getWhatsAppLink(
  phoneNumber: string,
  message: string
): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Send browser notification
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  new Notification(title, {
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-192x192.png',
    ...options
  });
}

/**
 * Send mockup notification
 */
export function sendMockupNotification(
  order: Order,
  type: 'READY_FOR_APPROVAL' | 'APPROVED' | 'REJECTED'
): void {
  const titles = {
    READY_FOR_APPROVAL: '✏️ Mockup listo para aprobar',
    APPROVED: '✅ Mockup aprobado',
    REJECTED: '📝 Se solicitaron cambios'
  };
  
  const bodies = {
    READY_FOR_APPROVAL: `Pedido #${order.id.slice(-6)}: Revisa y aprueba tu diseño`,
    APPROVED: `Pedido #${order.id.slice(-6)}: El cliente aprobó el mockup`,
    REJECTED: `Pedido #${order.id.slice(-6)}: El cliente solicitó cambios`
  };
  
  sendNotification(titles[type], {
    body: bodies[type],
    tag: `mockup-${order.id}`,
    requireInteraction: type === 'READY_FOR_APPROVAL',
    data: { orderId: order.id, type }
  });
}

/**
 * Subscribe to order status changes for notifications
 */
export function subscribeToOrderNotifications(
  orders: Order[],
  userId: string,
  onNotification?: (order: Order, type: string) => void
): () => void {
  const checkInterval = setInterval(() => {
    orders.forEach(order => {
      const orderUserId = order.customerEmail || order.customerPhone;
      if (orderUserId !== userId) return;
      
      // Check for status changes that need notification
      if (order.status === OrderStatus.WAITING_APPROVAL) {
        const approval = getMockupApproval(order.id);
        
        // Only notify if not already notified
        if (!approval) {
          sendMockupNotification(order, 'READY_FOR_APPROVAL');
          
          // Initialize approval tracking
          const newApproval: MockupApproval = {
            orderId: order.id,
            status: 'PENDING',
            history: [{
              timestamp: new Date().toISOString(),
              action: 'SENT',
              by: 'ADMIN'
            }]
          };
          saveMockupApproval(newApproval);
          
          onNotification?.(order, 'READY_FOR_APPROVAL');
        }
      }
    });
  }, 30000); // Check every 30 seconds
  
  return () => clearInterval(checkInterval);
}

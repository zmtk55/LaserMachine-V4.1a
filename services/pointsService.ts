import { Order, OrderStatus } from '../types';

// Configuration
export const POINTS_CONFIG = {
  // 1 punto por cada $10 gastados
  POINTS_PER_CURRENCY: 0.1, // 1 punto = $10
  
  // Bonus por completar pedido
  COMPLETION_BONUS: 50,
  
  // Valor de canje: 100 puntos = $10
  REDEMPTION_VALUE: 0.1, // $0.10 por punto
  
  // Mínimo para canjear
  MIN_REDEMPTION: 100, // mínimo 100 puntos
};

// Transaction types
export type PointsTransactionType = 
  | 'EARNED_PURCHASE'      // Puntos ganados por compra
  | 'EARNED_BONUS'         // Puntos de bono (completar pedido)
  | 'REDEEMED'             // Puntos canjeados
  | 'ADJUSTMENT'           // Ajuste manual
  | 'EXPIRED';             // Puntos expirados

export interface PointsTransaction {
  id: string;
  userId: string;
  orderId?: string;
  type: PointsTransactionType;
  points: number; // positivo para ganar, negativo para canjear
  amount?: number; // monto de la compra (si aplica)
  description: string;
  createdAt: string;
  expiresAt?: string; // fecha de expiración (si aplica)
}

export interface UserPoints {
  userId: string;
  totalPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  transactions: PointsTransaction[];
  lastUpdated: string;
}

/**
 * Calculate points earned for an order
 */
export function calculatePointsForOrder(order: Order): number {
  if (order.status !== OrderStatus.COMPLETED) {
    return 0;
  }

  // Base points: 1 punto por cada $10
  const basePoints = Math.floor(order.total * POINTS_CONFIG.POINTS_PER_CURRENCY);
  
  // Bonus por completar
  const bonusPoints = POINTS_CONFIG.COMPLETION_BONUS;
  
  return basePoints + bonusPoints;
}

/**
 * Calculate money value of points
 */
export function calculatePointsValue(points: number): number {
  return points * POINTS_CONFIG.REDEMPTION_VALUE;
}

/**
 * Calculate how many points can be earned for a purchase amount
 */
export function calculatePotentialPoints(amount: number): number {
  return Math.floor(amount * POINTS_CONFIG.POINTS_PER_CURRENCY);
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return new Intl.NumberFormat('es-MX').format(points);
}

/**
 * Format points value as currency
 */
export function formatPointsValue(points: number): string {
  const value = calculatePointsValue(points);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
}

/**
 * Check if user can redeem points
 */
export function canRedeemPoints(userPoints: UserPoints, pointsToRedeem: number): {
  canRedeem: boolean;
  reason?: string;
} {
  if (pointsToRedeem < POINTS_CONFIG.MIN_REDEMPTION) {
    return {
      canRedeem: false,
      reason: `Mínimo ${POINTS_CONFIG.MIN_REDEMPTION} puntos para canjear`
    };
  }
  
  if (userPoints.totalPoints < pointsToRedeem) {
    return {
      canRedeem: false,
      reason: 'No tienes suficientes puntos'
    };
  }
  
  return { canRedeem: true };
}

/**
 * Create a points transaction
 */
export function createTransaction(
  userId: string,
  type: PointsTransactionType,
  points: number,
  description: string,
  options?: {
    orderId?: string;
    amount?: number;
  }
): PointsTransaction {
  return {
    id: `pts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    orderId: options?.orderId,
    type,
    points,
    amount: options?.amount,
    description,
    createdAt: new Date().toISOString(),
    // Los puntos ganados expiran en 1 año
    expiresAt: points > 0 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined
  };
}

// Local storage key
const POINTS_STORAGE_KEY = 'lasermachine_points';

/**
 * Get user points from local storage
 */
export function getUserPoints(userId: string): UserPoints {
  try {
    const data = localStorage.getItem(`${POINTS_STORAGE_KEY}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading points:', e);
  }
  
  return {
    userId,
    totalPoints: 0,
    lifetimePoints: 0,
    redeemedPoints: 0,
    transactions: [],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Save user points to local storage
 */
export function saveUserPoints(userPoints: UserPoints): void {
  try {
    localStorage.setItem(
      `${POINTS_STORAGE_KEY}_${userPoints.userId}`,
      JSON.stringify(userPoints)
    );
  } catch (e) {
    console.error('Error saving points:', e);
  }
}

/**
 * Add points to user account
 */
export function addPoints(
  userId: string,
  points: number,
  type: PointsTransactionType,
  description: string,
  options?: { orderId?: string; amount?: number }
): UserPoints {
  const userPoints = getUserPoints(userId);
  
  const transaction = createTransaction(userId, type, points, description, options);
  
  userPoints.transactions.unshift(transaction);
  userPoints.totalPoints += points;
  userPoints.lifetimePoints += points;
  userPoints.lastUpdated = new Date().toISOString();
  
  saveUserPoints(userPoints);
  
  return userPoints;
}

/**
 * Redeem points
 */
export function redeemPoints(
  userId: string,
  points: number,
  description: string
): { success: boolean; userPoints?: UserPoints; error?: string } {
  const userPoints = getUserPoints(userId);
  
  const check = canRedeemPoints(userPoints, points);
  if (!check.canRedeem) {
    return { success: false, error: check.reason };
  }
  
  const transaction = createTransaction(
    userId,
    'REDEEMED',
    -points, // Negativo porque se restan
    description
  );
  
  userPoints.transactions.unshift(transaction);
  userPoints.totalPoints -= points;
  userPoints.redeemedPoints += points;
  userPoints.lastUpdated = new Date().toISOString();
  
  saveUserPoints(userPoints);
  
  return { success: true, userPoints };
}

/**
 * Process order completion and award points
 */
export function processOrderCompletion(order: Order): { 
  success: boolean; 
  pointsEarned: number;
  userPoints?: UserPoints;
} {
  if (!order.customerEmail && !order.customerPhone) {
    return { success: false, pointsEarned: 0 };
  }
  
  const userId = order.customerEmail || order.customerPhone || 'guest';
  const pointsEarned = calculatePointsForOrder(order);
  
  if (pointsEarned <= 0) {
    return { success: false, pointsEarned: 0 };
  }
  
  const userPoints = addPoints(
    userId,
    pointsEarned,
    'EARNED_PURCHASE',
    `Puntos por pedido #${order.id.slice(-6)}`,
    { orderId: order.id, amount: order.total }
  );
  
  return { success: true, pointsEarned, userPoints };
}

/**
 * Get recent transactions
 */
export function getRecentTransactions(
  userId: string,
  limit: number = 10
): PointsTransaction[] {
  const userPoints = getUserPoints(userId);
  return userPoints.transactions.slice(0, limit);
}

/**
 * Get points summary for display
 */
export function getPointsSummary(userId: string): {
  totalPoints: number;
  totalValue: string;
  lifetimePoints: number;
  redeemedPoints: number;
  recentTransactions: PointsTransaction[];
} {
  const userPoints = getUserPoints(userId);
  
  return {
    totalPoints: userPoints.totalPoints,
    totalValue: formatPointsValue(userPoints.totalPoints),
    lifetimePoints: userPoints.lifetimePoints,
    redeemedPoints: userPoints.redeemedPoints,
    recentTransactions: userPoints.transactions.slice(0, 5)
  };
}

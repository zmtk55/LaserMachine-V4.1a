import { useState, useEffect, useCallback } from 'react';
import { Order } from '../types';
import {
  UserPoints,
  PointsTransaction,
  calculatePointsForOrder,
  calculatePointsValue,
  formatPoints,
  formatPointsValue,
  canRedeemPoints,
  getUserPoints,
  addPoints,
  redeemPoints,
  processOrderCompletion,
  getRecentTransactions,
  getPointsSummary,
  POINTS_CONFIG
} from '../services/pointsService';

interface UseLaserPointsReturn {
  // State
  userPoints: UserPoints | null;
  loading: boolean;
  
  // Computed values
  totalPoints: number;
  pointsValue: string;
  formattedPoints: string;
  
  // Actions
  refreshPoints: () => void;
  processOrder: (order: Order) => { success: boolean; pointsEarned: number };
  redeem: (points: number, description: string) => { success: boolean; error?: string };
  
  // Checkers
  canRedeem: (points: number) => { canRedeem: boolean; reason?: string };
  calculatePotentialPoints: (amount: number) => number;
  
  // Data
  recentTransactions: PointsTransaction[];
  pointsSummary: ReturnType<typeof getPointsSummary> | null;
}

export function useLaserPoints(userId: string | undefined): UseLaserPointsReturn {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  // Load points on mount or userId change
  useEffect(() => {
    if (!userId) {
      setUserPoints(null);
      setLoading(false);
      return;
    }

    const loadPoints = () => {
      const points = getUserPoints(userId);
      setUserPoints(points);
      setLoading(false);
    };

    loadPoints();

    // Listen for points updates from other components
    const handlePointsUpdate = (event: CustomEvent<{ userId: string }>) => {
      if (event.detail.userId === userId) {
        loadPoints();
      }
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate as EventListener);
    };
  }, [userId]);

  // Refresh points manually
  const refreshPoints = useCallback(() => {
    if (!userId) return;
    const points = getUserPoints(userId);
    setUserPoints(points);
  }, [userId]);

  // Process order completion and award points
  const processOrder = useCallback((order: Order) => {
    if (!userId) return { success: false, pointsEarned: 0 };
    
    const result = processOrderCompletion(order);
    
    if (result.success) {
      setUserPoints(result.userPoints || null);
      
      // Dispatch event for notifications
      window.dispatchEvent(new CustomEvent('pointsEarned', {
        detail: {
          userId,
          points: result.pointsEarned,
          orderId: order.id
        }
      }));
    }
    
    return result;
  }, [userId]);

  // Redeem points
  const redeem = useCallback((points: number, description: string) => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    const result = redeemPoints(userId, points, description);
    
    if (result.success && result.userPoints) {
      setUserPoints(result.userPoints);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('pointsRedeemed', {
        detail: {
          userId,
          points,
          value: calculatePointsValue(points)
        }
      }));
    }
    
    return result;
  }, [userId]);

  // Check if can redeem
  const canRedeem = useCallback((points: number) => {
    if (!userPoints) return { canRedeem: false, reason: 'Cargando...' };
    return canRedeemPoints(userPoints, points);
  }, [userPoints]);

  // Calculate potential points for an amount
  const calculatePotentialPoints = useCallback((amount: number) => {
    return Math.floor(amount * POINTS_CONFIG.POINTS_PER_CURRENCY);
  }, []);

  // Computed values
  const totalPoints = userPoints?.totalPoints || 0;
  const pointsValue = formatPointsValue(totalPoints);
  const formattedPoints = formatPoints(totalPoints);
  const recentTransactions = userPoints?.transactions.slice(0, 10) || [];
  const pointsSummary = userPoints ? getPointsSummary(userId || '') : null;

  return {
    userPoints,
    loading,
    totalPoints,
    pointsValue,
    formattedPoints,
    refreshPoints,
    processOrder,
    redeem,
    canRedeem,
    calculatePotentialPoints,
    recentTransactions,
    pointsSummary
  };
}

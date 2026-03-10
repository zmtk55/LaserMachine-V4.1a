import React, { createContext, useContext, useState, useEffect } from 'react';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
  items: any[];
  // ... other order properties
}

interface OrderHistoryContextType {
  orderHistory: Order[];
  addToHistory: (order: Order) => void;
  clearHistory: () => void;
}

const OrderHistoryContext = createContext<OrderHistoryContextType | null>(null);

export const OrderHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('lm_order_history');
    if (savedHistory) {
      setOrderHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lm_order_history', JSON.stringify(orderHistory));
  }, [orderHistory]);

  const addToHistory = (order: Order) => {
    setOrderHistory(prev => {
      const existingIndex = prev.findIndex(o => o.id === order.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = order;
        return updated;
      }
      return [order, ...prev.slice(0, 99)]; // Keep max 100 orders
    });
  };

  const clearHistory = () => {
    setOrderHistory([]);
  };

  return (
    <OrderHistoryContext.Provider value={{ orderHistory, addToHistory, clearHistory }}>
      {children}
    </OrderHistoryContext.Provider>
  );
};

export const useOrderHistory = () => {
  const context = useContext(OrderHistoryContext);
  if (!context) {
    throw new Error('useOrderHistory must be used within an OrderHistoryProvider');
  }
  return context;
};
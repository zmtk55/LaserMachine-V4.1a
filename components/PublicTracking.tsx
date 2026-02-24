
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { Search, Package, CheckCircle, Clock, Truck, AlertCircle } from 'lucide-react';

interface PublicTrackingProps {
  orders: Order[];
  onBack: () => void;
  preSelectedOrderId?: string | null;
}

export const PublicTracking: React.FC<PublicTrackingProps> = ({ orders, onBack, preSelectedOrderId }) => {
  const [searchId, setSearchId] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  // Auto-search when preSelectedOrderId is provided
  useEffect(() => {
    if (preSelectedOrderId) {
      const order = orders.find(o => o.id.toLowerCase() === preSelectedOrderId.toLowerCase());
      if (order) {
        setFoundOrder(order);
        setSearchId(preSelectedOrderId);
        setError('');
      } else {
        setError('No encontramos una orden con ese ID.');
      }
    }
  }, [preSelectedOrderId, orders]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    
    const order = orders.find(o => o.id.toLowerCase() === searchId.toLowerCase().trim());
    if (order) {
      setFoundOrder(order);
      setError('');
    } else {
      setFoundOrder(null);
      setError('No encontramos una orden con ese ID. Verifícalo e intenta de nuevo.');
    }
  };

  const steps = [
    { status: OrderStatus.RECEIVED, label: 'Recibido', icon: Package },
    { status: OrderStatus.WAITING_APPROVAL, label: 'Aprobación', icon: AlertCircle },
    { status: OrderStatus.IN_PRODUCTION, label: 'Producción', icon: Clock },
    { status: OrderStatus.READY, label: 'Listo', icon: CheckCircle },
    { status: OrderStatus.COMPLETED, label: 'Entregado', icon: Truck },
  ];

  const getCurrentStepIndex = (status: OrderStatus) => {
      const index = steps.findIndex(s => s.status === status);
      return index === -1 ? 0 : index;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-6 font-mono-tech relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white uppercase tracking-widest">
        ← Volver al Inicio
      </button>

      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="nike-title text-4xl italic text-zinc-900 dark:text-white uppercase tracking-tighter mb-2">Rastreo de Pedidos</h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Consulta el estado de tu personalización</p>
        </div>

        <form onSubmit={handleTrack} className="mb-10 relative">
          <input 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="INGRESA TU ID DE ORDEN (EJ. LM-9392)"
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-center text-lg font-black uppercase text-zinc-900 dark:text-white outline-none focus:border-yellow-400 transition-colors shadow-lg"
          />
          <button type="submit" className="absolute right-2 top-2 bottom-2 bg-yellow-400 text-black px-6 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-300 transition-colors">
            <Search size={20}/>
          </button>
        </form>

        {error && (
          <div className="text-center p-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl font-bold text-xs uppercase animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {foundOrder && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Orden #{foundOrder.id}</span>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase mt-4 mb-1">Hola, {foundOrder.customerName.split(' ')[0]}</h2>
              <p className="text-xs text-zinc-500">Tu pedido tiene {foundOrder.items.length} items.</p>
            </div>

            <div className="space-y-8 relative">
              {/* Progress Line Background */}
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-100 dark:bg-zinc-800 -z-0"></div>
              
              {steps.map((step, idx) => {
                const currentIndex = getCurrentStepIndex(foundOrder.status);
                const isCompleted = idx <= currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={idx} className={`flex items-center gap-4 relative z-10 ${isCompleted ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${isCompleted ? 'bg-yellow-400 border-yellow-400 text-black' : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-300'}`}>
                      <step.icon size={16} strokeWidth={3}/>
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-widest ${isCurrent ? 'text-yellow-600 dark:text-yellow-500' : 'text-zinc-900 dark:text-white'}`}>{step.label}</p>
                      {isCurrent && <p className="text-[10px] text-zinc-500 mt-0.5">Estado Actual</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {foundOrder.deliveryMethod && (
               <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                   <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Método de Entrega</p>
                   <p className="text-sm font-bold text-zinc-900 dark:text-white">{foundOrder.deliveryMethod.replace('_', ' ')}</p>
                   {foundOrder.shippingTracking && (
                       <p className="text-xs font-mono text-blue-500 mt-1">Guía: {foundOrder.shippingTracking}</p>
                   )}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

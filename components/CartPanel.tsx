import React, {useEffect,useRef} from 'react';
import { useCartPanel } from '../contexts/CartContext';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';

const formatMXN=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2,minimumFractionDigits:0}).format(n);

interface CartItem {
  id: string;
  productName: string;
  colorName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  fontDetails?:React.ReactNode;
}

interface CartPanelProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  total: number;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  total
}) => {
  const { isCartOpen, setIsCartOpen } = useCartPanel();

  const panelRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!isCartOpen)return;
    const previous=document.activeElement as HTMLElement|null;
    const items=()=>Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)')||[]);
    items()[0]?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){e.preventDefault();setIsCartOpen(false);return;}
      if(e.key!=='Tab')return;
      const all=items(),first=all[0],last=all[all.length-1];if(!first)return;
      if(e.shiftKey&&(document.activeElement===first||!panelRef.current?.contains(document.activeElement))){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||!panelRef.current?.contains(document.activeElement))){e.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);previous?.focus();};
  },[isCartOpen,setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200]"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Panel */}
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="cart-panel-title" className="lm-cart-panel fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-[201] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 id="cart-panel-title" className="text-lg font-bold text-zinc-900 dark:text-white">Carrito</h2>
                <p className="text-xs text-zinc-500">
                  {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito"
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="lm-cart-items flex-1 min-h-0 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-zinc-300" />
              </div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                Carrito vacío
              </h3>
              <p className="text-xs text-zinc-500">
                Agrega productos desde el catálogo
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {cartItems.map((item) => (
                <div key={item.id} className="lm-cart-item p-4 flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-zinc-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-zinc-500">{item.colorName}</p><div className="mt-2">{item.fontDetails}</div>
                    <p className="text-sm font-black text-zinc-900 dark:text-white mt-1">
                      {formatMXN(item.price)} <span className="text-xs font-normal text-zinc-500">por pieza</span>
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="lm-cart-quantity flex items-center gap-2 mt-2" role="group" aria-label={`Cantidad de ${item.productName}`}>
                      <button 
                        aria-label={`Reducir cantidad de ${item.productName}`} onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                      <span aria-live="polite" className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button 
                        aria-label={`Aumentar cantidad de ${item.productName}`} onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button 
                    aria-label={`Quitar ${item.productName} del carrito`} onClick={() => onRemoveItem(item.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="lm-cart-footer p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-zinc-500">Total</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white">{formatMXN(total)}</span>
            </div>
            <button 
              onClick={() => {
                setIsCartOpen(false);
                onCheckout();
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Ir al pedido
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPanel;

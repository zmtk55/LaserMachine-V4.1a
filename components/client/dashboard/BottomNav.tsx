import React from 'react';
import { Home, Package, Grid3X3, Type, Ticket } from 'lucide-react';

type TabType = 'home' | 'orders' | 'fonts' | 'catalog' | 'coupons';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const items: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'orders', label: 'Pedidos', icon: Package },
  { id: 'catalog', label: 'Catálogo', icon: Grid3X3 },
  { id: 'fonts', label: 'Fuentes', icon: Type },
  { id: 'coupons', label: 'Cupones', icon: Ticket },
];

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingOrdersCount?: number;
  activeCouponsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingOrdersCount = 0,
  activeCouponsCount = 0,
}) => {
  const getBadge = (id: TabType) => {
    if (id === 'orders' && pendingOrdersCount > 0) return pendingOrdersCount;
    if (id === 'coupons' && activeCouponsCount > 0) return activeCouponsCount;
    return null;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50" />
      
      <nav className="relative max-w-lg mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {items.map((item) => {
            const isActive = activeTab === item.id;
            const badge = getBadge(item.id);
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[56px] cursor-pointer group"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active pill background */}
                <span
                  className={`absolute inset-x-1 inset-y-0 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-400/15 dark:bg-amber-400/20'
                      : 'bg-transparent group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800/50'
                  }`}
                />
                
                <div className="relative">
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors duration-200 ${
                      isActive
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                    }`}
                  />
                  {badge !== null && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-in fade-in zoom-in duration-200">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                
                <span
                  className={`mt-1 text-[10px] font-bold transition-colors duration-200 ${
                    isActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Safe area padding for mobile */}
      <div className="h-safe-area-inset-bottom bg-white/80 dark:bg-black/80 backdrop-blur-xl" />
    </div>
  );
};

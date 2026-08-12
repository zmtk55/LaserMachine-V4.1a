import React from 'react';
import { Package, Ticket, Type, Percent } from 'lucide-react';

interface EmptyStateProps {
  type: 'orders' | 'coupons' | 'fonts' | 'catalog' | 'generic';
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const configs = {
  orders: {
    icon: Package,
    defaultTitle: 'Sin pedidos aún',
    defaultDescription: '¡Haz tu primera compra y empieza a personalizar!',
    gradient: 'from-blue-500/20 to-purple-500/20',
  },
  coupons: {
    icon: Ticket,
    defaultTitle: 'No tienes cupones activos',
    defaultDescription: 'Vuelve pronto para nuevas promociones exclusivas',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  fonts: {
    icon: Type,
    defaultTitle: 'No hay fuentes disponibles',
    defaultDescription: 'Las fuentes se configuran desde el panel de administración',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  catalog: {
    icon: Package,
    defaultTitle: 'Catálogo vacío',
    defaultDescription: 'Pronto tendremos nuevos productos disponibles',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  generic: {
    icon: Percent,
    defaultTitle: 'No hay nada aquí',
    defaultDescription: 'Vuelve más tarde para ver nuevas actualizaciones',
    gradient: 'from-zinc-500/20 to-zinc-600/20',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  action,
}) => {
  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-5 shadow-lg`}
      >
        <Icon size={32} className="text-zinc-700 dark:text-zinc-300" />
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm font-medium text-zinc-500 max-w-[260px] mb-5">
        {description || config.defaultDescription}
      </p>
      {action}
    </div>
  );
};

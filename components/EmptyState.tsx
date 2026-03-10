import React from 'react';
import { Package, ClipboardList, Search, Users, ImageOff, Inbox, LucideIcon } from 'lucide-react';

export type EmptyStateType = 'orders' | 'products' | 'clients' | 'search' | 'gallery' | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

const defaultConfigs: Record<EmptyStateType, { icon: LucideIcon; title: string; message: string }> = {
  orders: {
    icon: ClipboardList,
    title: 'No hay órdenes',
    message: 'Aún no tienes órdenes registradas. Crea una nueva orden para comenzar.',
  },
  products: {
    icon: Package,
    title: 'Sin productos',
    message: 'No se encontraron productos. Agrega productos a tu inventario.',
  },
  clients: {
    icon: Users,
    title: 'Sin clientes',
    message: 'Aún no tienes clientes registrados. Los clientes aparecerán aquí automáticamente.',
  },
  search: {
    icon: Search,
    title: 'Sin resultados',
    message: 'No encontramos coincidencias para tu búsqueda. Intenta con otros términos.',
  },
  gallery: {
    icon: ImageOff,
    title: 'Galería vacía',
    message: 'No hay imágenes en esta categoría. Sube archivos para comenzar.',
  },
  generic: {
    icon: Inbox,
    title: 'Sin contenido',
    message: 'No hay elementos para mostrar en esta sección.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  message,
  actionLabel,
  onAction,
  icon: CustomIcon,
}) => {
  const config = defaultConfigs[type];
  const Icon = CustomIcon || config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={32} className="text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
        {displayTitle}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
        {displayMessage}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

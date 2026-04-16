import React from 'react';
import { OrderStatus } from '../../../types';
import { CheckCircle, PackageCheck, Zap, Sparkles, Clock4 } from 'lucide-react';

export interface StatusConfig {
  color: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  ring: string;
  shadow: string;
}

export const getStatusConfig = (status: OrderStatus): StatusConfig => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return {
        color: 'bg-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: CheckCircle,
        label: 'Entregado',
        description: 'Tu pedido fue entregado exitosamente',
        gradient: 'from-emerald-500/20 to-emerald-600/5',
        ring: 'ring-emerald-500/20',
        shadow: 'shadow-emerald-500/20',
      };
    case OrderStatus.READY:
      return {
        color: 'bg-sky-500',
        bg: 'bg-sky-50 dark:bg-sky-950/40',
        text: 'text-sky-700 dark:text-sky-400',
        border: 'border-sky-200 dark:border-sky-800',
        icon: PackageCheck,
        label: 'Listo para entrega',
        description: 'Puedes pasar a recoger tu pedido',
        gradient: 'from-sky-500/20 to-sky-600/5',
        ring: 'ring-sky-500/20',
        shadow: 'shadow-sky-500/20',
      };
    case OrderStatus.IN_PRODUCTION:
      return {
        color: 'bg-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        icon: Zap,
        label: 'En producción',
        description: 'Estamos personalizando tu producto',
        gradient: 'from-amber-500/20 to-amber-600/5',
        ring: 'ring-amber-500/20',
        shadow: 'shadow-amber-500/20',
      };
    case OrderStatus.WAITING_APPROVAL:
      return {
        color: 'bg-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        icon: Sparkles,
        label: 'Esperando tu aprobación',
        description: 'Revisa y aprueba el diseño',
        gradient: 'from-purple-500/20 to-purple-600/5',
        ring: 'ring-purple-500/20',
        shadow: 'shadow-purple-500/20',
      };
    default:
      return {
        color: 'bg-zinc-500',
        bg: 'bg-zinc-50 dark:bg-zinc-900/60',
        text: 'text-zinc-700 dark:text-zinc-400',
        border: 'border-zinc-200 dark:border-zinc-700',
        icon: Clock4,
        label: 'Recibido',
        description: 'Tu pedido está en cola',
        gradient: 'from-zinc-500/10 to-zinc-600/5',
        ring: 'ring-zinc-500/20',
        shadow: 'shadow-zinc-500/10',
      };
  }
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  pulse = false,
}) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-[11px] gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-2',
  };

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} ${pulse ? `animate-pulse ring-2 ${config.ring} ${config.shadow} shadow-[0_0_8px_-2px]` : ''}`}
    >
      {showIcon && <Icon size={iconSizes[size]} className={config.text} />}
      <span className={`${config.color} ${dotSizes[size]} rounded-full`} />
      {config.label}
    </span>
  );
};

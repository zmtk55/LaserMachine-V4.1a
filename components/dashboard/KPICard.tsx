import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  accent?: 'amber' | 'success' | 'danger' | 'info' | 'neutral';
  onClick?: () => void;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = 'neutral',
  onClick,
  className = ''
}) => {
  const getAccentStyles = () => {
    switch (accent) {
      case 'amber':
        return {
          iconBg: 'bg-system-accent',
          iconColor: 'text-amber-600',
          trendUp: 'text-amber-600',
          trendDown: 'text-amber-600',
          hoverBorder: 'hover:border-amber-400'
        };
      case 'success':
        return {
          iconBg: 'bg-system-success',
          iconColor: 'text-emerald-600',
          trendUp: 'text-emerald-600',
          trendDown: 'text-emerald-600',
          hoverBorder: 'hover:border-emerald-400'
        };
      case 'danger':
        return {
          iconBg: 'bg-system-error',
          iconColor: 'text-red-600',
          trendUp: 'text-red-600',
          trendDown: 'text-red-600',
          hoverBorder: 'hover:border-red-400'
        };
      case 'info':
        return {
          iconBg: 'bg-system-info',
          iconColor: 'text-blue-600',
          trendUp: 'text-blue-600',
          trendDown: 'text-blue-600',
          hoverBorder: 'hover:border-blue-400'
        };
      default:
        return {
          iconBg: 'bg-zinc-100 dark:bg-zinc-800',
          iconColor: 'text-zinc-600 dark:text-zinc-400',
          trendUp: 'text-emerald-600',
          trendDown: 'text-red-600',
          hoverBorder: 'hover:border-zinc-400'
        };
    }
  };

  const styles = getAccentStyles();

  const getTrendIcon = () => {
    if (!trend) return null;
    const iconClass = trend.value === 0 ? '' : trend.direction === 'up' ? styles.trendUp : styles.trendDown;
    
    if (trend.value === 0) {
      return <Minus size={14} className="text-zinc-400" />;
    }
    return trend.direction === 'up' ? (
      <TrendingUp size={14} className={iconClass} />
    ) : (
      <TrendingDown size={14} className={iconClass} />
    );
  };

  const getTrendClass = () => {
    if (!trend) return '';
    if (trend.value === 0) return 'text-zinc-500';
    return trend.direction === 'up' ? styles.trendUp : styles.trendDown;
  };

  return (
    <button
      onClick={onClick}
      className={`
        group relative overflow-hidden 
        bg-white dark:bg-zinc-900 
        border border-zinc-200 dark:border-zinc-800 
        rounded-xl p-4 
        text-left 
        transition-all duration-200 
        hover:shadow-md 
        ${styles.hoverBorder}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
      style={{
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Icon and Title Row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`
          p-2 rounded-lg 
          ${styles.iconBg}
          group-hover:scale-110 
          transition-transform duration-200
        `}>
          <span className={styles.iconColor}>
            {icon}
          </span>
        </div>
        
        {trend && (
          <div className={`
            flex items-center gap-1 
            text-xs font-medium
            ${getTrendClass()}
          `}>
            {getTrendIcon()}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
        {trend && (
          <p className="text-xs text-zinc-400">
            {trend.label}
          </p>
        )}
      </div>

      {/* Hover accent line */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-0.5 
        ${accent === 'amber' ? 'bg-amber-500' : ''}
        ${accent === 'success' ? 'bg-emerald-500' : ''}
        ${accent === 'danger' ? 'bg-red-500' : ''}
        ${accent === 'info' ? 'bg-blue-500' : ''}
        ${accent === 'neutral' ? 'bg-zinc-400' : ''}
        transform scale-x-0 group-hover:scale-x-100 
        transition-transform duration-300 origin-left
      `} />
    </button>
  );
};

export default KPICard;

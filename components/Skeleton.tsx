import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'text',
  width,
  height,
  count = 1
}) => {
  const baseClasses = 'animate-pulse bg-zinc-200 dark:bg-zinc-800';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const styles: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={styles}
        />
      ))}
    </>
  );
};

// Pre-built skeleton layouts for common use cases
export const OrderCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width={120} height={20} />
      <Skeleton variant="circular" width={32} height={32} />
    </div>
    <Skeleton variant="text" width="80%" height={16} />
    <div className="flex items-center gap-2 pt-2">
      <Skeleton variant="rounded" width={60} height={24} />
      <Skeleton variant="text" width={80} height={16} />
    </div>
  </div>
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
    <Skeleton variant="rectangular" width="100%" height={200} />
    <div className="p-4 space-y-2">
      <Skeleton variant="text" width={60} height={12} />
      <Skeleton variant="text" width="90%" height={20} />
      <div className="flex items-center justify-between pt-2">
        <Skeleton variant="text" width={80} height={24} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  </div>
);

export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="text" width={80} height={14} />
    </div>
    <Skeleton variant="text" width={100} height={28} />
  </div>
);

export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="60%" height={16} />
      <Skeleton variant="text" width="40%" height={12} />
    </div>
    <Skeleton variant="text" width={80} height={16} />
  </div>
);

export default Skeleton;

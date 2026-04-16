import React from 'react';
import { OrderStatus } from '../../../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface TimelineStep {
  label: string;
  status: OrderStatus;
}

const steps: TimelineStep[] = [
  { label: 'Recibido', status: OrderStatus.RECEIVED },
  { label: 'Producción', status: OrderStatus.IN_PRODUCTION },
  { label: 'Listo', status: OrderStatus.READY },
  { label: 'Entregado', status: OrderStatus.COMPLETED },
];

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  compact?: boolean;
}

const getStepIndex = (status: OrderStatus): number => {
  const idx = steps.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  currentStatus,
  compact = false,
}) => {
  const currentIndex = getStepIndex(currentStatus);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <React.Fragment key={step.label}>
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  isCompleted
                    ? isCurrent
                      ? 'w-6 bg-amber-500'
                      : 'w-4 bg-emerald-500'
                    : 'w-4 bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={step.label} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400'
                } ${isCurrent ? 'ring-4 ring-emerald-500/20 scale-110' : ''}`}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={14} />}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isCurrent
                    ? 'text-amber-500 font-semibold'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Progress bar background */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10 mx-4" />
      <div
        className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-400 -z-10 transition-all duration-500"
        style={{ width: `calc(${Math.min((currentIndex / (steps.length - 1)) * 100, 100)}% - 2rem)` }}
      />
    </div>
  );
};

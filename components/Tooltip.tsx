import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  shortcut?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  text, 
  position = 'bottom',
  shortcut 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-zinc-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-zinc-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-zinc-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-zinc-800',
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]} whitespace-nowrap`}>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-white text-xs font-medium rounded-lg shadow-lg">
            {text}
            {shortcut && (
              <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-[10px] font-mono">
                {shortcut}
              </kbd>
            )}
          </div>
          <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;

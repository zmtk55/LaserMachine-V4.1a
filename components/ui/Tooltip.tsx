import React from 'react';

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, className, ...props }) => {
  return (
    <div className="relative flex items-center" {...props}>
      {children}
      <div role="tooltip" className="absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap bg-black text-white text-xs py-1 px-2 rounded" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        {text}
      </div>
    </div>
  );
};

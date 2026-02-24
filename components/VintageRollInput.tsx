
import React from 'react';
import { Type } from 'lucide-react';

interface VintageRollInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  onActionClick?: () => void;
  actionIcon?: React.ReactNode;
  actionLabel?: string;
}

export const VintageRollInput: React.FC<VintageRollInputProps> = ({ 
  value, 
  onChange, 
  label = "TEXTO", 
  placeholder = "Escribe aquí...",
  className = "",
  onActionClick,
  actionIcon,
  actionLabel
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 transition-all focus-within:border-yellow-400 focus-within:ring-4 focus-within:ring-yellow-400/10">
            <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-white">
                    <Type size={14} />
                </div>
                <input 
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="
                        w-full 
                        pl-14 pr-4 py-3
                        bg-transparent
                        font-sans
                        font-bold
                        text-sm
                        text-zinc-900 dark:text-white
                        placeholder:text-zinc-400
                        outline-none
                        border-none
                        tracking-wide
                    "
                />
            </div>
          </div>
          
          {onActionClick && (
              <button 
                onClick={onActionClick} 
                className="
                    aspect-square h-auto 
                    bg-white dark:bg-zinc-800 
                    border-2 border-zinc-200 dark:border-zinc-700 
                    hover:border-yellow-400 dark:hover:border-yellow-400 
                    hover:bg-yellow-50 dark:hover:bg-yellow-900/10
                    text-zinc-900 dark:text-white 
                    rounded-2xl 
                    flex flex-col items-center justify-center gap-0.5
                    shadow-sm transition-all
                    active:scale-95
                    px-2 min-w-[3.5rem]
                "
                title={actionLabel}
              >
                  {actionIcon}
                  {actionLabel && <span className="text-[7px] font-black uppercase tracking-wider">{actionLabel}</span>}
              </button>
          )}
      </div>
      
      <div className="flex justify-between px-2 mt-1.5">
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
          <span className="text-[9px] font-bold text-zinc-300 dark:text-zinc-600">{value.length} chars</span>
      </div>
    </div>
  );
};

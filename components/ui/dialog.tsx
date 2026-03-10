import React, { useState, ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={() => onOpenChange(false)}>
      <div className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const DialogTrigger: React.FC<{ asChild?: boolean; children: ReactNode }> = ({ children }) => {
  // In this minimal implementation, just render children directly.
  return <>{children}</>;
};

export const DialogContent: React.FC<{ className?: string; children: ReactNode }> = ({ className = '', children }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const DialogHeader: React.FC<{ className?: string; children: ReactNode }> = ({ className = '', children }) => (
  <div className={`border-b pb-4 mb-4 ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<{ className?: string; children: ReactNode }> = ({ className = '', children }) => (
  <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
);

export const DialogDescription: React.FC<{ className?: string; children: ReactNode }> = ({ className = '', children }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

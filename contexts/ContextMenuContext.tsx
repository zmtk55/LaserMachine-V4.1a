import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ContextMenuState, ContextMenuItem, ContextMenuContextType } from '../types';

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

const initialState: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  items: [],
  targetData: undefined,
};

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ContextMenuState>(initialState);

  const showMenu = useCallback((
    position: { x: number; y: number },
    items: ContextMenuItem[],
    targetData?: any
  ) => {
    setState({
      isOpen: true,
      position,
      items,
      targetData,
    });
  }, []);

  const hideMenu = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) {
        hideMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, hideMenu]);

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (state.isOpen) {
        hideMenu();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [state.isOpen, hideMenu]);

  return (
    <ContextMenuContext.Provider value={{ state, showMenu, hideMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within ContextMenuProvider');
  }
  return context;
};

export default ContextMenuContext;

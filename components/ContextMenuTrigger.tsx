import React, { useCallback, useRef } from 'react';
import { ContextMenuItem } from '../types';
import { useContextMenu } from '../contexts/ContextMenuContext';

interface ContextMenuTriggerProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  data?: any;
  disabled?: boolean;
  className?: string;
}

const ContextMenuTrigger: React.FC<ContextMenuTriggerProps> = ({
  children,
  items,
  data,
  disabled = false,
  className = '',
}) => {
  const { showMenu } = useContextMenu();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    showMenu(
      { x: e.clientX, y: e.clientY },
      items,
      data
    );
  }, [disabled, items, data, showMenu]);

  // Handle long press for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      const touch = e.touches[0];
      showMenu(
        { x: touch.clientX, y: touch.clientY },
        items,
        data
      );
    }, 500); // 500ms for long press
  }, [disabled, items, data, showMenu]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Prevent default click behavior if it was a long press
    if (isLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <div
      className={className}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
};

export default ContextMenuTrigger;

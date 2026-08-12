import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { ContextMenuItem } from '../types';
import { useContextMenu } from '../contexts/ContextMenuContext';

// Dark mode colors for context menu (since it renders in a portal outside .dark scope)
const darkModeColors = {
  bgPrimary: '#030712',
  bgSecondary: '#0b1220',
  bgTertiary: '#111827',
  textPrimary: '#f3f4f6',
  textSecondary: '#9ca3af',
  textDanger: '#f87171',
  borderPrimary: '#1f2937',
  statusErrorBg: 'rgba(127, 29, 29, 0.3)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
};

const lightModeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textDanger: '#dc2626',
  borderPrimary: '#e5e7eb',
  statusErrorBg: 'rgba(254, 226, 226, 1)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
};

// Custom hook to detect dark mode
const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if dark class is present on initial render
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true; // Default to dark mode
  });

  useEffect(() => {
    // Initial check
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    // Create observer to watch for class changes on document.documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
};

interface ContextMenuItemComponentProps {
  item: ContextMenuItem;
  onClose: () => void;
  onSubmenuOpen: (submenuItems: ContextMenuItem[], position: { x: number; y: number }) => void;
  colors: typeof darkModeColors;
}

const ContextMenuItemComponent: React.FC<ContextMenuItemComponentProps> = ({ 
  item, 
  onClose, 
  onSubmenuOpen,
  colors 
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (item.disabled || item.submenu) return;
    item.onClick?.();
    onClose();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    
    if (item.submenu && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const newPosition = { x: rect.right - 4, y: rect.top - 4 };
      
      // Clear any existing timeout
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
      
      // Small delay before opening submenu
      submenuTimeoutRef.current = setTimeout(() => {
        onSubmenuOpen(item.submenu!, newPosition);
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }
  };

  if (item.id === 'separator') {
    return (
      <div 
        className="h-px my-1"
        style={{ 
          backgroundColor: colors.borderPrimary,
        }}
      />
    );
  }

  const getItemStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      color: item.disabled 
        ? colors.textSecondary 
        : item.danger 
          ? colors.textDanger 
          : colors.textPrimary,
      backgroundColor: isHovered 
        ? (item.danger ? colors.statusErrorBg : colors.bgTertiary)
        : 'transparent',
    };

    return baseStyles;
  };

  return (
    <div
      ref={itemRef}
      className={`
        flex items-center gap-3 px-3 py-2 text-sm cursor-pointer
        transition-colors duration-150 select-none
        ${item.disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : ''
        }
      `}
      style={getItemStyles()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="menuitem"
      aria-disabled={item.disabled}
      tabIndex={item.disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !item.disabled) {
          handleClick();
        }
      }}
    >
      {item.icon && (
        <span className="w-4 h-4 flex-shrink-0 opacity-70">
          {item.icon}
        </span>
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.shortcut && (
        <span className="text-xs opacity-50 ml-auto">{item.shortcut}</span>
      )}
      {item.submenu && (
        <ChevronRight size={14} className="opacity-50" />
      )}
    </div>
  );
};

const ContextMenu: React.FC = () => {
  const { state, hideMenu } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(state.position);
  const [activeSubmenu, setActiveSubmenu] = useState<{
    items: ContextMenuItem[];
    position: { x: number; y: number };
  } | null>(null);
  
  // Use custom hook to detect dark mode
  const isDarkMode = useDarkMode();
  const colors = isDarkMode ? darkModeColors : lightModeColors;

  // Adjust position to stay within viewport
  useEffect(() => {
    if (state.isOpen && menuRef.current) {
      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = state.position.x;
      let y = state.position.y;
      
      // Adjust horizontal position
      if (x + menuRect.width > viewportWidth - 16) {
        x = viewportWidth - menuRect.width - 16;
      }
      if (x < 16) x = 16;
      
      // Adjust vertical position
      if (y + menuRect.height > viewportHeight - 16) {
        y = viewportHeight - menuRect.height - 16;
      }
      if (y < 16) y = 16;
      
      setAdjustedPosition({ x, y });
    }
  }, [state.isOpen, state.position]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideMenu();
      }
    };

    if (state.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.isOpen, hideMenu]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isOpen) return;
      
      const menu = menuRef.current;
      if (!menu) return;
      
      const items = menu.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])');
      const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < items.length - 1) {
            (items[currentIndex + 1] as HTMLElement).focus();
          } else {
            (items[0] as HTMLElement).focus();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            (items[currentIndex - 1] as HTMLElement).focus();
          } else {
            (items[items.length - 1] as HTMLElement).focus();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (document.activeElement) {
            (document.activeElement as HTMLElement).click();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen]);

  const handleSubmenuOpen = (items: ContextMenuItem[], position: { x: number; y: number }) => {
    setActiveSubmenu({ items, position });
  };

  if (!state.isOpen) return null;

  const menuStyles: React.CSSProperties = {
    left: adjustedPosition.x,
    top: adjustedPosition.y,
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderPrimary}`,
    boxShadow: colors.shadowLg,
  };

  const submenuStyles: React.CSSProperties = {
    left: activeSubmenu?.position.x,
    top: activeSubmenu?.position.y,
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderPrimary}`,
    boxShadow: colors.shadowLg,
  };

  return createPortal(
    <>
      {/* Backdrop overlay - invisible but catches clicks */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={hideMenu}
        onContextMenu={(e) => {
          e.preventDefault();
          hideMenu();
        }}
      />
      
      {/* Main Menu */}
      <div
        ref={menuRef}
        className="fixed z-[9999] min-w-[180px] max-w-[280px] py-1 rounded-lg animate-context-menu"
        style={menuStyles}
        role="menu"
        aria-label="Context menu"
      >
        {state.items.map((item, index) => (
          <ContextMenuItemComponent
            key={item.id || index}
            item={item}
            onClose={hideMenu}
            onSubmenuOpen={handleSubmenuOpen}
            colors={colors}
          />
        ))}
      </div>

      {/* Submenu */}
      {activeSubmenu && (
        <div
          className="fixed z-[10000] min-w-[180px] max-w-[280px] py-1 rounded-lg animate-context-menu"
          style={submenuStyles}
          role="menu"
          onMouseLeave={() => setActiveSubmenu(null)}
        >
          {activeSubmenu.items.map((item, index) => (
            <ContextMenuItemComponent
              key={item.id || index}
              item={item}
              onClose={() => {
                hideMenu();
                setActiveSubmenu(null);
              }}
              onSubmenuOpen={handleSubmenuOpen}
              colors={colors}
            />
          ))}
        </div>
      )}
    </>,
    document.body
  );
};

export default ContextMenu;

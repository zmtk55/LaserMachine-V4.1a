# Context Menu System - Documentación

## Resumen

El sistema de Context Menu (menú de clic derecho) está implementado y funcionando correctamente con soporte para dark mode.

## Arquitectura

### Archivos del Sistema

| Archivo | Propósito |
|---------|-----------|
| `components/ContextMenu.tsx` | Componente principal que renderiza el menú en un portal |
| `contexts/ContextMenuContext.tsx` | Context para manejar el estado global del menú |
| `components/ContextMenuTrigger.tsx` | HOC para agregar context menu a componentes |
| `types.ts` | Interfaces TypeScript para el sistema |

### Cómo Funciona

1. **ContextMenuProvider** envuelve la aplicación en `App.tsx`
2. **useContextMenu()** hook permite acceder a `showMenu()` y `hideMenu()`
3. El menú se renderiza en un **portal** directamente en `document.body`
4. **MutationObserver** detecta cambios en la clase `.dark` para aplicar estilos correctos

## Ubicaciones Activas del Context Menu

| Componente | Elemento | Acciones Disponibles |
|------------|----------|---------------------|
| `AdminDashboard.tsx` | Tarjetas de órdenes | Ver, Editar, Prioridad, WhatsApp, Eliminar |
| `AdminDashboard.tsx` | Lista de productos | Editar, Duplicar, Eliminar |
| `AdminDashboard.tsx` | Lista de clientes | Ver perfil, Editar, Ver historial |
| `CartPanel.tsx` | Items del carrito | Editar, Duplicar, Eliminar |
| `ProductVisualizer.tsx` | Elementos de diseño | Editar, Mover, Duplicar, Eliminar |
| `InventoryManager.tsx` | Productos | Editar, Ajustar stock, Duplicar, Eliminar |
| `ImageGallery.tsx` | Imágenes | Seleccionar, Ver, Copiar URL, Descargar |
| `CouponManager.tsx` | Cupones | Activar/Desactivar, Duplicar, Copiar código, Eliminar |

## Cómo Agregar Context Menu a un Componente

```tsx
import { useContextMenu } from '../contexts/ContextMenuContext';

const MyComponent = () => {
  const { showMenu } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent, item: MyItem) => {
    e.preventDefault();
    
    const menuItems = [
      {
        id: 'edit',
        label: 'Editar',
        icon: <Edit size={14} />,
        onClick: () => handleEdit(item),
      },
      {
        id: 'separator1',
        label: '', // Separator
      },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => handleDelete(item),
      },
    ];
    
    showMenu({ x: e.clientX, y: e.clientY }, menuItems, item);
  };

  return (
    <div onContextMenu={(e) => handleContextMenu(e, item)}>
      {/* content */}
    </div>
  );
};
```

## Opciones de Menu Items

```typescript
interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;      // Estilo rojo para acciones peligrosas
  disabled?: boolean;    // Deshabilita el item
  shortcut?: string;     // Muestra atajo de teclado
  submenu?: ContextMenuItem[]; // Submenú anidado
}
```

## Dark Mode

El menú detecta automáticamente el modo oscuro usando un `MutationObserver` en `document.documentElement`. Los colores se aplican directamente sin depender de variables CSS.

### Colores

```typescript
// Dark mode
const darkModeColors = {
  bgPrimary: '#030712',
  bgTertiary: '#111827',
  textPrimary: '#f3f4f6',
  textDanger: '#f87171',
  borderPrimary: '#1f2937',
};

// Light mode
const lightModeColors = {
  bgPrimary: '#ffffff',
  bgTertiary: '#f3f4f6',
  textPrimary: '#111827',
  textDanger: '#dc2626',
  borderPrimary: '#e5e7eb',
};
```

## Características

- ✅ Soporte completo para dark mode
- ✅ Navegación por teclado (Arrow keys, Enter, Escape)
- ✅ Submenús anidados
- ✅ Posicionamiento automático dentro del viewport
- ✅ Cierre al hacer click fuera o scroll
- ✅ Touch devices (long press)
- ✅ Accesibilidad (ARIA attributes)

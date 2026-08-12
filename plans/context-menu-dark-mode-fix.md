# Plan: Corrección de Dark Mode en Context Menu

## Problema Identificado

El menú contextual se renderiza usando `createPortal(menuContent, document.body)`, lo que coloca el menú **fuera** del árbol de componentes de React donde se aplica la clase `.dark`.

```
document.body
├── div.min-h-screen.dark (aquí está la clase .dark)
│   └── ... resto de la app
└── div.context-menu-portal (aquí se renderiza el menú - SIN clase .dark)
```

Por lo tanto, las variables CSS como `var(--bg-primary)` siempre toman los valores de `:root` (modo claro) y nunca los de `.dark`.

## Solución Propuesta

### Opción 1: Detectar Dark Mode y Aplicar Estilos Directos (RECOMENDADA)

Modificar `ContextMenu.tsx` para:
1. Detectar si dark mode está activo usando `document.documentElement.classList.contains('dark')`
2. Aplicar estilos inline condicionales basados en el estado de dark mode
3. Usar colores directos en lugar de variables CSS

**Ventajas:**
- No requiere cambios en otros archivos
- Funciona independientemente de dónde se renderice el portal
- Mantiene consistencia visual con el resto de la app

**Implementación:**
```tsx
// En ContextMenu.tsx
const [isDarkMode, setIsDarkMode] = useState(false);

useEffect(() => {
  // Detectar dark mode inicial
  setIsDarkMode(document.documentElement.classList.contains('dark'));
  
  // Observer para cambios en la clase dark
  const observer = new MutationObserver(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  return () => observer.disconnect();
}, []);
```

### Opción 2: Agregar Clase .dark al Portal

Modificar el portal para incluir la clase `.dark` cuando corresponda:

```tsx
// En el portal
<div 
  ref={menuRef}
  className={`... ${isDarkMode ? 'dark' : ''}`}
  style={{ ... }}
>
```

**Desventaja:** Requiere duplicar la lógica de detección de dark mode.

## Ubicaciones Activas del Context Menu

Actualmente el context menu está integrado en:

| Componente | Elemento | Acciones Disponibles |
|------------|----------|---------------------|
| `AdminDashboard.tsx` | Tarjetas de órdenes | Ver, Editar, Prioridad, WhatsApp, Eliminar |
| `AdminDashboard.tsx` | Lista de productos (tab inventario) | Editar, Duplicar, Eliminar |
| `AdminDashboard.tsx` | Lista de clientes | Ver perfil, Editar, Ver historial |
| `CartPanel.tsx` | Items del carrito | Editar, Duplicar, Eliminar |
| `ProductVisualizer.tsx` | Elementos de diseño | Editar, Mover, Duplicar, Eliminar |
| `InventoryManager.tsx` | Productos | Editar, Ajustar stock, Duplicar, Eliminar |

## Ubicaciones Potenciales para Agregar

| Componente | Elemento | Acciones Sugeridas |
|------------|----------|-------------------|
| `ImageGallery.tsx` | Imágenes | Ver, Descargar, Eliminar, Copiar URL |
| `CouponManager.tsx` | Cupones | Editar, Desactivar, Duplicar, Ver uso |
| `ContentManager.tsx` | Contenido | Editar, Vista previa, Eliminar |
| `NotificationPanel.tsx` | Notificaciones | Marcar leída, Eliminar, Acciones rápidas |

## Archivos a Modificar

1. **`components/ContextMenu.tsx`** - Agregar detección de dark mode y estilos condicionales

## Pasos de Implementación

1. [ ] Agregar estado `isDarkMode` en `ContextMenu.tsx`
2. [ ] Implementar `MutationObserver` para detectar cambios en la clase dark
3. [ ] Reemplazar variables CSS por estilos inline condicionales
4. [ ] Probar en modo claro y oscuro
5. [ ] Verificar que los cambios de tema se reflejen en tiempo real

## Código de Referencia para Colores

```css
/* Modo Claro */
--bg-primary: #ffffff
--bg-tertiary: #f3f4f6
--text-primary: #111827
--text-danger: #dc2626
--border-primary: #e5e7eb

/* Modo Oscuro */
--bg-primary: #030712
--bg-tertiary: #111827
--text-primary: #f3f4f6
--text-danger: #f87171
--border-primary: #1f2937
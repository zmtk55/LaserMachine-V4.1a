# Plan: Corrección de Navegación y Mejora de Iconos en AdminDashboard

## Problemas Identificados

### 1. Falta de Navegación Móvil
**Ubicación:** [`AdminDashboard.tsx`](components/AdminDashboard.tsx:1210-1255)

**Problema:**
- El sidebar tiene la clase `hidden md:flex` (línea 1213), lo que lo oculta completamente en pantallas móviles
- El header solo muestra contenido cuando `activeTab === 'ORDERS'` (línea 1255)
- No existe ningún mecanismo de navegación para móvil (no hay menú hamburguesa, bottom nav, ni tabs)

**Impacto:**
- En móvil, cuando el usuario está en FONTS u otra sección, no puede navegar a otras partes de la aplicación
- La única forma de cambiar de sección es recargando la página

### 2. Iconos del Sidebar Mejorables
**Ubicación:** [`AdminDashboard.tsx`](components/AdminDashboard.tsx:1216-1233)

**Estado actual:**
- Iconos básicos de Lucide con tamaño 28px
- Sin animaciones hover sofisticadas
- Sin indicadores visuales adicionales

---

## Solución Propuesta

### Parte 1: Agregar Navegación Móvil

#### Opción A: Bottom Navigation (Recomendada)
Implementar una barra de navegación inferior fija para móvil, similar a apps móviles nativas.

```tsx
{/* Mobile Bottom Navigation */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-50 safe-area-pb">
  <div className="flex justify-around items-center h-16">
    {[
      { id: 'DASHBOARD', icon: BarChart3, label: 'Home' },
      { id: 'ORDERS', icon: LayoutDashboard, label: 'Pedidos' },
      { id: 'INVENTORY', icon: Package, label: 'Inventario' },
      { id: 'CLIENTS', icon: Users, label: 'Clientes' },
      { id: 'SETTINGS', icon: Settings, label: 'Más' },
    ].map(item => (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`flex flex-col items-center justify-center flex-1 h-full ${
          activeTab === item.id ? 'text-amber-500' : 'text-zinc-400'
        }`}
      >
        <item.icon size={20} />
        <span className="text-[10px] mt-1">{item.label}</span>
      </button>
    ))}
  </div>
</nav>
```

#### Opción B: Menú Hamburguesa con Drawer
Agregar un botón hamburguesa en el header que abra un drawer lateral.

#### Opción C: Header con Tabs Desplegables
Mostrar un selector de sección en el header para móvil.

---

### Parte 2: Mejora de Iconos del Sidebar

#### Mejoras Propuestas:

1. **Iconos más grandes con contenedor:**
```tsx
<button className={`w-16 h-16 flex flex-col items-center justify-center rounded-2xl transition-all ${
  activeTab === item.id 
    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
    : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
}`}>
  <item.icon size={24} />
  <span className="text-[9px] mt-1 font-medium">{item.label}</span>
</button>
```

2. **Animaciones hover mejoradas:**
```tsx
className={`... transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
```

3. **Indicador activo más prominente:**
```tsx
{activeTab === item.id && (
  <div className="absolute left-0 w-1 h-8 bg-amber-500 rounded-r-full" />
)}
```

4. **Iconos SVG personalizados (opcional):**
   - Usar los iconos existentes en `/public/assets/icons/`
   - Crear iconos personalizados para cada sección

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `components/AdminDashboard.tsx` | Agregar navegación móvil y mejorar iconos sidebar |
| `src/styles/design-tokens.css` | (Opcional) Agregar estilos para navegación móvil |

---

## Detalles de Implementación

### Navegación Móvil - Bottom Nav

**Ubicación:** Después del cierre de `</main>` y antes del cierre del return (aproximadamente línea 5800+)

**Características:**
- Fija en la parte inferior
- Visible solo en móvil (`md:hidden`)
- 5 secciones principales (para no sobrecargar)
- Indicador activo con color amber-500
- Safe area para dispositivos con notch

### Sidebar Desktop - Iconos Mejorados

**Ubicación:** Líneas 1216-1233

**Cambios:**
1. Agregar etiquetas de texto debajo de iconos
2. Mejorar animaciones hover
3. Agregar indicador visual de sección activa
4. Aumentar tamaño de botones de w-14 h-14 a w-16 h-16

---

## Tareas de Implementación

- [ ] Agregar estado para menú móvil (si se usa drawer)
- [ ] Implementar Bottom Navigation para móvil
- [ ] Agregar padding-bottom al contenido principal para móvil
- [ ] Mejorar iconos del sidebar desktop
- [ ] Agregar animaciones hover
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Verificar navegación en todas las secciones

---

## Consideraciones

1. **Rendimiento:** Las animaciones deben usar `transform` y `opacity` para evitar reflows
2. **Accesibilidad:** Los botones deben tener `aria-label` apropiados
3. **Safe Areas:** Usar `safe-area-pb` para dispositivos con home indicator
4. **Dark Mode:** Todos los estilos deben tener variantes dark mode
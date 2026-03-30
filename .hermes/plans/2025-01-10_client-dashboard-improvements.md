# Plan: Client Dashboard al 100%

**Fecha:** 2025-01-10  
**Proyecto:** LaserMachine V4.1a  
**Área:** ClientDashboard - Mejoras completas

---

## 🎯 OBJETIVO

Transformar el dashboard de clientes de 20% a 100% con:
1. Sistema de puntos completo (ganar + canjear)
2. Aprobación de mockups integrada
3. Sección de fuentes profesional (como el admin)
4. Métricas y gamificación

---

## 📊 ESTADO ACTUAL

### Lo que funciona:
- ✅ 5 tabs básicos (Home, Orders, Catalog, Fonts, Coupons)
- ✅ Welcome card con puntos
- ✅ 3 quick stats (Pedidos, Completados, En proceso)
- ✅ Lista de pedidos básica
- ✅ Banners y promociones

### Limitaciones:
- ❌ Puntos: solo visualización, sin lógica de ganar/canjear
- ❌ Mockups: no hay aprobación integrada
- ❌ Fuentes: solo grid básico, sin filtros ni preview interactivo
- ❌ No hay gamificación ni niveles
- ❌ No hay historial de puntos

---

## 🚀 FASE 1: SISTEMA DE PUNTOS COMPLETO (Prioridad: ALTA)

### 1.1 Cálculo Automático de Puntos

**Ganar puntos:**
```typescript
// 1 punto por cada $10 de compra (después de registrar pago)
const pointsEarned = Math.floor(orderTotal / 10);

// Bonus por pedidos completados
const completionBonus = 50; // puntos extra

// Total = base + bonus
```

**Implementación:**
- Hook `useLaserPoints` para calcular y guardar puntos
- Actualizar puntos cuando `order.status === COMPLETED`
- Historial de transacciones de puntos

### 1.2 Canje de Puntos en Checkout

**Fórmula de conversión:**
```
100 puntos = $10 de descuento
1 punto = $0.10
```

**UI en checkout:**
```
┌─────────────────────────────────────┐
│ 💰 Canjear Puntos                   │
│                                     │
│ Tienes: 1,240 pts ($124)           │
│                                     │
│ Usar: [______] pts                 │
│       = $12.40 de descuento        │
│                                     │
│ [Canjear]  [Cancelar]              │
└─────────────────────────────────────┘
```

### 1.3 Historial de Puntos

Nueva sección en Home:
```
┌─────────────────────────────────────┐
│ 📊 Historial de Puntos              │
├─────────────────────────────────────┤
│ +100 pts  Pedido #1234  Hoy        │
│ +50 pts   Bonus         Ayer       │
│ -200 pts  Canjeo        15 Mar     │
└─────────────────────────────────────┘
```

---

## 🚀 FASE 2: APROBACIÓN DE MOCKUPS (Prioridad: ALTA)

### 2.1 Estado "Esperando Aprobación"

Cuando un pedido está en `WAITING_APPROVAL`:

```
┌─────────────────────────────────────┐
│ ⏳ Esperando tu aprobación          │
│                                     │
│ [📷 Ver Mockup]                     │
│                                     │
│ ¿Te gusta el diseño?                │
│                                     │
│ [✅ Sí, aprobar]  [📝 Cambios]     │
│                                     │
│ ¿Dudas? Escríbenos por WhatsApp →   │
└─────────────────────────────────────┘
```

### 2.2 Vista de Mockup

Modal ampliado:
```
┌────────────────────────────────────────────────────┐
│ Mockup del Pedido #1234                    [X]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  [IMAGEN GRANDE DEL MOCKUP]                       │
│                                                    │
│  Detalles:                                        │
│  • Fuente: Arial Bold                             │
│  • Texto: "Mi Empresa"                            │
│  • Color: Negro                                   │
│                                                    │
│  [✅ Aprobar Diseño]                              │
│                                                    │
│  ¿Necesitas cambios?                              │
│  [💬 WhatsApp]  [📧 Email]                        │
└────────────────────────────────────────────────────┘
```

### 2.3 Integración WhatsApp

Botón directo con mensaje predefinido:
```
https://wa.me/521XXXXXXXXXX?text=
Hola, soy Juan Pérez. 
Quiero solicitar cambios en el mockup 
del pedido #1234.
```

---

## 🚀 FASE 3: SECCIÓN DE FUENTES PROFESIONAL (Prioridad: ALTA)

### 3.1 Nuevo Diseño (Como el Admin)

Reemplazar la grilla simple con:

```
┌────────────────────────────────────────────────────────────┐
│ FUENTES DISPONIBLES                              🔍 [___] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Categorías: [Todas] [Serif] [Sans] [Script] [Display]     │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📝 Vista Previa                                     │   │
│ │                                                     │   │
│ │ [Escribe aquí para probar...                 ]      │   │
│ │                                                     │   │
│ │ Tamaño: [12px] [24px] [48px] [72px]              │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ Resultados (24):                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Arial Bold                              SANS SERIF  │   │
│ │                                                     │   │
│ │ Mi texto de prueba va aquí                         │   │
│ │                                                     │   │
│ │ [Ver detalles]  [Usar en pedido]                   │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ ... más fuentes ...                                       │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Features

- **Búsqueda en tiempo real** por nombre
- **Filtros por categoría** (Serif, Sans, Script, Display)
- **Preview interactivo** con texto personalizable
- **Cambio de tamaño** (12px, 24px, 48px, 72px)
- **Vista detallada** con caracteres especiales
- **Botón "Usar en pedido"** (redirige a catálogo con fuente seleccionada)

### 3.3 Categorías Visuales

Cada fuente muestra:
- Nombre
- Categoría (badge)
- Preview del texto ingresado
- Preview de caracteres: Aa Bb Cc 123
- Botones de acción

---

## 🚀 FASE 4: MEJORAS ADICIONALES (Prioridad: MEDIA)

### 4.1 Gamificación - Niveles

```
┌─────────────────────────────────────┐
│ 🏆 Tu Nivel: PLATA                  │
│                                     │
│ [##########------------] 45%        │
│ 4,500 / 10,000 pts para ORO         │
│                                     │
│ Beneficios Plata:                   │
│ • 5% descuento en todos los pedidos │
│ • Envío gratis >$500                │
│ • Prioridad en soporte              │
└─────────────────────────────────────┘
```

**Niveles:**
- Bronce: 0-2,999 pts (inicio)
- Plata: 3,000-9,999 pts (5% desc)
- Oro: 10,000-24,999 pts (10% desc)
- Platino: 25,000+ pts (15% desc + beneficios VIP)

### 4.2 Timeline de Pedido

```
┌─────────────────────────────────────┐
│ 📦 Seguimiento del Pedido #1234     │
├─────────────────────────────────────┤
│                                     │
│  ✅ Recibido        20 Mar, 10:00  │
│  │                                  │
│  ✅ En Producción   21 Mar, 14:30  │
│  │                                  │
│  ⏳ Esperando       22 Mar, 09:00  │
│     aprobación                     │
│  ○                                 │
│  ○ Listo            (pendiente)    │
│  ○ Entregado        (pendiente)    │
│                                     │
└─────────────────────────────────────┘
```

### 4.3 Notificaciones Push

- Pedido recibido
- Mockup listo (para aprobar)
- Pedido en producción
- Pedido listo
- Puntos ganados
- Nueva promoción

---

## 📁 ARCHIVOS A MODIFICAR/CREAR

### Modificar:
1. **`components/ClientDashboard.tsx`**
   - Agregar sistema de puntos completo
   - Mejorar sección de fuentes
   - Agregar aprobación de mockups
   - Timeline de pedidos

2. **`types.ts`** (si es necesario)
   - Agregar tipos para transacciones de puntos

3. **`services/pointsService.ts`** (nuevo)
   - Lógica de cálculo y canje de puntos

### Nuevos Componentes:
1. **`components/client/FontShowcase.tsx`**
   - Sección de fuentes profesional

2. **`components/client/MockupApproval.tsx`**
   - Aprobación de mockups

3. **`components/client/OrderTimeline.tsx`**
   - Timeline visual de pedidos

4. **`components/client/PointsHistory.tsx`**
   - Historial de puntos

5. **`components/client/LoyaltyCard.tsx`**
   - Card de nivel y progreso

---

## ⏱️ ESTIMACIÓN DE TIEMPO

| Fase | Tiempo | Prioridad |
|------|--------|-----------|
| Fase 1: Sistema de Puntos | 3-4h | 🔴 ALTA |
| Fase 2: Aprobación Mockups | 2-3h | 🔴 ALTA |
| Fase 3: Fuentes Profesional | 3-4h | 🔴 ALTA |
| Fase 4: Gamificación | 2-3h | 🟡 MEDIA |
| **TOTAL** | **10-14h** | |

---

## ✅ CRITERIOS DE ÉXITO

1. ✅ Cliente gana puntos automáticamente al completar pedido
2. ✅ Cliente puede canjear puntos en checkout
3. ✅ Cliente puede aprobar/rechazar mockups desde el dashboard
4. ✅ Sección de fuentes tiene búsqueda, filtros y preview
5. ✅ Timeline muestra progreso visual del pedido
6. ✅ Diseño responsive y consistente con tokens CSS

---

## 🚀 PRÓXIMOS PASOS

1. **Aprobación del plan** por parte del cliente
2. **Decidir orden** de implementación (fase por fase o todo junto)
3. **Empezar desarrollo** con Fase 1

---

¿Aprobamos el plan y empezamos con la Fase 1?

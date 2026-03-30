# LaserMachine + Strapi - Guía de Setup

## ✅ FASE 1 - Estructura Creada

Se ha creado la estructura completa del backend de Strapi en:
```
/Users/julianarocha/Projects/LaserMachine-V4.1a/strapi-backend/
```

### Content Types Creados:

1. **Product** - Productos (YETI, STANLEY, HYDROFLASK, etc.)
2. **ProductColor** - Colores de productos con stock
3. **Order** - Órdenes de clientes
4. **OrderItem** - Items dentro de cada orden
5. **Coupon** - Cupones de descuento
6. **StoreConfig** - Configuración global de la tienda

### Estructura de Archivos:
```
strapi-backend/
├── config/
│   ├── admin.js
│   ├── api.js
│   ├── database.js
│   ├── middlewares.js
│   ├── plugins.js
│   └── server.js
├── src/
│   ├── api/
│   │   ├── coupon/
│   │   ├── order/
│   │   ├── order-item/
│   │   ├── product/
│   │   ├── product-color/
│   │   └── store-config/
│   └── index.js
├── package.json
├── tsconfig.json
└── .env
```

---

## 🚀 Pasos para Completar (Manual)

### Paso 1: Re-crear proyecto con Strapi CLI

El problema actual es la configuración de base de datos. La forma más fácil de arreglarlo es:

```bash
cd /Users/julianarocha/Projects/LaserMachine-V4.1a
rm -rf strapi-backend

# Crear nuevo proyecto con Strapi CLI
npx create-strapi-app@latest strapi-backend --quickstart
```

Cuando pregunte por la cuenta de Strapi, elige **"Skip"** para modo desarrollo local.

### Paso 2: Copiar los Content Types

Una vez creado el proyecto base, copiar los archivos de content types:

```bash
# Copiar los schemas de content types
cp -r /Users/julianarocha/Projects/LaserMachine-V4.1a/strapi-BACKUP/src/api/* \
       /Users/julianarocha/Projects/LaserMachine-V4.1a/strapi-backend/src/api/
```

### Paso 3: Iniciar Strapi

```bash
cd /Users/julianarocha/Projects/LaserMachine-V4.1a/strapi-backend
npm run develop
```

- Abre http://localhost:1337/admin
- Crea tu cuenta de administrador
- Ve a "Content-Type Builder" para verificar que todos los content types están

### Paso 4: Configurar Permisos

En el admin de Strapi:

1. **Settings > Users & Permissions Plugin > Roles**
2. Editar rol **Public** (acceso sin autenticar):
   - Products: find, findOne
   - Store-config: find
   - Orders: create (para crear ordenes)
   - Coupons: validate

3. Editar rol **Authenticated** (usuarios logueados):
   - Products: find, findOne
   - Orders: find, findOne, create, update (sus propias ordenes)
   - Store-config: find

### Paso 5: Crear datos iniciales

En el admin de Strapi:

1. **Store Config** (Single Type):
   - businessName: "LASERMACHINE"
   - accentColor: "#f59e0b"
   - nextOrderId: 1000
   - whatsapp: "526371247095"
   - baseEngravingPrice: 100
   - extraSidePrice: 50

2. **Products**:
   Crear los productos que están en `/src/constants.ts`:
   - YETI Rambler 20oz
   - YETI Travel Mug 30oz
   - STANLEY Quencher 40oz
   - HYDROFLASK Wide Mouth 32oz
   - etc.

---

## 📡 Endpoints API Disponibles

Una vez iniciado, tendrás estos endpoints:

### Products
- `GET /api/products` - Lista de productos
- `GET /api/products/:id` - Producto específico
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)

### Orders
- `GET /api/orders` - Lista de órdenes
- `GET /api/orders/:id` - Orden específica
- `POST /api/orders` - Crear orden
- `PUT /api/orders/:id/status` - Actualizar estado
- `GET /api/orders/tracking/:trackingId` - Buscar por tracking

### Coupons
- `GET /api/coupons` - Lista de cupones
- `POST /api/coupons/validate` - Validar cupón
- `POST /api/coupons/apply` - Aplicar cupón

### Store Config
- `GET /api/store-config` - Configuración de la tienda

---

## 🔧 FASE 2 - Migrar Datos (Pendiente)

Script para migrar desde Firebase:

```bash
cd /Users/julianarocha/Projects/LaserMachine-V4.1a
node migrate-firebase-to-strapi.js
```

Este script:
1. Exporta productos de Firebase
2. Crea órdenes en Strapi
3. Migra configuración de tienda

---

## 🔌 FASE 3 - Frontend React (Pendiente)

Modificar el frontend para usar Strapi API:

1. Crear servicio API (`src/services/strapiApi.ts`)
2. Reemplazar llamadas a Firebase por llamadas a Strapi
3. Implementar autenticación JWT

---

## 🏭 Producción (Railway/Render)

### Opción A: Railway (Recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y crear proyecto
railway login
railway init

# Configurar variables de entorno en Railway Dashboard
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secreto-jwt
ADMIN_JWT_SECRET=tu-secreto-admin

# Deploy
railway up
```

### Opción B: Render

1. Crear cuenta en render.com
2. Crear PostgreSQL database
3. Crear Web Service con:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables:
     - `DATABASE_URL` (de la DB creada)
     - `JWT_SECRET`
     - `ADMIN_JWT_SECRET`

---

## 📁 Archivos Backup

Los archivos del intento actual están en:
```
/Users/julianarocha/Projects/LaserMachine-V4.1a/strapi-backend/
```

Si necesitas rehacer todo, los schemas de content types están en:
```
strapi-backend/src/api/*/content-types/*/schema.json
```

---

## ❓ Soporte

Si tienes problemas:

1. Verificar versión de Node: `node --version` (necesitas 18-20)
2. Limpiar cache: `rm -rf node_modules .cache dist`
3. Reinstalar: `npm install`
4. Ver logs: `npm run develop -- --debug`

---

**Estado Actual:** Estructura completa, pendiente iniciar servidor con CLI oficial de Strapi.

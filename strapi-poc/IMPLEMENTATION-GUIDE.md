# Guía de Implementación Paso a Paso

## Fase 1: Setup Strapi Local (15 min)

```bash
# 1. Crear proyecto Strapi en carpeta hermana
 cd ..
 npx create-strapi-app@latest laser-cms --quickstart
 
 # 2. Esperar instalación y crear cuenta admin
 # Se abrirá automáticamente http://localhost:1337/admin
 
 # 3. Crear API Token
 # Settings → API Tokens → Create new
 # Token type: Full access
 # Copy token para .env
```

## Fase 2: Crear Collections en Strapi (20 min)

### 1. Products (Content-Type Builder)
```
Display name: Product
Plural: Products

Attributes:
- name (Text, required)
- slug (UID, attached to name)
- description (Rich Text)
- basePrice (Number, decimal, required)
- brand (Enumeration: YETI, Stanley, HydroFlask, Owala, Generic)
- category (Text)
- inStock (Boolean, default: true)
- isActive (Boolean, default: true)
- images (Media, multiple)
```

### 2. Component: Color Option
```
Category: product
Display name: color-option

Attributes:
- name (Text, required)
- hexCode (Text, required)
- priceModifier (Number, decimal, default: 0)
- image (Media, single)
```

### 3. Agregar colors a Product
```
Products → Edit → Add another field
- Component, name: colors
- Repeatable component: product.color-option
```

### 4. Templates (ya lo teníamos)
```
Reusar schema del README.md anterior
```

### 5. Relación Product ↔ Templates
```
Products → Edit → Add another field
- Relation: Product has many Templates
- Name: availableTemplates
```

## Fase 3: Crear Datos de Prueba (10 min)

### 1. Crear 1 Producto
```
Content Manager → Products → Create

Name: YETI Rambler 30oz
Slug: yeti-rambler-30oz
Base Price: 450
Brand: YETI
Category: Tumbler

Colors (add 2):
- Name: Stainless, Hex: #C4C4C4
- Name: Black, Hex: #1a1a1a, Price Modifier: 0

Available Templates: (dejar vacío por ahora)
```

### 2. Crear 1 Template
```
Content Manager → Templates → Create

Name: El Rey
Occasion: fathers-day
Texts (add 2):
- Content: REY, Font: Bebas Neue, Size: 1.5, Y: 35
- Content: PAPÁ, Font: Plus Jakarta Sans, Size: 1, Y: 65

Tags: popular, padre
Is Active: true
```

### 3. Relacionar
```
Volver al Producto YETI
Available Templates: seleccionar "El Rey"
Save
```

## Fase 4: Integrar en Tu Branch (30 min)

### 1. Copiar archivos
```bash
cp strapi-poc/useStrapiProduct.ts src/hooks/
cp strapi-poc/DesignTemplates-Strapi.tsx src/components/
```

### 2. Crear .env.local
```bash
# .env.local
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=your_token_here
```

### 3. Modificar componente donde cargas producto
```typescript
// Antes (ejemplo)
import { PRODUCTS } from '../constants';

const ProductPage = ({ id }) => {
  const product = PRODUCTS.find(p => p.id === id);
  // ...
};

// Después
import { useStrapiProduct } from '../hooks/useStrapiProduct';

const ProductPage = ({ id }) => {
  const { product, templates, isLoading } = useStrapiProduct(id);
  
  if (isLoading) return <Spinner />;
  if (!product) return <NotFound />;
  
  // product ahora viene de Strapi!
  // templates son los templates disponibles para este producto
  // ...
};
```

### 4. Modificar selector de fuentes
```typescript
// Antes
import { FONTS } from '../constants';

// Después
import { useStrapiFonts } from '../hooks/useStrapiProduct';

const { fonts, isLoading } = useStrapiFonts();
// fonts viene de Strapi con @font-face inyectado
```

## Fase 5: Test (10 min)

### 1. Verificar API
```bash
curl http://localhost:1337/api/products/1?populate=*
```
Debe retornar JSON con producto y templates.

### 2. Verificar en React
- Abrir tu app
- Ir a producto YETI
- Ver que carga nombre, precio, colores
- Ver que templates disponibles incluyen "El Rey"

### 3. Probar aplicar template
- Click en "Templates"
- Seleccionar "El Rey"
- Verificar que aplica texto y fuente

## Fase 6: Migrar Todo (1-2 horas)

### Script de migración
```bash
# 1. Exportar tus datos actuales
node -e "console.log(JSON.parse(localStorage.getItem('lm_store_config')))" > backup.json

# 2. Adaptar script migrate-products.js con tus datos
# 3. Ejecutar
node strapi-poc/migrate-products.js
node strapi-poc/migrate-data.js

# 4. Verificar en Strapi Admin que todo se ve bien
```

## Troubleshooting

### Error: CORS
```javascript
// strapi/config/middlewares.js
module.exports = [
  // ... otros middlewares
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000', 'http://localhost:5173'], // tu frontend
      headers: '*',
    },
  },
];
```

### Error: No carga imágenes
Las URLs vienen relativas. Agregar STRAPI_URL:
```typescript
const imageUrl = attrs.images?.data?.[0]?.attributes?.url;
const fullUrl = imageUrl?.startsWith('http') 
  ? imageUrl 
  : `${STRAPI_URL}${imageUrl}`;
```

### Error: Fuentes no aplican
Verificar que cssFamily coincide exactamente con la fuente cargada.

## Checklist Pre-Deploy

- [ ] Todos los productos migrados
- [ ] Todas las fuentes cargadas en Strapi
- [ ] Templates asignados a productos
- [ ] Imágenes subidas
- [ ] API Token configurado en producción
- [ ] CORS configurado para dominio de producción
- [ ] Fallback removido (opcional)

## Deploy

### Opción A: Strapi Cloud (Fácil)
```bash
cd laser-cms
npm install @strapi/provider-upload-cloudinary
# Configurar en admin
# Deploy desde dashboard de Strapi Cloud
```

### Opción B: Railway (Barato)
```bash
# Subir a GitHub
# Conectar Railway
# Variables de entorno en dashboard
```

## Resultado Final

Tus datos ahora viven en Strapi:
- Productos editables sin código
- Templates gestionables
- Fuentes subidas como archivos
- Imágenes en CDN
- API REST/GraphQL lista

Tu React app:
- Más ligera (sin arrays enormes)
- Datos siempre actualizados
- Sin redeploy para cambios de contenido

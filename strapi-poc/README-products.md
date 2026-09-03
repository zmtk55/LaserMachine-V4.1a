# Strapi con Productos + Personalizador

## Arquitectura Híbrida

```
┌─────────────────────────────────────────────────────────┐
│                    STRAPI (CMS)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Products   │  │  Templates  │  │     Fonts       │  │
│  │  - Base     │  │  - Texts    │  │  - Files        │  │
│  │  - Colors   │  │  - Positions│  │  - CSS Family   │  │
│  │  - Prices   │  │  - Fonts    │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ API REST
┌─────────────────────────▼───────────────────────────────┐
│              REACT APP (Tu Frontend)                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │         PRODUCT VISUALIZER (Custom)             │    │
│  │  • Drag & Drop textos                           │    │
│  │  • Preview Canvas (konva/fabric)                │    │
│  │  • Upload logos cliente                         │    │
│  │  • Cálculo precio en tiempo real                │    │
│  │  • Guardar estado como JSON                     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Datos que vienen de Strapi:                            │
│  • Info del producto (nombre, precio base, colores)     │
│  • Templates disponibles para este producto             │
│  • Fuentes cargadas dinámicamente                       │
└─────────────────────────────────────────────────────────┘
```

## Schema Extendido

### Collection: `product`

```json
{
  "kind": "collectionType",
  "collectionName": "products",
  "attributes": {
    "name": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "name" },
    "description": { "type": "richtext" },
    "basePrice": { "type": "decimal", "required": true },
    "category": { "type": "string" },
    "brand": { 
      "type": "enumeration",
      "enum": ["YETI", "Stanley", "HydroFlask", "Owala", "Generic"]
    },
    "capacity": { "type": "string" }, // "30oz", "40oz"
    "images": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images"]
    },
    "colors": {
      "type": "component",
      "component": "product.color-option",
      "repeatable": true
    },
    "availableTemplates": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::template.template"
    },
    "personalizationOptions": {
      "type": "component",
      "component": "product.personalization-config",
      "repeatable": false
    },
    "isActive": { "type": "boolean", "default": true },
    "inStock": { "type": "boolean", "default": true }
  }
}
```

### Component: `product.color-option`

```json
{
  "collectionName": "components_product_color_options",
  "attributes": {
    "name": { "type": "string", "required": true },
    "hexCode": { "type": "string", "required": true },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "priceModifier": { "type": "decimal", "default": 0 }
  }
}
```

### Component: `product.personalization-config`

```json
{
  "collectionName": "components_product_personalization_configs",
  "attributes": {
    "maxTextLines": { "type": "integer", "default": 2 },
    "maxLogos": { "type": "integer", "default": 2 },
    "pricePerLine": { "type": "decimal", "default": 50 },
    "pricePerLogo": { "type": "decimal", "default": 80 },
    "allowClientItem": { "type": "boolean", "default": false },
    "engravingArea": {
      "type": "json",
      "default": {
        "x": 50,
        "y": 180,
        "width": 200,
        "height": 280
      }
    }
  }
}
```

### Collection: `font` (para cargar dinámicamente)

```json
{
  "kind": "collectionType",
  "collectionName": "fonts",
  "attributes": {
    "name": { "type": "string", "required": true },
    "cssFamily": { "type": "string", "required": true },
    "category": {
      "type": "enumeration",
      "enum": ["BASICAS", "DEPORTE", "CURSIVA", "FONTS 2026", "KIDS"]
    },
    "fontFile": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["files"]
    },
    "isActive": { "type": "boolean", "default": true }
  }
}
```

## Flujo de Datos

### 1. Cargar Producto

```typescript
// En tu ProductVisualizer
const { data: product } = useSWR(
  `/api/products/${slug}?populate=colors,availableTemplates,availableTemplates.texts`,
  fetcher
);
```

Respuesta:
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "name": "YETI Rambler 30oz",
      "basePrice": 450.00,
      "colors": [
        { "name": "Stainless", "hexCode": "#C4C4C4", "priceModifier": 0 },
        { "name": "Black", "hexCode": "#1a1a1a", "priceModifier": 0 },
        { "name": "Navy", "hexCode": "#1e3a5f", "priceModifier": 50 }
      ],
      "availableTemplates": {
        "data": [
          {
            "id": 5,
            "attributes": {
              "name": "El Rey",
              "texts": [
                { "content": "REY", "fontFamily": "Bebas Neue", "size": 1.5, "yPosition": 35 }
              ]
            }
          }
        ]
      }
    }
  }
}
```

### 2. Cargar Fuentes Dinámicamente

```typescript
// Cargar fuentes desde Strapi
const { data: fonts } = useSWR('/api/fonts?filters[isActive][$eq]=true', fetcher);

// Inyectar en el documento
useEffect(() => {
  fonts?.data.forEach(font => {
    if (font.attributes.fontFile?.data?.attributes?.url) {
      const url = STRAPI_URL + font.attributes.fontFile.data.attributes.url;
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: '${font.attributes.cssFamily}';
          src: url('${url}') format('truetype');
        }
      `;
      document.head.appendChild(style);
    }
  });
}, [fonts]);
```

### 3. Guardar Orden con Diseño

El diseño personalizado (posiciones, textos, logos) se guarda como JSON en tu backend actual o en una collection `order` en Strapi:

```json
{
  "data": {
    "customerName": "Juan Pérez",
    "customerPhone": "5512345678",
    "product": { "connect": [1] },
    "designState": {
      "front": {
        "texts": [
          {
            "content": "REY",
            "fontFamily": "Bebas Neue",
            "x": 150,
            "y": 200,
            "scale": 1.5
          }
        ],
        "logos": [
          {
            "url": "https://.../logo.png",
            "x": 150,
            "y": 300,
            "width": 100
          }
        ]
      }
    },
    "totalPrice": 550.00,
    "status": "RECIBIDO"
  }
}
```

## Modificaciones en tu Frontend

### 1. Adaptar ProductVisualizer

```typescript
// Antes (hardcoded)
const product = PRODUCTS.find(p => p.id === id);

// Después (Strapi)
const { data: product } = useProduct(id);

// Templates filtrados por producto
const availableTemplates = product?.attributes?.availableTemplates?.data || [];
```

### 2. Precio Dinámico

```typescript
const calculatePrice = () => {
  let total = product.attributes.basePrice;
  
  // Color modifier
  const colorPrice = selectedColor?.priceModifier || 0;
  total += colorPrice;
  
  // Personalización
  const config = product.attributes.personalizationOptions;
  if (config) {
    total += (frontText ? config.pricePerLine : 0);
    total += (backText ? config.pricePerLine : 0);
    total += (frontLogos.length * config.pricePerLogo);
  }
  
  return total;
};
```

### 3. Templates disponibles por producto

```typescript
// Solo mostrar templates asignados a este producto
<DesignTemplates 
  templates={availableTemplates.map(adaptStrapiToTemplate)}
  onSelectTemplate={handleApplyTemplate}
/>
```

## Ventajas de esta Arquitectura

| Antes (Todo local) | Después (Strapi) |
|-------------------|------------------|
| Agregar producto = deploy | Agregar producto = click en admin |
| Fotos en carpeta `/public` | Fotos en CDN optimizado |
| Templates globales | Templates por producto |
| Fuentes hardcodeadas | Fuentes gestionables desde admin |
| Precios en código | Precios editables sin deploy |
| Colores estáticos | Colores dinámicos con surcharges |

## Script de Migración Productos

```javascript
// strapi-poc/migrate-products.js
const products = [
  {
    id: 'prod-1',
    name: 'YETI Rambler 30oz',
    brand: 'YETI',
    category: 'Tumbler',
    basePrice: 450,
    colors: [
      { name: 'Stainless', hex: '#C4C4C4' },
      { name: 'Black', hex: '#1a1a1a' },
      { name: 'Navy', hex: '#1e3a5f', priceModifier: 50 }
    ],
    templates: [1, 2, 3] // IDs en Strapi
  }
];

const migrateProducts = async () => {
  for (const prod of products) {
    await fetchStrapi('/products', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          name: prod.name,
          brand: prod.brand,
          category: prod.category,
          basePrice: prod.basePrice,
          colors: prod.colors,
          availableTemplates: prod.templates
        }
      })
    });
  }
};
```

## Prueba de Concepto en tu Branch

1. **Setup rápido:**
```bash
npx create-strapi-app@latest laser-cms --quickstart
# Esperar 2 minutos
# Crear collections: products, templates, fonts
```

2. **Migrar 1 producto de prueba:**
- Exportar 1 producto de tu `constants.ts`
- Crearlo en Strapi
- Probar endpoint: `http://localhost:1337/api/products/1?populate=*`

3. **Adaptar ProductVisualizer:**
- Cambiar fuente de datos de `constants.ts` a `fetch()`
- Ver que todo sigue funcionando
- Iterar

¿Quieres que prepare el código exacto para adaptar tu `ProductVisualizer` actual a leer de Strapi?

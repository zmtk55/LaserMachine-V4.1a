# Sistema de Fuentes con Strapi

Este documento explica cómo configurar y usar el sistema de fuentes con Strapi CMS.

## 🎯 Resumen

- Las fuentes se cargan desde **Strapi CMS** en lugar de Base64 embebido
- El admin puede subir fuentes desde el panel de Strapi
- Las fuentes se inyectan dinámicamente en el dashboard de clientes
- Cada fuente muestra su nombre escrito con esa tipografía

---

## 📁 Estructura

```
strapi-backend/
└── src/api/font/           # Content Type de fuentes
    ├── content-types/font/schema.json
    ├── controllers/font.ts
    ├── routes/font.ts
    └── services/font.ts

hooks/
└── useStrapiFonts.ts       # Hook para cargar fuentes

migrate-fonts-to-strapi.js  # Script de migración
```

---

## 🚀 Setup Inicial

### 1. Iniciar Strapi

```bash
cd strapi-backend
npm install
npm run develop
```

Strapi iniciará en `http://localhost:1337/admin`

### 2. Crear Content Type

El Content Type "Font" ya está creado en:
`strapi-backend/src/api/font/content-types/font/schema.json`

Reinicia Strapi para aplicar los cambios:
```bash
npm run develop
```

### 3. Configurar Frontend

Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

Edita `.env`:
```env
VITE_STRAPI_URL=http://localhost:1337
```

---

## 💾 Subir Fuentes (Métodos)

### Opción A: Manual desde Strapi Admin

1. Ve a `http://localhost:1337/admin`
2. Content Manager → Fonts → Create new entry
3. Completa los campos:
   - **Name**: Nombre visible (ej: "Sports Bold")
   - **cssFamily**: Identificador único (ej: "sports-bold")
   - **Category**: DEPORTE | CURSIVA | FONTS_2026 | KIDS | BASICAS
   - **Font File**: Sube el archivo .ttf o .otf
   - **Preview Text**: Texto por defecto (ej: "Aa")
4. Save & Publish

### Opción B: Script de Migración

Edita el archivo `migrate-fonts-to-strapi.js`:

```javascript
const existingFonts = [
  { 
    id: 1, 
    name: "Sports Bold", 
    cssFamily: "sports-bold", 
    category: "DEPORTE",
    previewText: "Aa",
    filePath: "./public/fonts/sports-bold.ttf" 
  },
  // Agrega más fuentes...
];
```

Ejecuta:
```bash
node migrate-fonts-to-strapi.js
```

---

## 🎨 Categorías de Fuentes

| Categoría | Uso recomendado |
|-----------|-----------------|
| DEPORTE | Térmicos deportivos, equipos |
| CURSIVA | Regalos elegantes, bodas |
| FONTS_2026 | Fuentes modernas trending |
| KIDS | Productos infantiles |
| BASICAS | Uso general, corporativo |

---

## 📱 Vista en ClientDashboard

```
┌─────────────────────────────────────┐
│ ✏️ Escribe tu nombre aquí...        │
├─────────────────────────────────────┤
┌────────────┐ ┌────────────┐
│  JULIÁN    │ │  JULIÁN    │
│            │ │            │
│  #12       │ │ #24        │
│ Sports     │ │ Cursiva    │
│ [DEPORTE]  │ │ [CURSIVA]  │
└────────────┘ └────────────┘
```

**Características:**
- Preview en tiempo real del nombre escrito
- Nombre de fuente con su propia tipografía
- ID numérico para referencia
- Categoría visible

---

## 🔧 API Endpoints

### Obtener fuentes activas
```http
GET http://localhost:1337/api/fonts?populate=*&sort=displayOrder:asc&filters[isActive][$eq]=true
```

### Obtener fuentes por categoría
```http
GET http://localhost:1337/api/fonts?filters[category][$eq]=DEPORTE&populate=*
```

### Crear fuente
```http
POST http://localhost:1337/api/fonts
Content-Type: application/json

{
  "data": {
    "name": "Mi Fuente",
    "cssFamily": "mi-fuente",
    "category": "BASICAS",
    "isActive": true,
    "displayOrder": 1,
    "previewText": "Aa"
  }
}
```

---

## 🐛 Troubleshooting

### Las fuentes no se ven

1. Verificar Strapi está corriendo:
   ```bash
   curl http://localhost:1337/api/fonts
   ```

2. Verificar CORS está configurado en Strapi:
   - `strapi-backend/config/middlewares.ts`
   - Agregar dominio del frontend

3. Revisar consola del navegador por errores 404

### Errores de carga

1. Verificar que las fuentes están publicadas en Strapi (no en draft)
2. Verificar `isActive: true`
3. Verificar que el archivo de fuente subió correctamente

---

## 📝 Notas Técnicas

### Formato de respuesta de Strapi

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "name": "Sports Bold",
        "cssFamily": "sports-bold",
        "category": "DEPORTE",
        "fontFile": {
          "data": {
            "attributes": {
              "url": "/uploads/sports_bold.ttf",
              "name": "sports_bold.ttf"
            }
          }
        }
      }
    }
  ]
}
```

### Inyección de @font-face

El hook `useStrapiFonts` inyecta dinámicamente:
```css
@font-face {
  font-family: 'sports-bold';
  src: url('http://localhost:1337/uploads/sports_bold.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

---

## 🚀 Deploy a Producción

### 1. Deploy Strapi
- Railway, Heroku, o servidor propio
- Configurar variables de entorno
- Configurar base de datos PostgreSQL

### 2. Actualizar Frontend
```env
VITE_STRAPI_URL=https://tu-strapi.railway.app
```

### 3. Subir fuentes a Strapi producción
- Usar el script de migración apuntando a URL de producción
- O subir manualmente desde el admin

---

## ✅ Checklist

- [ ] Strapi iniciado y accesible
- [ ] Content Type "Font" creado
- [ ] Frontend configurado con VITE_STRAPI_URL
- [ ] Fuentes subidas a Strapi
- [ ] Fuentes marcadas como "Published"
- [ ] Fuentes con `isActive: true`
- [ ] Preview funciona en ClientDashboard

---

## 📞 Soporte

Si hay problemas:
1. Verificar logs de Strapi
2. Verificar Network tab en navegador
3. Revisar que los archivos .ttf son válidos

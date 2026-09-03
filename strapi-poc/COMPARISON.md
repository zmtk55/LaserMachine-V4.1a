# Comparativa: Custom vs Strapi

## Costos Mensuales (Estimado)

| Solución | Hosting | DB | Storage | Total/mes |
|----------|---------|-----|---------|-----------|
| **Custom actual** | Netlify (free) | Supabase free (500MB) | - | **$0** |
| **Strapi Cloud Starter** | Incluido | Incluido (5GB) | 50GB CDN | **$29** |
| **Strapi Self-hosted** | Railway ($9) | Postgres ($0) | Cloudinary (25GB free) | **$9** |
| **Strapi DO Droplet** | $6 (1GB RAM) | SQLite incluido | - | **$6** |

## Cuándo cambiar

### ✅ Migrar a Strapi si:
- [ ] Tienes >30 templates para gestionar
- [ ] Varios empleados necesitan crear/editar sin tocar código
- [ ] Quieres agregar fotos reales a cada template (no SVG)
- [ ] Necesitas analytics de cuáles templates se usan más
- [ ] Planeas vender templates como producto digital
- [ ] Clientes piden "nuevos diseños" frecuentemente

### ❌ Quedarse en Custom si:
- [ ] Solo tú administras (<20 templates)
- [ ] Tus templates casi no cambian
- [ ] Presupuesto es crítico ($0)
- [ ] No tienes tiempo de aprender/migrar
- [ ] Necesitas deployar YA

## Esfuerzo de Migración

| Tarea | Tiempo estimado | Complejidad |
|-------|-----------------|-------------|
| Setup Strapi local | 30 min | ⭐ Fácil |
| Crear collections | 1 hora | ⭐ Fácil |
| Migrar templates (~20) | 2 horas | ⭐⭐ Media |
| Adaptar frontend | 4 horas | ⭐⭐ Media |
| Testing | 2 horas | ⭐⭐ Media |
| Deploy a producción | 1 hora | ⭐⭐ Media |
| **TOTAL** | **~11 horas** | |

## Roadmap Sugerido

### Opción A: Migración Completa (2 días)
1. Setup Strapi + migrar todos los templates
2. Reemplazar completamente el sistema actual
3. Beneficio: Panel admin profesional desde día 1

### Opción B: Híbrido Progresivo (1 semana)
1. Día 1: Strapi solo para templates nuevos
2. Día 2-3: Sincronizar templates legacy
3. Día 4-5: Adaptar frontend para leer de ambas fuentes
4. Día 6-7: Deprecar sistema viejo
5. Beneficio: Menos riesgo, rollback fácil

### Opción C: Strapi Solo para Assets (2 horas)
1. Usar Strapi solo como Media Library para fotos de templates
2. Templates siguen en JSON, imágenes vienen de Strapi
3. Beneficio: Mejora inmediata en calidad visual sin migrar todo

## Checklist Pre-Migración

Antes de empezar, asegúrate de:
- [ ] Tener backup de `localStorage` actual
- [ ] Exportar array completo de templates
- [ ] Documentar campos custom si los hay
- [ ] Verificar que todas las fuentes existen en producción
- [ ] Preparar imágenes de preview (si las vas a usar)

## Comandos Rápidos

```bash
# 1. Crear proyecto Strapi
npx create-strapi-app@latest laser-machine-cms --quickstart

# 2. Instalar plugins útiles
cd laser-machine-cms
npm install strapi-plugin-transformations

# 3. Iniciar
npm run develop
# Abre http://localhost:1337/admin

# 4. Crear API Token (Settings > API Tokens)
# Copiar token a tu .env del frontend

# 5. Migrar datos
node migrate-data.js
```

## Recursos

- [Strapi Documentation](https://docs.strapi.io)
- [Strapi Cloud Pricing](https://strapi.io/pricing-cloud)
- [Deployment Guides](https://docs.strapi.io/dev-docs/deployment)

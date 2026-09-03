// strapi-poc/migrate-data.js
// Script para migrar templates desde localStorage/JSON a Strapi

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN;

// Templates de ejemplo (reemplazar con tus datos reales)
const legacyTemplates = [
  {
    id: 'default-1',
    name: 'El Rey',
    occasion: 'fathers-day',
    preview: '👑',
    previewColor: 'black',
    texts: [
      { content: 'REY', fontFamily: 'Bebas Neue', size: 1.5, yPosition: 35 },
      { content: 'PAPÁ', fontFamily: 'Plus Jakarta Sans', size: 1, yPosition: 65 }
    ],
    isActive: true,
    isFavorite: true,
    usageCount: 245,
    createdAt: '2024-01-15T10:00:00Z',
    tags: ['popular', 'padre', 'best-seller']
  },
  {
    id: 'default-2',
    name: 'Best Mom',
    occasion: 'mothers-day',
    preview: '💖',
    previewColor: 'pink',
    texts: [
      { content: 'BEST MOM', fontFamily: 'Playfair Display', size: 1.2, yPosition: 40 },
      { content: 'EVER', fontFamily: 'Bebas Neue', size: 1, yPosition: 65 }
    ],
    isActive: true,
    usageCount: 312,
    createdAt: '2024-01-20T10:00:00Z',
    tags: ['popular', 'madre']
  }
];

// Cliente HTTP simple
const fetchStrapi = async (endpoint, options = {}) => {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Strapi error: ${error}`);
  }

  return response.json();
};

// Crear tags si no existen
const ensureTags = async (tagNames) => {
  console.log('📝 Verificando tags...');
  
  const existing = await fetchStrapi('/tags');
  const existingNames = existing.data.map(t => t.attributes.name);
  
  const tagMap = {};
  
  for (const name of tagNames) {
    if (existingNames.includes(name)) {
      const found = existing.data.find(t => t.attributes.name === name);
      tagMap[name] = found.id;
      console.log(`  ✓ Tag existente: ${name} (ID: ${found.id})`);
    } else {
      const created = await fetchStrapi('/tags', {
        method: 'POST',
        body: JSON.stringify({ data: { name } }),
      });
      tagMap[name] = created.data.id;
      console.log(`  ✓ Tag creado: ${name} (ID: ${created.data.id})`);
    }
  }
  
  return tagMap;
};

// Migrar un template
const migrateTemplate = async (template, tagMap) => {
  console.log(`\n🔄 Migrando: ${template.name}`);
  
  // Preparar datos para Strapi
  const strapiData = {
    name: template.name,
    occasion: template.occasion,
    texts: template.texts.map(t => ({
      content: t.content,
      fontFamily: t.fontFamily || 'Bebas Neue',
      size: t.size || 1,
      yPosition: t.yPosition || 50,
      rotation: t.rotation || 0,
    })),
    isActive: template.isActive,
    isFavorite: template.isFavorite || false,
    usageCount: template.usageCount || 0,
    createdAt: template.createdAt,
    // Asociar tags por ID
    tags: (template.tags || []).map(tagName => tagMap[tagName]).filter(Boolean),
  };

  try {
    const result = await fetchStrapi('/templates', {
      method: 'POST',
      body: JSON.stringify({ data: strapiData }),
    });
    
    console.log(`  ✅ Migrado con ID: ${result.data.id}`);
    return result.data.id;
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  }
};

// Script principal
const migrate = async () => {
  console.log('🚀 Iniciando migración a Strapi...\n');
  
  // 1. Obtener todos los tags únicos
  const allTags = [...new Set(
    legacyTemplates.flatMap(t => t.tags || [])
  )];
  
  console.log(`📦 ${legacyTemplates.length} templates encontrados`);
  console.log(`🏷️  ${allTags.length} tags únicos: ${allTags.join(', ')}\n`);
  
  // 2. Crear/obtener tags
  const tagMap = await ensureTags(allTags);
  
  // 3. Migrar templates
  const results = [];
  for (const template of legacyTemplates) {
    try {
      const newId = await migrateTemplate(template, tagMap);
      results.push({ oldId: template.id, newId, name: template.name });
    } catch (error) {
      console.error(`Fallo en ${template.name}:`, error.message);
    }
  }
  
  // 4. Reporte
  console.log('\n📊 Resumen de migración:');
  console.log(`   Total: ${legacyTemplates.length}`);
  console.log(`   Exitosos: ${results.length}`);
  console.log(`   Fallidos: ${legacyTemplates.length - results.length}`);
  
  // Guardar mapping de IDs
  const mapping = results.reduce((acc, r) => {
    acc[r.oldId] = r.newId;
    return acc;
  }, {});
  
  console.log('\n📝 Mapping de IDs (guardar para referencia):');
  console.log(JSON.stringify(mapping, null, 2));
  
  return mapping;
};

// Ejecutar
migrate()
  .then(() => {
    console.log('\n✨ Migración completada!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

/*
INSTRUCCIONES:

1. Exportar tus templates actuales:
   - Desde el browser: localStorage.getItem('lm_store_config')
   - Copiar designTemplates a este archivo

2. Configurar variables:
   export STRAPI_URL=http://localhost:1337
   export STRAPI_API_TOKEN=tu_token_aqui

3. Ejecutar:
   node migrate-data.js

4. Verificar en Strapi Admin:
   http://localhost:1337/admin/content-manager/collectionType/api::template.template
*/

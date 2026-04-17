/**
 * Script para migrar fuentes existentes a Strapi
 * Uso: node migrate-fonts-to-strapi.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuración
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN; // Opcional, para autenticación

// Fuentes existentes (copia esto desde tu constants.ts o donde tengas las fuentes)
const existingFonts = [
  // Ejemplo - Reemplaza con tus fuentes reales:
  // { id: 1, name: "Sports Bold", cssFamily: "sports-bold", category: "DEPORTE", filePath: "./public/fonts/sports-bold.ttf" },
  // { id: 2, name: "Cursive Elegant", cssFamily: "cursive-elegant", category: "CURSIVA", filePath: "./public/fonts/cursive.ttf" },
];

async function uploadFontToStrapi(fontData) {
  try {
    console.log(`Migrando fuente: ${fontData.name}...`);

    // 1. Verificar que el archivo existe
    if (!fs.existsSync(fontData.filePath)) {
      console.error(`  ❌ Archivo no encontrado: ${fontData.filePath}`);
      return false;
    }

    // 2. Crear entry en Strapi
    const createResponse = await fetch(`${STRAPI_URL}/api/fonts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }),
      },
      body: JSON.stringify({
        data: {
          name: fontData.name,
          cssFamily: fontData.cssFamily,
          category: fontData.category,
          isActive: true,
          displayOrder: fontData.id,
          previewText: fontData.previewText || 'Aa',
        },
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error(`  ❌ Error creando entry: ${error}`);
      return false;
    }

    const createData = await createResponse.json();
    const fontId = createData.data.id;
    console.log(`  ✓ Entry creada con ID: ${fontId}`);

    // 3. Subir archivo de fuente
    const formData = new FormData();
    formData.append('files', fs.createReadStream(fontData.filePath), {
      filename: path.basename(fontData.filePath),
      contentType: 'font/ttf',
    });
    formData.append('ref', 'api::font.font');
    formData.append('refId', fontId.toString());
    formData.append('field', 'fontFile');

    const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }),
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error(`  ❌ Error subiendo archivo: ${error}`);
      return false;
    }

    console.log(`  ✓ Archivo subido exitosamente`);
    return true;

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function migrateFonts() {
  console.log('=== MIGRACIÓN DE FUENTES A STRAPI ===\n');
  console.log(`Strapi URL: ${STRAPI_URL}\n`);

  if (existingFonts.length === 0) {
    console.log('⚠️ No hay fuentes configuradas en el script.');
    console.log('Edita este archivo y agrega tus fuentes al array "existingFonts"\n');
    console.log('Ejemplo:');
    console.log(`
const existingFonts = [
  { 
    id: 1, 
    name: "Sports Bold", 
    cssFamily: "sports-bold", 
    category: "DEPORTE", 
    filePath: "./public/fonts/sports-bold.ttf" 
  },
];
    `);
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const font of existingFonts) {
    const success = await uploadFontToStrapi(font);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    console.log('');
  }

  console.log('=== RESUMEN ===');
  console.log(`✓ Fuente migradas: ${successCount}`);
  console.log(`✗ Errores: ${errorCount}`);
  console.log(`Total: ${existingFonts.length}`);
}

// Ejecutar migración
migrateFonts().catch(console.error);

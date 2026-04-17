/**
 * Strapi Setup Automation - Usando fetch nativo
 */

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '95aa9ae3a6950c96f4316b47d66d51da86d889ac13d53ba47227a530b7bfa239962c399bb661449ab10078b13d9cf9dd012ccd2df819f70cf63aacc8d0027e4ecdda47aff6fe56dcfe2a4b033ed9878b59f60e58cc86db123f01120a1cfe403c3cf0b3f72910d65e89d4bb17dea169b3c5f507ff5bb8746fe6f46e3fcf120b29';

async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
  
  return response.json();
}

// Productos
const products = [
  { name: 'Rambler 20oz', brand: 'YETI', category: 'Tumblers', price: 850, colors: [{name:'Graphite',hex:'#374151',stock:20}, {name:'Copper',hex:'#b87333',stock:15}] },
  { name: 'Travel Mug 30oz', brand: 'YETI', category: 'Travel', price: 950, colors: [{name:'Black',hex:'#1a1a1a',stock:15}, {name:'Navy',hex:'#1e3a5f',stock:12}, {name:'White',hex:'#f5f5f5',stock:10}] },
  { name: 'Quencher H2.0 40oz', brand: 'STANLEY', category: 'Tumblers', price: 1200, colors: [{name:'Cream',hex:'#faf9f6',stock:50}, {name:'Rose Quartz',hex:'#fda4af',stock:30}] },
  { name: 'IceFlow Flip 30oz', brand: 'STANLEY', category: 'Bottles', price: 980, colors: [{name:'Charcoal',hex:'#374151',stock:10}, {name:'Polar White',hex:'#f9fafb',stock:12}] },
  { name: 'Wide Mouth 32oz', brand: 'HYDROFLASK', category: 'Bottles', price: 890, colors: [{name:'Black',hex:'#1a1a1a',stock:25}, {name:'Pacific',hex:'#1e40af',stock:15}] },
  { name: 'Coffee Mug 12oz', brand: 'HYDROFLASK', category: 'Mugs', price: 650, colors: [{name:'Stone',hex:'#78716c',stock:12}, {name:'Black',hex:'#1a1a1a',stock:15}] },
  { name: 'FreeSip 24oz', brand: 'OWALA', category: 'Bottles', price: 720, colors: [{name:'Retro Boardwalk',hex:'#fbbf24',stock:10}, {name:'Denim',hex:'#1e40af',stock:8}] },
  { name: 'FreeSip 32oz', brand: 'OWALA', category: 'Bottles', price: 820, colors: [{name:'All Black',hex:'#171717',stock:10}, {name:'Shy Marshmallow',hex:'#fafafa',stock:10}] },
  { name: 'Skinny Tumbler 20oz', brand: 'GENERIC', category: 'Tumblers', price: 350, colors: [{name:'Matte Black',hex:'#1a1a1a',stock:100}, {name:'Glossy White',hex:'#ffffff',stock:100}] },
  { name: 'Wine Tumbler 12oz', brand: 'GENERIC', category: 'Barware', price: 280, colors: [{name:'White',hex:'#fafafa',stock:40}, {name:'Black',hex:'#1a1a1a',stock:40}] }
];

async function checkEndpoints() {
  console.log('🔍 Verificando endpoints...\n');
  const endpoints = ['/products', '/product-colors', '/orders', '/store-config'];
  
  for (const endpoint of endpoints) {
    try {
      const data = await apiCall(endpoint);
      console.log(`✅ ${endpoint} - OK (${data.data?.length || 0} items)`);
    } catch (error) {
      console.log(`❌ ${endpoint} - ${error.message.includes('404') ? 'NO EXISTE' : 'Error'}`);
    }
  }
}

async function createProducts() {
  console.log('\n🔄 Creando productos...\n');
  
  for (const product of products) {
    try {
      const { colors, ...productData } = product;
      
      // Crear producto
      const result = await apiCall('/products', 'POST', { data: productData });
      const productId = result.data.id;
      
      console.log(`✅ ${product.name}`);
      
      // Crear colores
      if (colors) {
        for (const color of colors) {
          await apiCall('/product-colors', 'POST', {
            data: { ...color, product: productId }
          });
        }
        console.log(`   🎨 ${colors.length} colores`);
      }
    } catch (error) {
      console.error(`❌ ${product.name}: ${error.message}`);
    }
  }
}

async function createStoreConfig() {
  console.log('\n🔄 Creando configuración...\n');
  
  try {
    await apiCall('/store-config', 'POST', {
      data: {
        businessName: 'LASERMACHINE',
        accentColor: '#f59e0b',
        nextOrderId: 1020,
        pointsPercentage: 5,
        whatsapp: '526371247095',
        facebookUrl: 'lasermachinemexico',
        baseEngravingPrice: 100,
        extraSidePrice: 50,
        logoSurcharge: 50
      }
    });
    console.log('✅ Configuración creada');
  } catch (error) {
    console.error(`❌ Config: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Strapi Auto-Setup\n');
  
  await checkEndpoints();
  await createProducts();
  await createStoreConfig();
  
  console.log('\n✨ Completado!');
}

main().catch(console.error);

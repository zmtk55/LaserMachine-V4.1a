/**
 * Strapi Setup Automation - Valores corregidos
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

// Productos con valores CORREGIDOS según tu Strapi
const products = [
  { 
    name: 'Rambler 20oz', 
    brand: 'YETI', 
    category: 'Tumblers', 
    price: 850, 
    stockThreshold: 10,
    isActive: true,
    colors: [
      {name:'Graphite', hex:'#374151', stock:20}, 
      {name:'Copper', hex:'#b87333', stock:15}
    ] 
  },
  { 
    name: 'Travel Mug 30oz', 
    brand: 'YETI', 
    category: 'Travel', 
    price: 950, 
    stockThreshold: 8,
    isActive: true,
    colors: [
      {name:'Black', hex:'#1a1a1a', stock:15}, 
      {name:'Navy', hex:'#1e3a5f', stock:12}, 
      {name:'White', hex:'#f5f5f5', stock:10}
    ] 
  },
  { 
    name: 'Quencher H2.0 40oz', 
    brand: 'Stanley', 
    category: 'Tumblers', 
    price: 1200, 
    stockThreshold: 5,
    isActive: true,
    colors: [
      {name:'Cream', hex:'#faf9f6', stock:50}, 
      {name:'Rose Quartz', hex:'#fda4af', stock:30}
    ] 
  },
  { 
    name: 'IceFlow Flip 30oz', 
    brand: 'Stanley', 
    category: 'Bottles', 
    price: 980, 
    stockThreshold: 6,
    isActive: true,
    colors: [
      {name:'Charcoal', hex:'#374151', stock:10}, 
      {name:'Polar White', hex:'#f9fafb', stock:12}
    ] 
  },
  { 
    name: 'Wide Mouth 32oz', 
    brand: 'HidroFlask', 
    category: 'Bottles', 
    price: 890, 
    stockThreshold: 10,
    isActive: true,
    colors: [
      {name:'Black', hex:'#1a1a1a', stock:25}, 
      {name:'Pacific', hex:'#1e40af', stock:15}
    ] 
  },
  { 
    name: 'Coffee Mug 12oz', 
    brand: 'HidroFlask', 
    category: 'Tazas', 
    price: 650, 
    stockThreshold: 8,
    isActive: true,
    colors: [
      {name:'Stone', hex:'#78716c', stock:12}, 
      {name:'Black', hex:'#1a1a1a', stock:15}
    ] 
  },
  { 
    name: 'FreeSip 24oz', 
    brand: 'OWALA', 
    category: 'Bottles', 
    price: 720, 
    stockThreshold: 5,
    isActive: true,
    colors: [
      {name:'Retro Boardwalk', hex:'#fbbf24', stock:10}, 
      {name:'Denim', hex:'#1e40af', stock:8}
    ] 
  },
  { 
    name: 'FreeSip 32oz', 
    brand: 'OWALA', 
    category: 'Bottles', 
    price: 820, 
    stockThreshold: 5,
    isActive: true,
    colors: [
      {name:'All Black', hex:'#171717', stock:10}, 
      {name:'Shy Marshmallow', hex:'#fafafa', stock:10}
    ] 
  },
  { 
    name: 'Skinny Tumbler 20oz', 
    brand: 'Generico', 
    category: 'Tumblers', 
    price: 350, 
    stockThreshold: 20,
    isActive: true,
    colors: [
      {name:'Matte Black', hex:'#1a1a1a', stock:100}, 
      {name:'Glossy White', hex:'#ffffff', stock:100}
    ] 
  },
  { 
    name: 'Wine Tumbler 12oz', 
    brand: 'Generico', 
    category: 'Accesorios', 
    price: 280, 
    stockThreshold: 15,
    isActive: true,
    colors: [
      {name:'White', hex:'#fafafa', stock:40}, 
      {name:'Black', hex:'#1a1a1a', stock:40}
    ] 
  }
];

async function createProducts() {
  console.log('🔄 Creando productos...\n');
  let created = 0;
  let errors = 0;
  
  for (const product of products) {
    try {
      const { colors, ...productData } = product;
      
      // Crear producto
      const result = await apiCall('/products', 'POST', { data: productData });
      const productId = result.data.id;
      
      console.log(`✅ ${product.name}`);
      created++;
      
    } catch (error) {
      console.error(`❌ ${product.name}: ${error.message.substring(0, 100)}`);
      errors++;
    }
  }
  
  console.log(`\n📊 Productos: ${created} creados, ${errors} errores`);
}

async function updateExistingProducts() {
  console.log('\n🔄 Actualizando productos existentes...\n');
  
  try {
    const existing = await apiCall('/products');
    
    for (const product of existing.data) {
      const productColors = products.find(p => p.name === product.attributes.name)?.colors;
      
      if (productColors) {
        console.log(`📝 ${product.attributes.name} - tiene ${productColors.length} colores para agregar`);
      }
    }
  } catch (error) {
    console.log('ℹ️ No se pudieron verificar productos existentes');
  }
}

async function main() {
  console.log('🚀 Strapi Setup - Valores Corregidos\n');
  
  await createProducts();
  await updateExistingProducts();
  
  console.log('\n✨ Completado!');
  console.log('\n⚠️ Nota: Para crear los content types faltantes:');
  console.log('   Ve a Content-Type Builder → Create new collection type');
  console.log('   - Product Color');
  console.log('   - Order');
  console.log('   - Order Item');
  console.log('   - Coupon');
  console.log('   - Store Config (Single Type)');
}

main().catch(console.error);

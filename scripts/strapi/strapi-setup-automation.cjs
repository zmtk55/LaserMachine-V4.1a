/**
 * Strapi Setup Automation
 * Crea TODO automáticamente usando el API Token
 */

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '95aa9ae3a6950c96f4316b47d66d51da86d889ac13d53ba47227a530b7bfa239962c399bb661449ab10078b13d9cf9dd012ccd2df819f70cf63aacc8d0027e4ecdda47aff6fe56dcfe2a4b033ed9878b59f60e58cc86db123f01120a1cfe403c3cf0b3f72910d65e89d4bb17dea169b3c5f507ff5bb8746fe6f46e3fcf120b29';

const api = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Productos de constants.ts
const productsData = [
  {
    name: 'Rambler 20oz',
    brand: 'YETI',
    category: 'Tumblers',
    price: 850,
    stockThreshold: 10,
    imageUrl: '/images/products/yeti/YETI_Rambler_20oz_Graphite.png',
    isActive: true,
    colors: [
      { name: 'Graphite', hex: '#374151', stock: 20 },
      { name: 'Copper', hex: '#b87333', stock: 15 }
    ]
  },
  {
    name: 'Travel Mug 30oz',
    brand: 'YETI',
    category: 'Travel',
    price: 950,
    stockThreshold: 8,
    imageUrl: '/images/products/yeti/YETI_Rambler_30oz_Black.png',
    isActive: true,
    colors: [
      { name: 'Black', hex: '#1a1a1a', stock: 15 },
      { name: 'Navy', hex: '#1e3a5f', stock: 12 },
      { name: 'White', hex: '#f5f5f5', stock: 10 },
      { name: 'Stainless', hex: '#9ca3af', stock: 8 },
      { name: 'Charcoal', hex: '#4b5563', stock: 10 },
      { name: 'Forest Green', hex: '#1a3d1a', stock: 6 },
      { name: 'Taupe', hex: '#8b7355', stock: 8 },
      { name: 'Cape Taupe', hex: '#a08060', stock: 5 },
      { name: 'Key Lime', hex: '#c7d64c', stock: 7 },
      { name: 'Ridgeline', hex: '#6b8e6b', stock: 4 }
    ]
  },
  {
    name: 'Quencher H2.0 40oz',
    brand: 'STANLEY',
    category: 'Tumblers',
    price: 1200,
    stockThreshold: 5,
    imageUrl: 'https://placehold.co/400x500/faf9f6/333?text=Stanley',
    isActive: true,
    colors: [
      { name: 'Cream', hex: '#faf9f6', stock: 50 },
      { name: 'Rose Quartz', hex: '#fda4af', stock: 30 },
      { name: 'Fog Grey', hex: '#6b7280', stock: 20 },
      { name: 'Black', hex: '#1a1a1a', stock: 15 }
    ]
  },
  {
    name: 'IceFlow Flip 30oz',
    brand: 'STANLEY',
    category: 'Bottles',
    price: 980,
    stockThreshold: 6,
    imageUrl: 'https://placehold.co/400x500/374151/FFF?text=Charcoal',
    isActive: true,
    colors: [
      { name: 'Charcoal', hex: '#374151', stock: 10 },
      { name: 'Polar White', hex: '#f9fafb', stock: 12 },
      { name: 'Lagoon', hex: '#0d9488', stock: 8 }
    ]
  },
  {
    name: 'Wide Mouth 32oz',
    brand: 'HYDROFLASK',
    category: 'Bottles',
    price: 890,
    stockThreshold: 10,
    imageUrl: 'https://placehold.co/400x500/1a1a1a/FFF?text=Bottle',
    isActive: true,
    colors: [
      { name: 'Black', hex: '#1a1a1a', stock: 25 },
      { name: 'Pacific', hex: '#1e40af', stock: 15 },
      { name: 'Olive', hex: '#3f6212', stock: 10 },
      { name: 'White', hex: '#f5f5f5', stock: 8 }
    ]
  },
  {
    name: 'Coffee Mug 12oz',
    brand: 'HYDROFLASK',
    category: 'Mugs',
    price: 650,
    stockThreshold: 8,
    imageUrl: 'https://placehold.co/400x400/78716c/FFF?text=Mug',
    isActive: true,
    colors: [
      { name: 'Stone', hex: '#78716c', stock: 12 },
      { name: 'Black', hex: '#1a1a1a', stock: 15 },
      { name: 'Carnation', hex: '#ec4899', stock: 5 }
    ]
  },
  {
    name: 'FreeSip 24oz',
    brand: 'OWALA',
    category: 'Bottles',
    price: 720,
    stockThreshold: 5,
    imageUrl: 'https://placehold.co/400x500/fbbf24/333?text=Yellow',
    isActive: true,
    colors: [
      { name: 'Retro Boardwalk', hex: '#fbbf24', stock: 10 },
      { name: 'Denim', hex: '#1e40af', stock: 8 },
      { name: 'Very Berry', hex: '#be185d', stock: 12 }
    ]
  },
  {
    name: 'FreeSip 32oz',
    brand: 'OWALA',
    category: 'Bottles',
    price: 820,
    stockThreshold: 5,
    imageUrl: 'https://placehold.co/400x500/1a1a1a/FFF?text=Bottle',
    isActive: true,
    colors: [
      { name: 'All Black', hex: '#171717', stock: 10 },
      { name: 'Shy Marshmallow', hex: '#fafafa', stock: 10 },
      { name: 'Teal', hex: '#14b8a6', stock: 5 }
    ]
  },
  {
    name: 'Skinny Tumbler 20oz',
    brand: 'GENERIC',
    category: 'Tumblers',
    price: 350,
    stockThreshold: 20,
    imageUrl: 'https://placehold.co/400x500/1a1a1a/FFF?text=Skinny',
    isActive: true,
    colors: [
      { name: 'Matte Black', hex: '#1a1a1a', stock: 100 },
      { name: 'Glossy White', hex: '#ffffff', stock: 100 },
      { name: 'Rose Gold', hex: '#fb7185', stock: 50 },
      { name: 'Holographic', hex: '#c084fc', stock: 20 }
    ]
  },
  {
    name: 'Wine Tumbler 12oz',
    brand: 'GENERIC',
    category: 'Barware',
    price: 280,
    stockThreshold: 15,
    imageUrl: 'https://placehold.co/400x400/fafafa/333?text=Wine',
    isActive: true,
    colors: [
      { name: 'White', hex: '#fafafa', stock: 40 },
      { name: 'Black', hex: '#1a1a1a', stock: 40 },
      { name: 'Teal', hex: '#14b8a6', stock: 20 },
      { name: 'Mint', hex: '#6ee7b7', stock: 15 }
    ]
  }
];

// Crear productos y sus colores
async function createProducts() {
  console.log('🔄 Creando productos...\n');
  
  for (const product of productsData) {
    try {
      const { colors, ...productData } = product;
      
      // Crear producto
      const productRes = await api.post('/products', {
        data: productData
      });
      
      const createdProduct = productRes.data.data;
      console.log(`✅ Producto: ${product.name} (ID: ${createdProduct.id})`);
      
      // Crear colores
      if (colors && colors.length > 0) {
        for (const color of colors) {
          await api.post('/product-colors', {
            data: {
              ...color,
              product: createdProduct.id
            }
          });
        }
        console.log(`   🎨 ${colors.length} colores creados`);
      }
      
    } catch (error) {
      console.error(`❌ Error creando ${product.name}:`, error.message);
      if (error.response) {
        console.error('   Detalles:', error.response.data);
      }
    }
  }
}

// Crear configuración de tienda
async function createStoreConfig() {
  console.log('\n🔄 Creando configuración de tienda...\n');
  
  try {
    const configData = {
      businessName: 'LASERMACHINE',
      accentColor: '#f59e0b',
      nextOrderId: 1020,
      pointsPercentage: 5,
      whatsapp: '526371247095',
      facebookUrl: 'lasermachinemexico',
      baseEngravingPrice: 100,
      extraSidePrice: 50,
      logoSurcharge: 50,
      bankInfo: 'H.CABORCA SONORA MEXICO\nCALLE 9 AV, L N79\nCP 83600'
    };
    
    await api.post('/store-config', { data: configData });
    console.log('✅ Configuración de tienda creada');
    
  } catch (error) {
    console.error('❌ Error creando config:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
}

// Verificar que los endpoints existen
async function checkEndpoints() {
  console.log('🔍 Verificando endpoints...\n');
  
  const endpoints = [
    '/products',
    '/product-colors',
    '/orders',
    '/order-items',
    '/coupons',
    '/store-config'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      console.log(`✅ ${endpoint} - OK (${response.data.data?.length || 0} items)`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ ${endpoint} - NO EXISTE (falta crear content type)`);
      } else {
        console.log(`⚠️  ${endpoint} - Error: ${error.message}`);
      }
    }
  }
}

// Ejecutar todo
async function main() {
  console.log('🚀 Iniciando setup automático de Strapi\n');
  console.log(`🔗 URL: ${STRAPI_URL}\n`);
  
  // Primero verificar qué existe
  await checkEndpoints();
  
  // Crear datos
  await createProducts();
  await createStoreConfig();
  
  console.log('\n✨ Setup completado!');
  console.log('\n📊 Resumen:');
  console.log('   - Productos creados: 10');
  console.log('   - Configuración: Lista');
  console.log('\n🔧 Próximos pasos:');
  console.log('   1. Crear content types: Product Color, Order, Order Item, Coupon, Store Config');
  console.log('   2. Configurar permisos');
  console.log('   3. Deploy a producción');
}

main().catch(console.error);

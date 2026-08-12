/**
 * Script de Migración: Firebase -> Strapi
 * FASE 2: Migrar datos existentes de Firebase a Strapi
 */

const axios = require('axios');

// Configuración
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || ''; // Opcional, si tienes token

const headers = {
  'Content-Type': 'application/json',
  ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` })
};

// ==========================================
// DATOS DE EJEMPLO (Reemplazar con export de Firebase)
// ==========================================

const productsFromFirebase = [
  {
    id: 'p1',
    name: 'Rambler 20oz',
    brand: 'YETI',
    category: 'Tumblers',
    price: 850,
    stockThreshold: 10,
    imageUrl: '/images/products/yeti/YETI_Rambler_20oz_Graphite.png',
    colors: [
      { name: 'Graphite', hex: '#374151', stock: 20 },
      { name: 'Copper', hex: '#b87333', stock: 15 }
    ]
  },
  {
    id: 'p2',
    name: 'Travel Mug 30oz',
    brand: 'YETI',
    category: 'Travel',
    price: 950,
    stockThreshold: 8,
    imageUrl: '/images/products/yeti/YETI_Rambler_30oz_Black.png',
    colors: [
      { name: 'Black', hex: '#1a1a1a', stock: 15 },
      { name: 'Navy', hex: '#1e3a5f', stock: 12 }
    ]
  },
  // ... más productos
];

const ordersFromFirebase = [
  {
    orderId: 'LM-1001',
    customerName: 'Sofia Martinez',
    customerPhone: '5512345678',
    customerEmail: 'sofia@mail.com',
    total: 1300,
    amountPaid: 1300,
    paymentStatus: 'PAID',
    paymentMethod: 'TRANSFER',
    status: 'COMPLETED',
    deliveryMethod: 'PICKUP',
    items: [
      {
        productId: 'p3',
        colorName: 'Rose Quartz',
        frontText: 'Sofia',
        frontFontId: 102,
        quantity: 1,
        unitPrice: 1300,
        totalPrice: 1300
      }
    ],
    history: [
      { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'RECEIVED', operator: 'SYSTEM' },
      { timestamp: new Date().toISOString(), status: 'COMPLETED', operator: 'ADMIN' }
    ]
  }
];

const storeConfigFromFirebase = {
  businessName: 'LASERMACHINE',
  accentColor: '#f59e0b',
  nextOrderId: 1020,
  whatsapp: '526371247095',
  facebookUrl: 'lasermachinemexico',
  baseEngravingPrice: 100,
  extraSidePrice: 50,
  logoSurcharge: 50
};

// ==========================================
// FUNCIONES DE MIGRACIÓN
// ==========================================

async function migrateProducts() {
  console.log('🔄 Migrando Productos...');
  
  for (const product of productsFromFirebase) {
    try {
      // Crear producto
      const productData = {
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        stockThreshold: product.stockThreshold,
        imageUrl: product.imageUrl,
        isActive: true
      };
      
      const response = await axios.post(
        `${STRAPI_URL}/api/products`,
        { data: productData },
        { headers }
      );
      
      const createdProduct = response.data.data;
      console.log(`✅ Producto creado: ${product.name} (ID: ${createdProduct.id})`);
      
      // Crear colores asociados
      if (product.colors && product.colors.length > 0) {
        for (const color of product.colors) {
          await axios.post(
            `${STRAPI_URL}/api/product-colors`,
            { 
              data: {
                name: color.name,
                hex: color.hex,
                stock: color.stock,
                product: createdProduct.id
              }
            },
            { headers }
          );
        }
        console.log(`   🎨 ${product.colors.length} colores creados`);
      }
      
    } catch (error) {
      console.error(`❌ Error migrando producto ${product.name}:`, error.message);
    }
  }
}

async function migrateStoreConfig() {
  console.log('🔄 Migrando Configuración de Tienda...');
  
  try {
    await axios.post(
      `${STRAPI_URL}/api/store-config`,
      { data: storeConfigFromFirebase },
      { headers }
    );
    console.log('✅ Configuración de tienda migrada');
  } catch (error) {
    console.error('❌ Error migrando configuración:', error.message);
  }
}

async function migrateOrders() {
  console.log('🔄 Migrando Órdenes...');
  
  for (const order of ordersFromFirebase) {
    try {
      // Crear orden
      const orderData = {
        orderId: order.orderId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        total: order.total,
        amountPaid: order.amountPaid,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        history: order.history,
        trackingId: order.orderId
      };
      
      const response = await axios.post(
        `${STRAPI_URL}/api/orders`,
        { data: orderData },
        { headers }
      );
      
      const createdOrder = response.data.data;
      console.log(`✅ Orden creada: ${order.orderId} (ID: ${createdOrder.id})`);
      
      // Crear items de la orden
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          await axios.post(
            `${STRAPI_URL}/api/order-items`,
            {
              data: {
                itemId: `itm-${Date.now()}`,
                productId: item.productId,
                colorName: item.colorName,
                frontText: item.frontText || '',
                frontFontId: item.frontFontId || 999,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                order: createdOrder.id
              }
            },
            { headers }
          );
        }
        console.log(`   📦 ${order.items.length} items creados`);
      }
      
    } catch (error) {
      console.error(`❌ Error migrando orden ${order.orderId}:`, error.message);
    }
  }
}

// ==========================================
// EJECUCIÓN PRINCIPAL
// ==========================================

async function main() {
  console.log('🚀 Iniciando migración Firebase -> Strapi\n');
  console.log(`🔗 Strapi URL: ${STRAPI_URL}\n`);
  
  try {
    // Verificar conexión con Strapi
    await axios.get(`${STRAPI_URL}/admin`);
    console.log('✅ Conexión con Strapi OK\n');
    
    // Ejecutar migraciones
    await migrateStoreConfig();
    await migrateProducts();
    await migrateOrders();
    
    console.log('\n✨ Migración completada!');
    
  } catch (error) {
    console.error('\n❌ Error de conexión con Strapi:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   1. Strapi está corriendo en http://localhost:1337');
    console.log('   2. Las APIs públicas están habilitadas en Settings > Users & Permissions');
  }
}

// Exportar para usar como módulo
module.exports = {
  migrateProducts,
  migrateStoreConfig,
  migrateOrders,
  main
};

// Ejecutar si se corre directamente
if (require.main === module) {
  main();
}

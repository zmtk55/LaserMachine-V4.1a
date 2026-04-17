/**
 * Crear Content Types automáticamente vía API
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
  
  const response = await fetch(`${STRAPI_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status}: ${error.substring(0, 200)}`);
  }
  
  return response.json();
}

// Schema de Product Color
const productColorSchema = {
  contentType: {
    displayName: 'Product Color',
    singularName: 'product-color',
    pluralName: 'product-colors',
    description: 'Color variants for products'
  },
  attributes: [
    { name: 'name', type: 'string', required: true },
    { name: 'hex', type: 'string', required: true },
    { name: 'stock', type: 'integer', default: 0 },
    { name: 'imageUrl', type: 'string' },
    { 
      name: 'product', 
      type: 'relation', 
      relation: 'manyToOne',
      target: 'api::product.product'
    }
  ]
};

// Schema de Order
const orderSchema = {
  contentType: {
    displayName: 'Order',
    singularName: 'order',
    pluralName: 'orders',
    description: 'Customer orders'
  },
  attributes: [
    { name: 'orderId', type: 'string', required: true, unique: true },
    { name: 'customerName', type: 'string', required: true },
    { name: 'customerPhone', type: 'string', required: true },
    { name: 'customerEmail', type: 'email' },
    { name: 'total', type: 'decimal', required: true },
    { name: 'amountPaid', type: 'decimal', default: 0 },
    { name: 'paymentStatus', type: 'enumeration', enum: ['PENDING', 'PAID', 'PARTIAL', 'REFUNDED'], default: 'PENDING' },
    { name: 'paymentMethod', type: 'enumeration', enum: ['CASH', 'TRANSFER', 'CARD', 'POINTS'], default: 'CASH' },
    { name: 'status', type: 'enumeration', enum: ['RECEIVED', 'IN_PRODUCTION', 'READY', 'COMPLETED', 'CANCELLED'], default: 'RECEIVED' },
    { name: 'deliveryMethod', type: 'enumeration', enum: ['PICKUP', 'DELIVERY'], default: 'PICKUP' },
    { name: 'notes', type: 'richtext' },
    { name: 'history', type: 'json' },
    { name: 'couponCode', type: 'string' },
    { name: 'discount', type: 'decimal', default: 0 },
    { name: 'trackingId', type: 'string' }
  ]
};

// Schema de Order Item
const orderItemSchema = {
  contentType: {
    displayName: 'Order Item',
    singularName: 'order-item',
    pluralName: 'order-items',
    description: 'Items within an order'
  },
  attributes: [
    { name: 'itemId', type: 'string', required: true },
    { name: 'productId', type: 'string', required: true },
    { name: 'productName', type: 'string', required: true },
    { name: 'colorName', type: 'string', required: true },
    { name: 'frontText', type: 'string' },
    { name: 'frontFontId', type: 'integer' },
    { name: 'frontFontName', type: 'string' },
    { name: 'frontDesignState', type: 'json' },
    { name: 'frontLogos', type: 'json' },
    { name: 'backText', type: 'string' },
    { name: 'backFontId', type: 'integer' },
    { name: 'backFontName', type: 'string' },
    { name: 'backDesignState', type: 'json' },
    { name: 'backLogos', type: 'json' },
    { name: 'quantity', type: 'integer', required: true, min: 1 },
    { name: 'unitPrice', type: 'decimal', required: true },
    { name: 'totalPrice', type: 'decimal', required: true },
    { 
      name: 'order', 
      type: 'relation', 
      relation: 'manyToOne',
      target: 'api::order.order'
    }
  ]
};

// Schema de Coupon
const couponSchema = {
  contentType: {
    displayName: 'Coupon',
    singularName: 'coupon',
    pluralName: 'coupons',
    description: 'Discount coupons'
  },
  attributes: [
    { name: 'code', type: 'string', required: true, unique: true },
    { name: 'type', type: 'enumeration', enum: ['PERCENTAGE', 'FIXED'], required: true },
    { name: 'value', type: 'decimal', required: true },
    { name: 'minOrderAmount', type: 'decimal', default: 0 },
    { name: 'maxUses', type: 'integer', default: -1 },
    { name: 'usedCount', type: 'integer', default: 0 },
    { name: 'expiresAt', type: 'datetime' },
    { name: 'isActive', type: 'boolean', default: true },
    { name: 'description', type: 'string' }
  ]
};

// Schema de Store Config (Single Type)
const storeConfigSchema = {
  contentType: {
    displayName: 'Store Config',
    singularName: 'store-config',
    pluralName: 'store-configs',
    description: 'Global store configuration',
    kind: 'singleType'
  },
  attributes: [
    { name: 'businessName', type: 'string', default: 'LASERMACHINE' },
    { name: 'logoUrl', type: 'string' },
    { name: 'accentColor', type: 'string', default: '#f59e0b' },
    { name: 'nextOrderId', type: 'integer', default: 1000 },
    { name: 'pointsPercentage', type: 'decimal', default: 5 },
    { name: 'whatsapp', type: 'string', default: '526371247095' },
    { name: 'instagramUrl', type: 'string' },
    { name: 'facebookUrl', type: 'string', default: 'lasermachinemexico' },
    { name: 'bankInfo', type: 'richtext' },
    { name: 'baseEngravingPrice', type: 'decimal', default: 100 },
    { name: 'extraSidePrice', type: 'decimal', default: 50 },
    { name: 'logoSurcharge', type: 'decimal', default: 50 },
    { name: 'shippingInfo', type: 'richtext' }
  ]
};

async function createContentType(schema) {
  console.log(`🔄 Creando: ${schema.contentType.displayName}...`);
  
  try {
    // Intentar crear vía API de content-type-builder
    const result = await apiCall('/content-type-builder/content-types', 'POST', {
      contentType: schema.contentType,
      attributes: schema.attributes
    });
    
    console.log(`✅ ${schema.contentType.displayName} creado`);
    return result;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`ℹ️ ${schema.contentType.displayName} ya existe`);
    } else {
      console.error(`❌ Error: ${error.message.substring(0, 100)}`);
    }
    return null;
  }
}

async function main() {
  console.log('🚀 Creando Content Types automáticamente\n');
  
  const schemas = [
    productColorSchema,
    orderSchema,
    orderItemSchema,
    couponSchema,
    storeConfigSchema
  ];
  
  for (const schema of schemas) {
    await createContentType(schema);
  }
  
  console.log('\n✨ Proceso completado');
  console.log('\n⚠️ Si falló, hay que crear manualmente en Content-Type Builder');
}

main().catch(console.error);

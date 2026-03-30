/**
 * Servicio Strapi - Conexión simple con el backend
 */

const API_URL = 'https://lasermachine-strapi-production.up.railway.app/api';

// Helper para fetch
async function fetchApi(endpoint: string, method = 'GET', data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify({ data });
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    console.error(`API Error: ${response.status}`, await response.text());
    return null;
  }
  
  return response.json();
}

// Mapear producto de Strapi a formato de la app
function mapProduct(strapiProduct: any) {
  return {
    id: strapiProduct.id.toString(),
    name: strapiProduct.name,
    brand: strapiProduct.brand,
    category: strapiProduct.category,
    price: parseFloat(strapiProduct.price),
    stockThreshold: strapiProduct.stockThreshold || 10,
    imageUrl: strapiProduct.imageUrl || `/images/products/default.png`,
    isActive: strapiProduct.isActive ?? true,
    colors: strapiProduct.colors?.map((c: any) => ({
      name: c.name,
      hex: c.hex,
      stock: c.stock || 0,
      imageUrl: c.imageUrl
    })) || []
  };
}

// Servicio de Productos
export const strapiProductService = {
  async getAll() {
    const response = await fetchApi('/products');
    if (!response?.data) return [];
    return response.data.map(mapProduct);
  },
  
  async getById(id: string) {
    const response = await fetchApi(`/products/${id}`);
    if (!response?.data) return null;
    return mapProduct(response.data);
  }
};

// Servicio de Órdenes
export const strapiOrderService = {
  async create(orderData: any) {
    // Generar orderId único
    const orderId = `ORD-${Date.now()}`;
    
    const data = {
      orderId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail || '',
      total: orderData.total,
      amountPaid: orderData.amountPaid || 0,
      paymentStatus: orderData.paymentStatus || 'PENDING',
      paymentMethod: orderData.paymentMethod || 'CASH',
      status: orderData.status || 'RECEIVED',
      deliveryMethod: orderData.deliveryMethod || 'PICKUP',
      notes: orderData.notes || '',
      couponCode: orderData.couponCode || '',
      discount: orderData.discount || 0,
      trackingId: orderId
    };
    
    return fetchApi('/orders', 'POST', data);
  },
  
  async getByTracking(trackingId: string) {
    const response = await fetchApi(`/orders?filters[trackingId][$eq]=${trackingId}`);
    return response?.data?.[0] || null;
  }
};

// Servicio de Configuración
export const strapiConfigService = {
  async get() {
    const response = await fetchApi('/store-config');
    if (!response?.data) return null;
    
    const config = response.data;
    return {
      businessName: config.businessName || 'LASERMACHINE',
      accentColor: config.accentColor || '#f59e0b',
      whatsapp: config.whatsapp || '526371247095',
      facebookUrl: config.facebookUrl || 'lasermachinemexico',
      nextOrderId: config.nextOrderId || 1000,
      baseEngravingPrice: config.baseEngravingPrice || 100,
      extraSidePrice: config.extraSidePrice || 50,
      logoSurcharge: config.logoSurcharge || 50
    };
  }
};

export default {
  products: strapiProductService,
  orders: strapiOrderService,
  config: strapiConfigService
};

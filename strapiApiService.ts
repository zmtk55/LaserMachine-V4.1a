/**
 * Strapi API Service
 * FASE 3: Servicio para conectar el frontend con Strapi
 */

import axios from 'axios';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const API_URL = `${STRAPI_URL}/api`;

// Cliente axios configurado
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// PRODUCTOS
// ==========================================

export const ProductService = {
  // Obtener todos los productos
  async getAll() {
    const response = await apiClient.get('/products?populate=colors');
    return response.data.data;
  },

  // Obtener un producto por ID
  async getById(id: string) {
    const response = await apiClient.get(`/products/${id}?populate=colors`);
    return response.data.data;
  },

  // Crear producto (admin)
  async create(productData: any) {
    const response = await apiClient.post('/products', { data: productData });
    return response.data.data;
  },

  // Actualizar producto (admin)
  async update(id: string, productData: any) {
    const response = await apiClient.put(`/products/${id}`, { data: productData });
    return response.data.data;
  },

  // Eliminar producto (admin)
  async delete(id: string) {
    await apiClient.delete(`/products/${id}`);
  }
};

// ==========================================
// ORDENES
// ==========================================

export const OrderService = {
  // Crear orden
  async create(orderData: any) {
    const response = await apiClient.post('/orders', { 
      data: orderData 
    });
    return response.data.data;
  },

  // Obtener ordenes del usuario
  async getMyOrders() {
    const response = await apiClient.get('/orders?populate=items');
    return response.data.data;
  },

  // Obtener orden por ID
  async getById(id: string) {
    const response = await apiClient.get(`/orders/${id}?populate=items`);
    return response.data.data;
  },

  // Buscar orden por tracking ID
  async getByTracking(trackingId: string) {
    const response = await apiClient.get(`/orders/tracking/${trackingId}`);
    return response.data;
  },

  // Actualizar estado de orden (admin)
  async updateStatus(id: string, status: string, operator: string = 'SYSTEM') {
    const response = await apiClient.put(`/orders/${id}/status`, {
      status,
      operator
    });
    return response.data;
  }
};

// ==========================================
// COUPONS
// ==========================================

export const CouponService = {
  // Validar cupón
  async validate(code: string, orderAmount: number) {
    const response = await apiClient.post('/coupons/validate', {
      code,
      orderAmount
    });
    return response.data;
  },

  // Aplicar cupón
  async apply(code: string) {
    const response = await apiClient.post('/coupons/apply', { code });
    return response.data;
  }
};

// ==========================================
// STORE CONFIG
// ==========================================

export const StoreConfigService = {
  // Obtener configuración
  async get() {
    const response = await apiClient.get('/store-config');
    return response.data.data;
  },

  // Actualizar configuración (admin)
  async update(configData: any) {
    const response = await apiClient.put('/store-config', { data: configData });
    return response.data.data;
  }
};

// ==========================================
// AUTENTICACIÓN
// ==========================================

export const AuthService = {
  // Login
  async login(identifier: string, password: string) {
    const response = await apiClient.post('/auth/local', {
      identifier,
      password
    });
    const { jwt, user } = response.data;
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('user', JSON.stringify(user));
    return { jwt, user };
  },

  // Registro
  async register(username: string, email: string, password: string) {
    const response = await apiClient.post('/auth/local/register', {
      username,
      email,
      password
    });
    const { jwt, user } = response.data;
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('user', JSON.stringify(user));
    return { jwt, user };
  },

  // Logout
  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  },

  // Obtener usuario actual
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Verificar si está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('jwt');
  }
};

// Exportar todo
export default {
  products: ProductService,
  orders: OrderService,
  coupons: CouponService,
  storeConfig: StoreConfigService,
  auth: AuthService,
};

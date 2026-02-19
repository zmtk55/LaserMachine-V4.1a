// API Client Service for LaserMachine
// Uses the Netlify Edge Function API endpoints

const API_BASE = '/api';

// Helper for making requests
async function request<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  
  return response.json();
}

// =============================================
// PRODUCTS API
// =============================================
export interface Product {
  id?: number;
  name: string;
  brand: string;
  price: number;
  category?: string;
  image_url?: string;
  is_active?: boolean;
  colors?: ProductColor[];
}

export interface ProductColor {
  id?: number;
  name: string;
  hex: string;
  image_url?: string;
  stock?: number;
}

export const productsApi = {
  getAll: () => request<Product[]>('/products'),
  getById: (id: number) => request<Product>(`/products/${id}`),
  create: (product: Product) => request<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  update: (id: number, product: Partial<Product>) => request<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  delete: (id: number) => request<{ success: boolean }>(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// =============================================
// FONTS API
// =============================================
export interface Font {
  id?: number;
  name: string;
  css_family: string;
  category?: string;
  preview_url?: string;
}

export const fontsApi = {
  getAll: () => request<Font[]>('/fonts'),
  create: (font: Font) => request<Font>('/fonts', {
    method: 'POST',
    body: JSON.stringify(font),
  }),
  update: (id: number, font: Partial<Font>) => request<Font>(`/fonts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(font),
  }),
  delete: (id: number) => request<{ success: boolean }>(`/fonts/${id}`, {
    method: 'DELETE',
  }),
};

// =============================================
// ORDERS API
// =============================================
export interface OrderItem {
  id?: number;
  order_id?: string;
  product_id?: number;
  color_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  front_text?: string;
  front_text_2?: string;
  front_font_id?: number;
  front_font_id_2?: number;
  front_design_state?: any;
  back_text?: string;
  back_font_id?: number;
  back_design_state?: any;
  is_client_item?: boolean;
  client_item_brand?: string;
  client_item_color?: string;
  notes?: string;
}

export interface Order {
  id: string;
  customer_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  delivery_method?: string;
  shipping_address?: string;
  shipping_tracking?: string;
  subtotal: number;
  discount?: number;
  total: number;
  coupon_code?: string;
  points_used?: number;
  points_earned?: number;
  notes?: string;
  is_priority?: boolean;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export const ordersApi = {
  getAll: (status?: string) => request<Order[]>(`/orders${status ? `?status=${status}` : ''}`),
  getById: (id: string) => request<Order>(`/orders/${id}`),
  create: (order: Order) => request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  update: (id: string, updates: Partial<Order>) => request<Order>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  updateStatus: (id: string, status: string) => request<Order>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// =============================================
// CUSTOMERS API
// =============================================
export interface Customer {
  id?: number;
  phone: string;
  name?: string;
  email?: string;
  laser_points?: number;
  total_orders?: number;
  total_spent?: number;
}

export const customersApi = {
  getAll: () => request<Customer[]>('/customers'),
  getByPhone: (phone: string) => request<Customer>(`/customers?phone=${encodeURIComponent(phone)}`),
  createOrUpdate: (customer: Customer) => request<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  }),
  addPoints: (phone: string, points: number) => request<Customer>(`/customers/${encodeURIComponent(phone)}`, {
    method: 'PUT',
    body: JSON.stringify({ points_add: points }),
  }),
  subtractPoints: (phone: string, points: number) => request<Customer>(`/customers/${encodeURIComponent(phone)}`, {
    method: 'PUT',
    body: JSON.stringify({ points_subtract: points }),
  }),
};

// =============================================
// STORE CONFIG API
// =============================================
export interface StoreConfig {
  business_name?: string;
  logo_url?: string;
  accent_color?: string;
  theme_dark_mode_bg?: string;
  bg_pattern?: string;
  next_order_id?: number;
  points_percentage?: number;
  whatsapp?: string;
  instagram_url?: string;
  facebook_url?: string;
  bank_info?: string;
  shipping_info?: string;
  message_templates?: Record<string, string>;
  global_colors?: Array<{ name: string; hex: string }>;
  product_categories?: string[];
  admin_emails?: string[];
}

export const configApi = {
  get: () => request<StoreConfig>('/config'),
  update: (config: Partial<StoreConfig>) => request<StoreConfig>('/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  }),
};

// =============================================
// COUPONS API
// =============================================
export interface Coupon {
  id?: number;
  code: string;
  discount_percent: number;
  max_uses?: number;
  used_count?: number;
  assigned_to_phone?: string;
  expiry_date?: string;
  is_active?: boolean;
}

export interface CouponValidation {
  valid: boolean;
  discount?: number;
  message?: string;
}

export const couponsApi = {
  getAll: () => request<Coupon[]>('/coupons'),
  validate: (code: string, phone?: string) => 
    request<CouponValidation>(`/coupons?code=${encodeURIComponent(code)}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`),
  use: (code: string) => request<{ success: boolean }>('/coupons', {
    method: 'POST',
    body: JSON.stringify({ use_code: code }),
  }),
  create: (coupon: Coupon) => request<Coupon>('/coupons', {
    method: 'POST',
    body: JSON.stringify(coupon),
  }),
  delete: (id: number) => request<{ success: boolean }>(`/coupons/${id}`, {
    method: 'DELETE',
  }),
};

// =============================================
// STATS API
// =============================================
export interface OrderStats {
  total_orders: number;
  pending: number;
  in_production: number;
  completed: number;
  today_revenue: number;
  total_revenue: number;
}

export interface DailySales {
  date: string;
  order_count: number;
  total_sales: number;
  average_order_value?: number;
}

export const statsApi = {
  getOverview: () => request<OrderStats>('/stats?type=overview'),
  getDailySales: (days = 30) => request<DailySales[]>(`/stats?type=daily&days=${days}`),
  getTopCustomers: () => request<Customer[]>('/stats?type=top_customers'),
};

// =============================================
// HEALTH CHECK
// =============================================
export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('/health'),
};

// =============================================
// UNIFIED DATABASE SERVICE (Drop-in replacement)
// =============================================
// This object provides a similar interface to the existing firebaseService
// for easier migration

export const db = {
  // Products
  products: {
    getAll: productsApi.getAll,
    get: productsApi.getById,
    create: productsApi.create,
    update: productsApi.update,
    delete: productsApi.delete,
  },
  
  // Fonts
  fonts: {
    getAll: fontsApi.getAll,
    create: fontsApi.create,
    update: fontsApi.update,
    delete: fontsApi.delete,
  },
  
  // Orders
  orders: {
    getAll: ordersApi.getAll,
    get: ordersApi.getById,
    create: ordersApi.create,
    update: ordersApi.update,
    updateStatus: ordersApi.updateStatus,
  },
  
  // Customers
  customers: {
    getAll: customersApi.getAll,
    getByPhone: customersApi.getByPhone,
    createOrUpdate: customersApi.createOrUpdate,
    addPoints: customersApi.addPoints,
    subtractPoints: customersApi.subtractPoints,
  },
  
  // Config
  config: {
    get: configApi.get,
    update: configApi.update,
  },
  
  // Coupons
  coupons: {
    getAll: couponsApi.getAll,
    validate: couponsApi.validate,
    use: couponsApi.use,
    create: couponsApi.create,
    delete: couponsApi.delete,
  },
  
  // Stats
  stats: {
    getOverview: statsApi.getOverview,
    getDailySales: statsApi.getDailySales,
    getTopCustomers: statsApi.getTopCustomers,
  },
  
  // Health
  checkConnection: healthApi.check,
};

export default db;

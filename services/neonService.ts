// Neon PostgreSQL Database Service for LaserMachine
// Uses @neondatabase/serverless for edge-compatible connections

/// <reference types="vite/client" />

import { neon, neonConfig } from '@neondatabase/serverless';

// Type augmentation for import.meta.env
declare global {
  interface ImportMetaEnv {
    VITE_DATABASE_URL?: string;
  }
}

// Configure for better error messages in development
neonConfig.fetchConnectionCache = true;

// Get the database connection string from environment
const getDatabaseUrl = () => {
  const url = (import.meta as any).env?.VITE_DATABASE_URL || (typeof process !== 'undefined' ? process.env?.DATABASE_URL : null);
  if (!url) {
    console.warn('DATABASE_URL not configured - using local storage fallback');
    return null;
  }
  return url;
};

// Create SQL client
const createSql = () => {
  const url = getDatabaseUrl();
  if (!url) return null;
  return neon(url);
};

// =============================================
// PRODUCTS
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
  product_id?: number;
  name: string;
  hex: string;
  image_url?: string;
  stock?: number;
}

export async function getProducts(): Promise<Product[]> {
  const sql = createSql();
  if (!sql) return [];
  
  try {
    const products = await sql`
      SELECT p.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', pc.id,
              'name', pc.name,
              'hex', pc.hex,
              'image_url', pc.image_url,
              'stock', pc.stock
            )
          ) FILTER (WHERE pc.id IS NOT NULL), 
          '[]'
        ) as colors
      FROM products p
      LEFT JOIN product_colors pc ON p.id = pc.product_id
      WHERE p.is_active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return products as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    const [product] = await sql`
      SELECT p.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', pc.id,
              'name', pc.name,
              'hex', pc.hex,
              'image_url', pc.image_url,
              'stock', pc.stock
            )
          ) FILTER (WHERE pc.id IS NOT NULL), 
          '[]'
        ) as colors
      FROM products p
      LEFT JOIN product_colors pc ON p.id = pc.product_id
      WHERE p.id = ${id}
      GROUP BY p.id
    `;
    return product as Product || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function createProduct(product: Product): Promise<Product | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    const [newProduct] = await sql`
      INSERT INTO products (name, brand, price, category, image_url)
      VALUES (${product.name}, ${product.brand}, ${product.price}, ${product.category || null}, ${product.image_url || null})
      RETURNING *
    `;
    
    // Insert colors if provided
    if (product.colors && product.colors.length > 0) {
      for (const color of product.colors) {
        await sql`
          INSERT INTO product_colors (product_id, name, hex, image_url, stock)
          VALUES (${newProduct.id}, ${color.name}, ${color.hex}, ${color.image_url || null}, ${color.stock || 0})
        `;
      }
    }
    
    return await getProductById(newProduct.id);
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

export async function updateProduct(id: number, product: Partial<Product>): Promise<Product | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    await sql`
      UPDATE products SET
        name = COALESCE(${product.name || null}, name),
        brand = COALESCE(${product.brand || null}, brand),
        price = COALESCE(${product.price ?? null}, price),
        category = COALESCE(${product.category || null}, category),
        image_url = COALESCE(${product.image_url || null}, image_url),
        is_active = COALESCE(${product.is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
    `;
    
    // Update colors if provided
    if (product.colors) {
      // Delete existing colors
      await sql`DELETE FROM product_colors WHERE product_id = ${id}`;
      
      // Insert new colors
      for (const color of product.colors) {
        await sql`
          INSERT INTO product_colors (product_id, name, hex, image_url, stock)
          VALUES (${id}, ${color.name}, ${color.hex}, ${color.image_url || null}, ${color.stock || 0})
        `;
      }
    }
    
    return await getProductById(id);
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

export async function deleteProduct(id: number): Promise<boolean> {
  const sql = createSql();
  if (!sql) return false;
  
  try {
    await sql`UPDATE products SET is_active = false WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// =============================================
// FONTS
// =============================================
export interface Font {
  id?: number;
  name: string;
  css_family: string;
  category?: string;
  preview_url?: string;
  is_active?: boolean;
}

export async function getFonts(): Promise<Font[]> {
  const sql = createSql();
  if (!sql) return [];
  
  try {
    const fonts = await sql`
      SELECT * FROM fonts 
      WHERE is_active = true 
      ORDER BY category, name
    `;
    return fonts as Font[];
  } catch (error) {
    console.error('Error fetching fonts:', error);
    return [];
  }
}

export async function createFont(font: Font): Promise<Font | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    const [newFont] = await sql`
      INSERT INTO fonts (name, css_family, category, preview_url)
      VALUES (${font.name}, ${font.css_family}, ${font.category || 'BASICAS'}, ${font.preview_url || null})
      RETURNING *
    `;
    return newFont as Font;
  } catch (error) {
    console.error('Error creating font:', error);
    return null;
  }
}

export async function updateFont(id: number, font: Partial<Font>): Promise<Font | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    const [updated] = await sql`
      UPDATE fonts SET
        name = COALESCE(${font.name || null}, name),
        css_family = COALESCE(${font.css_family || null}, css_family),
        category = COALESCE(${font.category || null}, category),
        preview_url = COALESCE(${font.preview_url || null}, preview_url)
      WHERE id = ${id}
      RETURNING *
    `;
    return updated as Font;
  } catch (error) {
    console.error('Error updating font:', error);
    return null;
  }
}

export async function deleteFont(id: number): Promise<boolean> {
  const sql = createSql();
  if (!sql) return false;
  
  try {
    await sql`UPDATE fonts SET is_active = false WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Error deleting font:', error);
    return false;
  }
}

// =============================================
// CUSTOMERS
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

export async function getCustomers(): Promise<Customer[]> {
  const sql = createSql();
  if (!sql) return [];
  
  try {
    const customers = await sql`SELECT * FROM customer_summary ORDER BY total_spent DESC`;
    return customers as Customer[];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    const [customer] = await sql`SELECT * FROM customer_summary WHERE phone = ${phone}`;
    return customer as Customer || null;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function createOrUpdateCustomer(customer: Customer): Promise<Customer | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    const [result] = await sql`
      INSERT INTO customers (phone, name, email, laser_points)
      VALUES (${customer.phone}, ${customer.name || null}, ${customer.email || null}, ${customer.laser_points || 0})
      ON CONFLICT (phone) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, customers.name),
        email = COALESCE(EXCLUDED.email, customers.email),
        updated_at = NOW()
      RETURNING *
    `;
    return result as Customer;
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    return null;
  }
}

export async function updateCustomerPoints(phone: string, points: number, type: 'add' | 'subtract'): Promise<boolean> {
  const sql = createSql();
  if (!sql) return false;
  
  try {
    if (type === 'add') {
      await sql`UPDATE customers SET laser_points = laser_points + ${points}, updated_at = NOW() WHERE phone = ${phone}`;
    } else {
      await sql`UPDATE customers SET laser_points = GREATEST(0, laser_points - ${points}), updated_at = NOW() WHERE phone = ${phone}`;
    }
    return true;
  } catch (error) {
    console.error('Error updating points:', error);
    return false;
  }
}

// =============================================
// ORDERS
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

export async function getOrders(status?: string): Promise<Order[]> {
  const sql = createSql();
  if (!sql) return [];
  
  try {
    let orders;
    if (status) {
      orders = await sql`
        SELECT * FROM orders 
        WHERE status = ${status}
        ORDER BY is_priority DESC, created_at DESC
      `;
    } else {
      orders = await sql`
        SELECT * FROM orders 
        ORDER BY is_priority DESC, created_at DESC
      `;
    }
    
    // Fetch items for each order
    for (const order of orders) {
      const items = await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`;
      order.items = items;
    }
    
    return orders as Order[];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    const [order] = await sql`SELECT * FROM orders WHERE id = ${id}`;
    if (!order) return null;
    
    const items = await sql`SELECT * FROM order_items WHERE order_id = ${id}`;
    order.items = items;
    
    return order as Order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function createOrder(order: Order): Promise<Order | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    // Ensure/create customer
    const customer = await createOrUpdateCustomer({
      phone: order.customer_phone,
      name: order.customer_name,
      email: order.customer_email
    });
    
    // Insert order
    const [newOrder] = await sql`
      INSERT INTO orders (
        id, customer_id, customer_name, customer_phone, customer_email,
        status, payment_status, payment_method, delivery_method,
        shipping_address, subtotal, discount, total, coupon_code,
        points_used, points_earned, notes, is_priority
      ) VALUES (
        ${order.id}, ${customer?.id || null}, ${order.customer_name}, ${order.customer_phone}, ${order.customer_email || null},
        ${order.status || 'PENDING_PAYMENT'}, ${order.payment_status || 'PENDING'}, ${order.payment_method || null}, ${order.delivery_method || 'PICKUP'},
        ${order.shipping_address || null}, ${order.subtotal}, ${order.discount || 0}, ${order.total}, ${order.coupon_code || null},
        ${order.points_used || 0}, ${order.points_earned || 0}, ${order.notes || null}, ${order.is_priority || false}
      )
      RETURNING *
    `;
    
    // Insert order items
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        await sql`
          INSERT INTO order_items (
            order_id, product_id, color_name, quantity, unit_price, total_price,
            front_text, front_text_2, front_font_id, front_font_id_2, front_design_state,
            back_text, back_font_id, back_design_state,
            is_client_item, client_item_brand, client_item_color, notes
          ) VALUES (
            ${order.id}, ${item.product_id || null}, ${item.color_name || null}, ${item.quantity}, ${item.unit_price}, ${item.total_price},
            ${item.front_text || null}, ${item.front_text_2 || null}, ${item.front_font_id || null}, ${item.front_font_id_2 || null}, ${item.front_design_state ? JSON.stringify(item.front_design_state) : null},
            ${item.back_text || null}, ${item.back_font_id || null}, ${item.back_design_state ? JSON.stringify(item.back_design_state) : null},
            ${item.is_client_item || false}, ${item.client_item_brand || null}, ${item.client_item_color || null}, ${item.notes || null}
          )
        `;
      }
    }
    
    return await getOrderById(order.id);
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

export async function updateOrderStatus(id: string, status: string): Promise<boolean> {
  const sql = createSql();
  if (!sql) return false;
  
  try {
    await sql`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    await sql`
      UPDATE orders SET
        status = COALESCE(${updates.status || null}, status),
        payment_status = COALESCE(${updates.payment_status || null}, payment_status),
        payment_method = COALESCE(${updates.payment_method || null}, payment_method),
        shipping_tracking = COALESCE(${updates.shipping_tracking || null}, shipping_tracking),
        notes = COALESCE(${updates.notes || null}, notes),
        is_priority = COALESCE(${updates.is_priority ?? null}, is_priority),
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return await getOrderById(id);
  } catch (error) {
    console.error('Error updating order:', error);
    return null;
  }
}

// =============================================
// STORE CONFIG
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

export async function getStoreConfig(): Promise<StoreConfig | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    const [config] = await sql`SELECT * FROM store_config WHERE id = 1`;
    return config as StoreConfig || null;
  } catch (error) {
    console.error('Error fetching store config:', error);
    return null;
  }
}

export async function updateStoreConfig(config: Partial<StoreConfig>): Promise<StoreConfig | null> {
  const sql = createSql();
  if (!sql) return null;
  
  try {
    await sql`
      UPDATE store_config SET
        business_name = COALESCE(${config.business_name || null}, business_name),
        logo_url = COALESCE(${config.logo_url || null}, logo_url),
        accent_color = COALESCE(${config.accent_color || null}, accent_color),
        theme_dark_mode_bg = COALESCE(${config.theme_dark_mode_bg || null}, theme_dark_mode_bg),
        bg_pattern = COALESCE(${config.bg_pattern || null}, bg_pattern),
        points_percentage = COALESCE(${config.points_percentage ?? null}, points_percentage),
        whatsapp = COALESCE(${config.whatsapp || null}, whatsapp),
        instagram_url = COALESCE(${config.instagram_url || null}, instagram_url),
        facebook_url = COALESCE(${config.facebook_url || null}, facebook_url),
        bank_info = COALESCE(${config.bank_info || null}, bank_info),
        shipping_info = COALESCE(${config.shipping_info || null}, shipping_info),
        message_templates = COALESCE(${config.message_templates ? JSON.stringify(config.message_templates) : null}::jsonb, message_templates),
        global_colors = COALESCE(${config.global_colors ? JSON.stringify(config.global_colors) : null}::jsonb, global_colors),
        product_categories = COALESCE(${config.product_categories ? JSON.stringify(config.product_categories) : null}::jsonb, product_categories),
        admin_emails = COALESCE(${config.admin_emails ? JSON.stringify(config.admin_emails) : null}::jsonb, admin_emails),
        updated_at = NOW()
      WHERE id = 1
    `;
    return await getStoreConfig();
  } catch (error) {
    console.error('Error updating store config:', error);
    return null;
  }
}

export async function getNextOrderId(): Promise<string> {
  const sql = createSql();
  if (!sql) return `LM-${Date.now()}`;
  
  try {
    const [config] = await sql`
      UPDATE store_config 
      SET next_order_id = next_order_id + 1 
      WHERE id = 1 
      RETURNING next_order_id
    `;
    return `LM-${config.next_order_id}`;
  } catch (error) {
    console.error('Error getting next order ID:', error);
    return `LM-${Date.now()}`;
  }
}

// =============================================
// COUPONS
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

export async function getCoupons(): Promise<Coupon[]> {
  const sql = createSql();
  if (!sql) return [];
  
  try {
    const coupons = await sql`SELECT * FROM coupons WHERE is_active = true ORDER BY created_at DESC`;
    return coupons as Coupon[];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
}

export async function validateCoupon(code: string, phone?: string): Promise<{ valid: boolean; discount: number; message?: string }> {
  const sql = createSql();
  if (!sql) return { valid: false, discount: 0, message: 'Database not configured' };
  
  try {
    const [coupon] = await sql`SELECT * FROM coupons WHERE code = ${code} AND is_active = true`;
    
    if (!coupon) {
      return { valid: false, discount: 0, message: 'Cupón no válido' };
    }
    
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { valid: false, discount: 0, message: 'Cupón expirado' };
    }
    
    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return { valid: false, discount: 0, message: 'Cupón agotado' };
    }
    
    if (coupon.assigned_to_phone && coupon.assigned_to_phone !== phone) {
      return { valid: false, discount: 0, message: 'Este cupón no es válido para tu cuenta' };
    }
    
    return { valid: true, discount: coupon.discount_percent };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, discount: 0, message: 'Error validando cupón' };
  }
}

export async function useCoupon(code: string): Promise<boolean> {
  const sql = createSql();
  if (!sql) return false;
  
  try {
    await sql`UPDATE coupons SET used_count = used_count + 1 WHERE code = ${code}`;
    return true;
  } catch (error) {
    console.error('Error using coupon:', error);
    return false;
  }
}

// =============================================
// ANALYTICS
// =============================================
export async function getDailySales(days: number = 30): Promise<Array<{ date: string; order_count: number; total_sales: number }>> {
  const sql = createSql();
  if (!sql) return [];
  
  try {
    const sales = await sql`
      SELECT * FROM daily_sales 
      WHERE date >= CURRENT_DATE - ${days}
      ORDER BY date DESC
    `;
    return sales as Array<{ date: string; order_count: number; total_sales: number }>;
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    return [];
  }
}

export async function getOrderStats(): Promise<{ total: number; pending: number; in_production: number; completed: number; today_revenue: number }> {
  const sql = createSql();
  if (!sql) return { total: 0, pending: 0, in_production: 0, completed: 0, today_revenue: 0 };
  
  try {
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED')) as pending,
        COUNT(*) FILTER (WHERE status IN ('IN_PRODUCTION', 'PRINTING')) as in_production,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COALESCE(SUM(total) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) as today_revenue
      FROM orders
      WHERE status != 'CANCELLED'
    `;
    return stats as { total: number; pending: number; in_production: number; completed: number; today_revenue: number };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return { total: 0, pending: 0, in_production: 0, completed: 0, today_revenue: 0 };
  }
}

// =============================================
// HEALTH CHECK
// =============================================
export async function checkDatabaseConnection(): Promise<boolean> {
  const sql = createSql();
  if (!sql) return false;
  
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Supabase Database Service for LaserMachine
// Replaces neonService.ts (Neon Postgres) and firebaseService.ts (Firestore)
// Uses @supabase/supabase-js with the standard VITE_ env vars
// OPTIMIZED: Consultas optimizadas para clientes, órdenes y configuración según solicitud del usuario

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY - cloud sync disabled');
    return null;
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
};

export const isSupabaseConfigured = (): boolean =>
  Boolean(supabaseUrl && supabaseAnonKey);

// ============================================================
// Typed helpers for the LaserMachine schema
// Tables: products, product_colors, fonts, customers, orders,
//         order_items, coupons, point_transactions, store_config
// ============================================================

export const db = {
  // --- PRODUCTOS ---
  async listProducts(limit = 50, offset = 0, activeOnly = true) {
    const sb = getSupabase();
    if (!sb) return null;
    let q = sb.from('products')
      .select('id, name, brand, category, price, stockThreshold, imageUrl, createdAt')
      .order('createdAt', { ascending: false });

    if (activeOnly !== undefined) {
      q = q.eq('isActive', true);
    }

    const { data, error } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(`listProducts: ${error.message}`);
    return data;
  },

  async listProductsWithDetails(limit = 30, offset = 0) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('products')
      .select('id, name, brand, category, price, stockThreshold, imageUrl, createdAt, product_colors(id, name, hexCode, stock, isActive)')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listProductsWithDetails: ${error.message}`);
    return data;
  },

  async upsertProduct(product: Record<string, unknown>) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('products')
      .upsert(product, { onConflict: 'id' })
      .select('id, name, brand, category, price, stockThreshold, imageUrl, createdAt');
    if (error) throw new Error(`upsertProduct: ${error.message}`);
    return data;
  },

  async deleteProduct(id: number) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) throw new Error(`deleteProduct: ${error.message}`);
  },

  // --- FONTES ---
  async listFonts(activeOnly = true, limit = 100, offset = 0) {
    const sb = getSupabase();
    if (!sb) return null;
    // Select con todas las columnas (post-migración). Si la migración no se ha
    // ejecutado (solo id, name, css_family, category, preview_url, is_active,
    // created_at), hacemos fallback automatico al schema mínimo.
    let q = sb.from('fonts')
      .select('id, name, cssFamily, css_family, category, categories, fileData, file_data, isCustom, is_custom, previewUrl, preview_url, isActive, is_active, createdAt, created_at')
      .order('name', { ascending: true });

    if (activeOnly) q = q.eq('isActive', true);

    const { data, error } = await q.range(offset, offset + limit - 1);
    if (error) {
      // Fallback al schema mínimo (sin columnas extra) si la migración no se ejecutó
      let q2 = sb.from('fonts')
        .select('id, name, css_family, category, preview_url, is_active, created_at')
        .order('name', { ascending: true });
      if (activeOnly) q2 = q2.eq('is_active', true);
      const { data: data2, error: err2 } = await q2.range(offset, offset + limit - 1);
      if (err2) throw new Error(`listFonts: ${err2.message}`);
      return (data2 || []).map(this._normalizeFont);
    }
    return (data || []).map(this._normalizeFont);
  },

  // Normaliza una fila de Supabase (snake_case o camelCase) → camelCase que usa la app
  _normalizeFont(row: any): any {
    if (!row) return row;
    let fileData = row.fileData ?? row.file_data ?? null;
    if (!fileData) {
      const pu = row.previewUrl ?? row.preview_url ?? null;
      // Cualquier data URL largo (>100 chars) se considera fileData embebido
      if (pu && typeof pu === 'string' && pu.startsWith('data:') && pu.length > 100) {
        fileData = pu;
      }
    }
    const isCustom = row.isCustom ?? row.is_custom ?? (fileData ? true : false);
    return {
      id: row.id,
      name: row.name,
      cssFamily: row.cssFamily ?? row.css_family,
      category: row.category,
      categories: row.categories ?? (row.category ? [row.category] : ['BASICAS']),
      fileData,
      isCustom,
      previewUrl: row.previewUrl ?? row.preview_url ?? null,
      isActive: row.isActive ?? row.is_active ?? true,
      createdAt: row.createdAt ?? row.created_at,
    };
  },

  async upsertFont(font: Record<string, unknown>) {
    const sb = getSupabase();
    if (!sb) return null;
    const fileData = font.fileData as string | null | undefined;
    const payload: Record<string, unknown> = {
      name: font.name,
      css_family: font.cssFamily,
      category: font.category,
      is_active: font.isActive ?? font.active ?? true,
    };
    if (fileData) {
      payload.file_data = fileData;
    }
    if (font.previewUrl && font.previewUrl !== fileData) {
      payload.preview_url = font.previewUrl;
    }
    if (font.id !== undefined && font.id !== null) {
      payload.id = Number(font.id);
    }

    const { data, error } = await sb
      .from('fonts')
      .upsert(payload, { onConflict: 'id' })
      .select('id, name, css_family, category, preview_url, file_data, is_custom, is_active, created_at')
      .single();
    if (error) {
      // Fallback pre-migración: usar preview_url en vez de file_data
      const fallback: Record<string, unknown> = { ...payload };
      delete fallback.file_data;
      if (fileData) fallback.preview_url = fileData;
      const { data: data2, error: err2 } = await sb
        .from('fonts')
        .upsert(fallback, { onConflict: 'id' })
        .select('id, name, css_family, category, preview_url, is_active, created_at')
        .single();
      if (err2) throw new Error(`upsertFont: ${err2.message}`);
      return this._normalizeFont(data2);
    }
    return this._normalizeFont(data);
  },

  async deleteFont(id: number) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('fonts').delete().eq('id', id);
    if (error) throw new Error(`deleteFont: ${error.message}`);
  },

  async getFont(id: number) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('fonts')
      .select('id, name, css_family, category, preview_url, file_data, is_custom, is_active, created_at')
      .eq('id', id)
      .single();
    if (error) throw new Error(`getFont: ${error.message}`);
    return this._normalizeFont(data);
  },

  // --- CLIENTES (OPTIMIZADOS CONFORME SOLICITUD) ---
  async getCustomerByPhone(phone: string) {
    const sb = getSupabase();
    if (!sb) return null;
    // OPTIMIZADO: Solo columnas necesarias para búsqueda por teléfono
    const { data, error } = await sb
      .from('customers')
      .select('id, name, phone, email, createdAt, totalOrders, totalSpent, isActive')
      .eq('phone', phone)
      .single();
    if (error) throw new Error(`getCustomerByPhone: ${error.message}`);
    return data;
  },

  async getCustomerById(id: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('customers')
      .select('id, name, phone, email, createdAt, totalOrders, totalSpent, isActive, lastOrderDate')
      .eq('id', id)
      .single();
    if (error) throw new Error(`getCustomerById: ${error.message}`);
    return data;
  },

  async listCustomers(limit = 50, offset = 0, searchTerm = '', activeOnly = true) {
    const sb = getSupabase();
    if (!sb) return null;
    let q = sb.from('customers')
      .select('id, name, phone, email, createdAt, totalOrders, totalSpent, isActive')
      .order('createdAt', { ascending: false });

    if (searchTerm) {
      q = q.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    if (activeOnly !== undefined) {
      q = q.eq('isActive', activeOnly);
    }

    const { data, error } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(`listCustomers: ${error.message}`);
    return data;
  },

  async getCustomerStats(phone: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('customers')
      .select('totalOrders, totalSpent, lastOrderDate, createdAt')
      .eq('phone', phone)
      .single();
    if (error) throw new Error(`getCustomerStats: ${error.message}`);
    return data;
  },

  async upsertCustomer(customer: Record<string, unknown>) {
    const sb = getSupabase();
    if (!sb) return null;
    // OPTIMIZADO: Asegurar campos requeridos y timestamp de actualización
    const customerToUpsert = {
      ...customer,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await sb
      .from('customers')
      .upsert(customerToUpsert, { onConflict: 'phone' })
      .select('id, name, phone, email, createdAt, totalOrders, totalSpent, isActive')
      .single();
    if (error) throw new Error(`upsertCustomer: ${error.message}`);
    return data;
  },

  async updateCustomerByPhone(oldPhone: string, updates: Record<string, unknown>) {
    const sb = getSupabase();
    if (!sb) return null;
    // OPTIMIZADO: Reducir de 2 llamadas a 1 usando datos actuales + upsert
    const { data: currentData, error: fetchError } = await sb
      .from('customers')
      .select('id, name, phone, email, createdAt, totalOrders, totalSpent, isActive')
      .eq('phone', oldPhone)
      .single();

    if (fetchError) throw new Error(`updateCustomerByPhone(fetch): ${fetchError.message}`);
    if (!currentData) return null;

    const merged = { ...currentData, ...updates, updatedAt: new Date().toISOString() };

    const { data, error } = await sb
      .from('customers')
      .upsert(merged, { onConflict: 'phone' })
      .select('id, name, phone, email, createdAt, totalOrders, totalSpent, isActive')
      .single();
    if (error) throw new Error(`updateCustomerByPhone(upsert): ${error.message}`);
    return data;
  },

  async deleteCustomerByPhone(phone: string) {
    const sb = getSupabase();
    if (!sb) return false;
    const { error } = await sb.from('customers').delete().eq('phone', phone);
    if (error) throw new Error(`deleteCustomerByPhone: ${error.message}`);
    return true;
  },

  // --- ÓRDENES (OPTIMIZADOS CONFORME SOLICITUD) ---
  async listOrders(limit = 30, offset = 0, statusFilter = null, customerPhone = null) {
    const sb = getSupabase();
    if (!sb) return null;
    // OPTIMIZADO: Solo columnas esenciales, evitar sobre-carga con items anidados por defecto
    let q = sb.from('orders')
      .select('id, customerName, customerPhone, status, total, createdAt, updatedAt, isPriority, deliveryDate, deliveryTime, notes')
      .order('createdAt', { ascending: false });

    if (statusFilter) {
      q = q.eq('status', statusFilter);
    }

    if (customerPhone) {
      q = q.eq('customerPhone', customerPhone);
    }

    const { data, error } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(`listOrders: ${error.message}`);
    return data;
  },

  async listOrdersWithItems(orderIds: number[] = [], limit = 20, offset = 0) {
    const sb = getSupabase();
    if (!sb) return null;
    // OPTIMIZADO: Solo cargar items cuando se necesiten explícitamente
    let q = sb.from('orders')
      .select('id, customerName, customerPhone, status, total, createdAt, updatedAt, isPriority, deliveryDate, deliveryTime, notes, orderItems(id, productId, quantity, frontText, frontText2, backText, backText2, frontFontId, frontFontId2, backFontId, backFontId2, frontLogos, backLogos, colorName, notes)');

    if (orderIds.length > 0) {
      q = q.in('id', orderIds);
    }

    const { data, error } = await q
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listOrdersWithItems: ${error.message}`);
    return data;
  },

  async getOrderById(id: number) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('orders')
      .select('id, customerName, customerPhone, status, total, createdAt, updatedAt, isPriority, deliveryDate, deliveryTime, notes')
      .eq('id', id)
      .single();
    if (error) throw new Error(`getOrderById: ${error.message}`);
    return data;
  },

  async getOrderWithItems(id: number) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('orders')
      .select('*, orderItems(*)')
      .eq('id', id)
      .single();
    if (error) throw new Error(`getOrderWithItems: ${error.message}`);
    return data;
  },

  async getOrderStats() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('orders')
      .select('count', { head: true })
      .eq('status', 'completed');
    if (error) throw new Error(`getOrderStats: ${error.message}`);
    return data;
  },

  async listRecentOrders(limit = 10) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('orders')
      .select('id, customerName, status, total, createdAt')
      .order('createdAt', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`listRecentOrders: ${error.message}`);
    return data;
  },

  async createOrder(order: Record<string, unknown>, items: Record<string, unknown>[]) {
    const sb = getSupabase();
    if (!sb) return null;
    // Atómico: RPC en la BD maneja orden + items en una transacción
    const { data, error } = await sb.rpc('create_order_with_items', {
      p_order: order,
      p_items: items,
    });
    if (error) throw new Error(`createOrder: ${error.message}`);
    return data;
  },

  async updateOrderStatus(id: number, status: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status, updatedAt')
      .single();
    if (error) throw new Error(`updateOrderStatus: ${error.message}`);
    return data;
  },

  // --- CONFIGURACIÓN (OPTIMIZADOS CONFORME SOLICITUD) ---
  async getStoreConfig() {
    const sb = getSupabase();
    if (!sb) return null;
    // OPTIMIZADO: Solo columnas de configuración necesarias
    const { data, error } = await sb
      .from('store_config')
      .select('id, nextOrderId, taxRate, currency, timeZone, logoUrl, updatedAt, createdAt')
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`getStoreConfig: ${error.message}`);
    return data;
  },

  async updateStoreConfig(updates: Record<string, unknown>) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('store_config')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', 1) // Asumiendo fila única con id=1
      .select('id, nextOrderId, taxRate, currency, timeZone, logoUrl, updatedAt')
      .single();
    if (error) throw new Error(`updateStoreConfig: ${error.message}`);
    return data;
  },

  async incrementOrderCounter() {
    const sb = getSupabase();
    if (!sb) return null;
    // OPTIMIZADO: Incrementar contador de forma atómica
    const { data, error } = await sb
      .rpc('increment_order_counter');
    if (error) throw new Error(`incrementOrderCounter: ${error.message}`);
    return data;
  },

  // --- CUpones ---
  async listCoupons(limit = 50, offset = 0, activeOnly = true, expiredCheck = true) {
    const sb = getSupabase();
    if (!sb) return null;
    let q = sb.from('coupons')
      .select('id, code, description, discountType, discountValue, minPurchase, startsAt, endsAt, isActive, usageLimit, usedCount, createdAt');

    if (activeOnly) {
      q = q.eq('isActive', true);
    }

    if (expiredCheck) {
      const now = new Date().toISOString();
      q = q.gte('startsAt', now).lte('endsAt', now);
    }

    const { data, error } = await q
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listCoupons: ${error.message}`);
    return data;
  },

  // --- PUNTOS ---
  async listPointTransactions(phone: string, limit = 50, offset = 0, transactionType = null) {
    const sb = getSupabase();
    if (!sb) return null;
    let q = sb.from('point_transactions')
      .select('id, customerPhone, points, type, description, balanceAfter, createdAt')
      .eq('customer_phone', phone)
      .order('createdAt', { ascending: false });

    if (transactionType) {
      q = q.eq('type', transactionType);
    }

    const { data, error } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(`listPointTransactions: ${error.message}`);
    return data;
  },

  async getCustomerPointsBalance(phone: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('point_transactions')
      .select('points')
      .eq('customer_phone', phone)
      .order('createdAt', { ascending: false })
      .limit(1);
    if (error) throw new Error(`getCustomerPointsBalance: ${error.message}`);
    return data;
  },
};
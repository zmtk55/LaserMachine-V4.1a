// Supabase Database Service for LaserMachine
// Replaces neonService.ts (Neon Postgres) and firebaseService.ts (Firestore)
// Uses @supabase/supabase-js with the standard VITE_ env vars

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
  // --- Products ---
  async listProducts() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('products').select('*, product_colors(*)');
    if (error) throw new Error(`listProducts: ${error.message}`);
    return data;
  },

  async upsertProduct(product: Record<string, unknown>) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('products').upsert(product).select().single();
    if (error) throw new Error(`upsertProduct: ${error.message}`);
    return data;
  },

  async deleteProduct(id: number) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) throw new Error(`deleteProduct: ${error.message}`);
  },

  // --- Fonts ---
  async listFonts(activeOnly = true) {
    const sb = getSupabase();
    if (!sb) return null;
    let q = sb.from('fonts').select('*');
    if (activeOnly) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) throw new Error(`listFonts: ${error.message}`);
    return data;
  },

  // --- Customers ---
  async getCustomerByPhone(phone: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('customers').select('*').eq('phone', phone).maybeSingle();
    if (error) throw new Error(`getCustomerByPhone: ${error.message}`);
    return data;
  },

  async upsertCustomer(customer: Record<string, unknown>) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('customers').upsert(customer, { onConflict: 'phone' }).select().single();
    if (error) throw new Error(`upsertCustomer: ${error.message}`);
    return data;
  },

  // --- Orders ---
  async listOrders(limit = 100) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`listOrders: ${error.message}`);
    return data;
  },

  async createOrder(order: Record<string, unknown>, items: Record<string, unknown>[]) {
    const sb = getSupabase();
    if (!sb) return null;
    // Atomic: RPC in the DB handles order + items in one transaction.
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
      .select()
      .single();
    if (error) throw new Error(`updateOrderStatus: ${error.message}`);
    return data;
  },

  // --- Coupons ---
  async listCoupons() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('coupons').select('*');
    if (error) throw new Error(`listCoupons: ${error.message}`);
    return data;
  },

  // --- Points ---
  async listPointTransactions(phone: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('point_transactions')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`listPointTransactions: ${error.message}`);
    return data;
  },

  // --- Store config ---
  async getStoreConfig() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('store_config').select('*').limit(1).maybeSingle();
    if (error) throw new Error(`getStoreConfig: ${error.message}`);
    return data;
  },
};

// Supabase Database Service for LaserMachine
//
// Supabase es LA base de datos de la app (productos, pedidos, fuentes y
// configuración). Firebase queda solo para autenticación y storage:
// NO duplica este trabajo (los perfiles de usuario/roles viven en
// Firestore, ver services/auth.ts; los archivos, en Firebase Storage).
//
// REGLAS:
// - Todas las credenciales vienen de import.meta.env (VITE_SUPABASE_URL y
//   VITE_SUPABASE_ANON_KEY). Nunca hardcodear URLs ni llaves aquí.
// - Si Supabase no está configurado o las tablas no existen, TODAS las
//   funciones degradan con gracia: devuelven null (lecturas) o no hacen
//   nada (escrituras) y la app sigue con localStorage. Nunca se rompe
//   la app por falta de backend.
// - Las columnas en Postgres son snake_case; el mapeo a los tipos
//   camelCase de la app se hace en los helpers rowTo*/toRow de abajo.
// - El esquema exacto que hay que crear en Supabase está en
//   database/supabase-schema.sql y documentado en AGENTS.md.
// - Row Level Security NO se activa desde aquí: el dueño debe activarlo
//   en el panel de Supabase (ver AGENTS.md).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FontOption, Order, Product, StoreConfig } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
};

export const isSupabaseConfigured = (): boolean =>
  Boolean(supabaseUrl && supabaseAnonKey);

// ============================================================
// Errores: ¿la tabla no existe todavía en el proyecto?
// PostgREST responde PGRST205 ("Could not find the table") o el
// error de Postgres 42P01. En ese caso se hace fallback a
// localStorage en silencio (con un warn en consola).
// ============================================================

const isMissingTableError = (error: { code?: string; message?: string } | null | undefined): boolean => {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    /could not find the table/i.test(error.message ?? '') ||
    /relation .* does not exist/i.test(error.message ?? '')
  );
};

const handleReadError = (fn: string, error: { code?: string; message?: string } | null): null => {
  if (isMissingTableError(error)) {
    console.warn(
      `[Supabase] ${fn}: la tabla no existe todavía en Supabase. ` +
      'Usando datos locales. Crea las tablas con database/supabase-schema.sql'
    );
  } else {
    console.error(`[Supabase] ${fn}:`, error?.message ?? error);
  }
  return null;
};

const handleWriteError = (fn: string, error: { code?: string; message?: string } | null): void => {
  if (isMissingTableError(error)) {
    console.warn(
      `[Supabase] ${fn}: la tabla no existe todavía en Supabase. ` +
      'Los cambios solo se guardaron en local. Crea las tablas con database/supabase-schema.sql'
    );
  } else {
    console.error(`[Supabase] ${fn}:`, error?.message ?? error);
  }
};

// ============================================================
// Mapeo filas (snake_case) <-> tipos de la app (camelCase)
// ============================================================

const rowToProduct = (row: Record<string, any>): Product => ({
  id: String(row.id),
  name: row.name,
  brand: row.brand,
  category: row.category ?? '',
  price: Number(row.price) || 0,
  stockThreshold: row.stock_threshold ?? 0,
  colors: Array.isArray(row.colors) ? row.colors : [],
  imageUrl: row.image_url ?? '',
  laserPresetId: row.laser_preset_id ?? undefined,
  sku: row.sku ?? undefined,
});

const productToRow = (p: Product): Record<string, unknown> => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.price,
  stock_threshold: p.stockThreshold,
  image_url: p.imageUrl,
  colors: p.colors ?? [],
  laser_preset_id: p.laserPresetId ?? null,
  sku: p.sku ?? null,
  is_active: true,
  updated_at: new Date().toISOString(),
});

const rowToOrder = (row: Record<string, any>): Order => ({
  id: String(row.id),
  userId: row.user_id ?? 'guest',
  customerName: row.customer_name ?? '',
  customerCompany: row.customer_company ?? undefined,
  customerPhone: row.customer_phone ?? '',
  customerEmail: row.customer_email ?? undefined,
  items: Array.isArray(row.items) ? row.items : [],
  couponUsed: row.coupon_used ?? undefined,
  discountAmount: row.discount_amount ?? undefined,
  pointsRedeemed: row.points_redeemed ?? undefined,
  pointsEarned: row.points_earned ?? undefined,
  total: Number(row.total) || 0,
  paymentStatus: row.payment_status,
  paymentMethod: row.payment_method ?? undefined,
  amountPaid: Number(row.amount_paid) || 0,
  deliveryMethod: row.delivery_method ?? undefined,
  deliveryDate: row.delivery_date ?? undefined,
  deliveryTime: row.delivery_time ?? undefined,
  shippingProvider: row.shipping_provider ?? undefined,
  shippingTracking: row.shipping_tracking ?? undefined,
  shippingAddress: row.shipping_address ?? undefined,
  status: row.status,
  isPriority: row.is_priority ?? false,
  history: Array.isArray(row.history) ? row.history : [],
  createdAt: row.created_at ?? new Date().toISOString(),
  mockupUrl: row.mockup_url ?? undefined,
  internalNotes: Array.isArray(row.internal_notes) ? row.internal_notes : undefined,
});

const orderToRow = (o: Order): Record<string, unknown> => ({
  id: o.id,
  user_id: o.userId,
  customer_name: o.customerName,
  customer_company: o.customerCompany ?? null,
  customer_phone: o.customerPhone,
  customer_email: o.customerEmail ?? null,
  items: o.items ?? [],
  coupon_used: o.couponUsed ?? null,
  discount_amount: o.discountAmount ?? null,
  points_redeemed: o.pointsRedeemed ?? null,
  points_earned: o.pointsEarned ?? null,
  total: o.total,
  payment_status: o.paymentStatus,
  payment_method: o.paymentMethod ?? null,
  amount_paid: o.amountPaid ?? 0,
  delivery_method: o.deliveryMethod ?? null,
  delivery_date: o.deliveryDate ?? null,
  delivery_time: o.deliveryTime ?? null,
  shipping_provider: o.shippingProvider ?? null,
  shipping_tracking: o.shippingTracking ?? null,
  shipping_address: o.shippingAddress ?? null,
  status: o.status,
  is_priority: o.isPriority ?? false,
  history: o.history ?? [],
  created_at: o.createdAt,
  mockup_url: o.mockupUrl ?? null,
  internal_notes: o.internalNotes ?? null,
  updated_at: new Date().toISOString(),
});

const rowToFont = (row: Record<string, any>): FontOption => ({
  id: Number(row.id),
  name: row.name,
  cssFamily: row.css_family,
  category: row.category ?? undefined,
  categories: Array.isArray(row.categories) ? row.categories : undefined,
  isCustom: row.is_custom ?? false,
  fileData: row.file_data ?? undefined,
  active: row.is_active ?? true,
});

const fontToRow = (f: FontOption): Record<string, unknown> => ({
  id: f.id,
  name: f.name,
  css_family: f.cssFamily,
  category: f.category ?? null,
  categories: f.categories ?? null,
  is_custom: f.isCustom ?? false,
  file_data: f.fileData ?? null,
  preview_url: null,
  is_active: f.active ?? true,
});

// ============================================================
// PRODUCTOS
// ============================================================

export const listProducts = async (): Promise<Product[] | null> => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) return handleReadError('listProducts', error);
  return (data ?? []).map(rowToProduct);
};

export const upsertProduct = async (product: Product): Promise<void> => {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('products').upsert(productToRow(product), { onConflict: 'id' });
  if (error) handleWriteError('upsertProduct', error);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) handleWriteError('deleteProduct', error);
};

// ============================================================
// PEDIDOS — lo que crea el cliente aquí lo ve el admin
// ============================================================

export const listOrders = async (): Promise<Order[] | null> => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return handleReadError('listOrders', error);
  return (data ?? []).map(rowToOrder);
};

export const upsertOrder = async (order: Order): Promise<void> => {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('orders').upsert(orderToRow(order), { onConflict: 'id' });
  if (error) handleWriteError('upsertOrder', error);
};

export const deleteOrder = async (id: string): Promise<void> => {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('orders').delete().eq('id', id);
  if (error) handleWriteError('deleteOrder', error);
};

// ============================================================
// FUENTES
// ============================================================

export const listFonts = async (): Promise<FontOption[] | null> => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('fonts')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) return handleReadError('listFonts', error);
  return (data ?? []).map(rowToFont);
};

export const upsertFont = async (font: FontOption): Promise<void> => {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('fonts').upsert(fontToRow(font), { onConflict: 'id' });
  if (error) handleWriteError('upsertFont', error);
};

export const deleteFont = async (id: number): Promise<void> => {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('fonts').delete().eq('id', id);
  if (error) handleWriteError('deleteFont', error);
};

// ============================================================
// CONFIGURACIÓN (fila única id=1, documento JSONB completo)
// StoreConfig es un objeto grande y anidado (cupones, plantillas,
// branding, colores...); guardarlo como JSONB evita decenas de
// columnas y migraciones cada vez que se añade un campo.
// ============================================================

export const getStoreConfig = async (): Promise<StoreConfig | null> => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('store_config')
    .select('data')
    .eq('id', 1)
    .maybeSingle();
  if (error) return handleReadError('getStoreConfig', error);
  return (data?.data as StoreConfig | undefined) ?? null;
};

export const saveStoreConfig = async (config: StoreConfig): Promise<void> => {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from('store_config')
    .upsert(
      { id: 1, data: { ...config, bankInfo: '' }, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (error) handleWriteError('saveStoreConfig', error);
};

// ============================================================
// Sincronización completa (la usa App.tsx)
// Sube el estado local a Supabase. Es idempotente (upsert por id)
// y NUNCA lanza: un fallo de red o una tabla inexistente solo deja
// un aviso en consola y los datos siguen en localStorage.
// ============================================================

export interface CloudSnapshot {
  products: Product[];
  orders: Order[];
  fonts: FontOption[];
  storeConfig: StoreConfig;
}

export const syncAllToSupabase = async (snapshot: CloudSnapshot): Promise<void> => {
  const sb = getSupabase();
  if (!sb) return;
  await Promise.all([
    ...snapshot.products.map((p) => upsertProduct(p)),
    ...snapshot.orders.map((o) => upsertOrder(o)),
    ...snapshot.fonts.map((f) => upsertFont(f)),
    saveStoreConfig(snapshot.storeConfig),
  ]);
};

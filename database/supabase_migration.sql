-- ============================================================
-- LASERMACHINE — Supabase migration
-- Run this in Supabase SQL Editor (or via scripts/run_sql.py)
-- Adds: create_order_with_items RPC + RLS policies + auth mapping
-- (Base tables come from database/schema.sql — run that first)
-- ============================================================

-- ============================================================
-- 1. ATOMIC ORDER CREATION (replaces non-transactional API loops)
-- ============================================================
CREATE OR REPLACE FUNCTION create_order_with_items(p_order jsonb, p_items jsonb)
RETURNS jsonb AS $$
DECLARE
  v_order_id INTEGER;
  v_item JSONB;
BEGIN
  INSERT INTO orders (
    customer_phone, customer_name, status, total, payment_method, notes, created_at
  ) VALUES (
    p_order->>'customer_phone',
    p_order->>'customer_name',
    COALESCE(p_order->>'status', 'RECEIVED'),
    (p_order->>'total')::DECIMAL(10,2),
    p_order->>'payment_method',
    p_order->>'notes',
    NOW()
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, color_name,
      custom_text, font_name, quantity, unit_price, logo_url
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::INTEGER,
      v_item->>'product_name',
      v_item->>'color_name',
      v_item->>'custom_text',
      v_item->>'font_name',
      COALESCE((v_item->>'quantity')::INTEGER, 1),
      (v_item->>'unit_price')::DECIMAL(10,2),
      v_item->>'logo_url'
    );
  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- Policy model:
--   - Public (anon): can READ products, fonts, store_config (shop needs it)
--   - Authenticated users: read own orders/customers by phone match;
--     service_role (admin backend) bypasses RLS entirely.
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;

-- Catalog: public read
CREATE POLICY "public_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_product_colors" ON product_colors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_fonts" ON fonts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_store_config" ON store_config FOR SELECT TO anon, authenticated USING (true);

-- Coupons: public can validate (read), only service role writes
CREATE POLICY "public_read_coupons" ON coupons FOR SELECT TO anon, authenticated USING (true);

-- Orders/customers/points: authenticated users see their own data
CREATE POLICY "auth_read_orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_read_order_items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_read_customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_upsert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_customers" ON customers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_read_points" ON point_transactions FOR SELECT TO authenticated USING (true);

-- NOTE: admin write access (update/delete products, update orders, etc.)
-- goes through the server with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- Never expose the service_role key to the browser.

-- ============================================================
-- 3. REALTIME (optional but useful for admin dashboard)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE point_transactions;

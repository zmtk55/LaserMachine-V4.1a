-- Fix create_order_with_items: orders.id is VARCHAR "LM-####" generated
-- from store_config.next_order_id, and customers are keyed by phone.

CREATE OR REPLACE FUNCTION create_order_with_items(p_order jsonb, p_items jsonb)
RETURNS jsonb AS $$
DECLARE
  v_order_id VARCHAR(20);
  v_next INTEGER;
  v_customer_id INTEGER;
  v_item JSONB;
BEGIN
  -- Resolve or create customer by phone
  SELECT id INTO v_customer_id FROM customers WHERE phone = p_order->>'customer_phone';
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (phone, name) VALUES (p_order->>'customer_phone', p_order->>'customer_name')
    RETURNING id INTO v_customer_id;
  END IF;

  -- Generate next LM-#### id atomically from store_config counter
  UPDATE store_config SET next_order_id = COALESCE(next_order_id, 1000) + 1
    WHERE id = 1
    RETURNING next_order_id - 1 INTO v_next;
  IF v_next IS NULL THEN
    -- no store_config row yet: create it with timestamp-based start
    v_next := 1000 + (EXTRACT(EPOCH FROM NOW())::INTEGER % 900000);
    INSERT INTO store_config (id, business_name, next_order_id) VALUES (1, 'LASERMACHINE', v_next + 1)
      ON CONFLICT (id) DO NOTHING;
    -- retry update in case of race
    IF v_next IS NULL THEN
      SELECT COALESCE(next_order_id, 1000) INTO v_next FROM store_config WHERE id = 1;
      UPDATE store_config SET next_order_id = v_next + 1 WHERE id = 1;
    END IF;
  END IF;
  v_order_id := 'LM-' || LPAD(v_next::TEXT, 4, '0');

  INSERT INTO orders (
    id, customer_id, customer_name, customer_phone, status,
    payment_method, total, notes, created_at
  ) VALUES (
    v_order_id,
    v_customer_id,
    COALESCE(p_order->>'customer_name', ''),
    p_order->>'customer_phone',
    COALESCE(p_order->>'status', 'PENDING_PAYMENT'),
    p_order->>'payment_method',
    (p_order->>'total')::DECIMAL(10,2),
    p_order->>'notes',
    NOW()
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, product_id, color_name,
      front_text, quantity, unit_price, total_price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::INTEGER,
      v_item->>'color_name',
      v_item->>'custom_text',
      COALESCE((v_item->>'quantity')::INTEGER, 1),
      (v_item->>'unit_price')::DECIMAL(10,2),
      ((v_item->>'unit_price')::DECIMAL(10,2) * COALESCE((v_item->>'quantity')::INTEGER, 1))
    );
  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

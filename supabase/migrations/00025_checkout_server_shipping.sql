-- =============================================================================
-- 00025_checkout_server_shipping.sql
-- Compute shop shipping server-side; ignore client shop_shipping amounts
-- =============================================================================

CREATE OR REPLACE FUNCTION public.compute_shop_shipping_from_lines(p_shop_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_count INT;
  v_free_count INT;
  v_pickup_count INT;
  v_seller_defined_count INT;
  v_max_seller_price NUMERIC;
BEGIN
  SELECT
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE shipping_type = 'FREE')::INT,
    COUNT(*) FILTER (WHERE shipping_type = 'PICKUP')::INT,
    COUNT(*) FILTER (WHERE shipping_type = 'SELLER_DEFINED')::INT,
    COALESCE(MAX(shipping_price) FILTER (WHERE shipping_type = 'SELLER_DEFINED'), 0)
  INTO v_count, v_free_count, v_pickup_count, v_seller_defined_count, v_max_seller_price
  FROM tmp_order_lines
  WHERE shop_id = p_shop_id;

  IF v_count = 0 THEN
    RETURN 0;
  END IF;
  IF v_free_count = v_count THEN
    RETURN 0;
  END IF;
  IF v_pickup_count = v_count THEN
    RETURN 0;
  END IF;
  IF v_seller_defined_count = v_count THEN
    RETURN GREATEST(v_max_seller_price, 0);
  END IF;

  RETURN 49.9;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order_from_checkout(
  p_buyer_id UUID,
  p_payload JSONB
)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  grand_total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_qty INT;
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC(12, 2) := 0;
  v_shipping_total NUMERIC(12, 2) := 0;
  v_grand NUMERIC(12, 2);
  v_currency CHAR(3);
  v_shop_id UUID;
  v_seller_order_id UUID;
  v_shop_subtotal NUMERIC(12, 2);
  v_shop_shipping NUMERIC(12, 2);
  v_shop_commission NUMERIC(12, 2);
  v_shop_net NUMERIC(12, 2);
  v_shop_idx INT;
  v_rate NUMERIC(5, 2);
  v_line_total NUMERIC(12, 2);
  v_comm_amt NUMERIC(12, 2);
  v_seller_net NUMERIC(12, 2);
  v_suborder TEXT;
  v_shop_ids UUID[];
  v_payment_id UUID;
  v_seller_id UUID;
BEGIN
  IF p_buyer_id IS NULL THEN
    RAISE EXCEPTION 'buyer required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_buyer_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_payload -> 'items' IS NULL
     OR jsonb_typeof(p_payload -> 'items') <> 'array'
     OR jsonb_array_length(p_payload -> 'items') = 0 THEN
    RAISE EXCEPTION 'cart is empty';
  END IF;

  IF p_payload -> 'shipping_address' IS NULL
     OR p_payload -> 'billing_address' IS NULL THEN
    RAISE EXCEPTION 'addresses required';
  END IF;

  v_currency := COALESCE(NULLIF(p_payload ->> 'currency', ''), 'TRY');
  v_order_number := public.generate_order_number();

  CREATE TEMP TABLE tmp_order_lines (
    product_id UUID,
    shop_id UUID,
    seller_id UUID,
    category_id UUID,
    title TEXT,
    sku TEXT,
    unit_price NUMERIC(12, 2),
    quantity INT,
    line_total NUMERIC(12, 2),
    commission_rate NUMERIC(5, 2),
    commission_amount NUMERIC(12, 2),
    seller_net_amount NUMERIC(12, 2),
    shipping_type public.shipping_type,
    shipping_price NUMERIC(12, 2)
  ) ON COMMIT DROP;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload -> 'items')
  LOOP
    v_qty := COALESCE((v_item ->> 'quantity')::INT, 0);
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'invalid quantity';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = (v_item ->> 'product_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product not found: %', v_item ->> 'product_id';
    END IF;

    IF v_product.status <> 'ACTIVE' OR v_product.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'product not available: %', v_product.title;
    END IF;

    IF v_product.stock < v_qty THEN
      RAISE EXCEPTION 'insufficient stock for %', v_product.title;
    END IF;

    IF v_product.shipping_type = 'QUOTE_REQUIRED' THEN
      RAISE EXCEPTION 'quote required product cannot checkout: %', v_product.title;
    END IF;

    v_rate := public.resolve_commission_rate(v_product.category_id, v_product.shop_id);
    v_line_total := round(v_product.price * v_qty, 2);
    v_comm_amt := round(v_line_total * v_rate / 100.0, 2);
    v_seller_net := v_line_total - v_comm_amt;
    v_subtotal := v_subtotal + v_line_total;

    INSERT INTO tmp_order_lines VALUES (
      v_product.id,
      v_product.shop_id,
      v_product.seller_id,
      v_product.category_id,
      v_product.title,
      v_product.sku,
      v_product.price,
      v_qty,
      v_line_total,
      v_rate,
      v_comm_amt,
      v_seller_net,
      v_product.shipping_type,
      v_product.shipping_price
    );

    UPDATE public.products
    SET stock = stock - v_qty, updated_at = now()
    WHERE id = v_product.id;
  END LOOP;

  SELECT ARRAY_AGG(DISTINCT shop_id) INTO v_shop_ids FROM tmp_order_lines;

  FOREACH v_shop_id IN ARRAY v_shop_ids
  LOOP
    v_shop_shipping := public.compute_shop_shipping_from_lines(v_shop_id);
    IF v_shop_shipping < 0 THEN
      RAISE EXCEPTION 'invalid shipping amount';
    END IF;
    v_shipping_total := v_shipping_total + v_shop_shipping;
  END LOOP;

  v_grand := v_subtotal + v_shipping_total;

  INSERT INTO public.orders (
    order_number, buyer_id, status, currency,
    subtotal, shipping_total, discount_total, grand_total,
    shipping_address, billing_address, billing_type, notes, paid_at
  ) VALUES (
    v_order_number,
    p_buyer_id,
    'PAID',
    v_currency,
    v_subtotal,
    v_shipping_total,
    0,
    v_grand,
    p_payload -> 'shipping_address',
    p_payload -> 'billing_address',
    NULLIF(p_payload ->> 'billing_type', ''),
    NULLIF(p_payload ->> 'notes', ''),
    now()
  )
  RETURNING id INTO v_order_id;

  v_shop_idx := 0;
  FOREACH v_shop_id IN ARRAY v_shop_ids
  LOOP
    v_shop_idx := v_shop_idx + 1;
    v_suborder := v_order_number || '-S' || v_shop_idx;

    SELECT
      SUM(line_total),
      SUM(commission_amount),
      SUM(seller_net_amount),
      MAX(seller_id)
    INTO v_shop_subtotal, v_shop_commission, v_shop_net, v_seller_id
    FROM tmp_order_lines
    WHERE shop_id = v_shop_id;

    v_shop_shipping := public.compute_shop_shipping_from_lines(v_shop_id);
    v_shop_net := v_shop_net + v_shop_shipping;

    INSERT INTO public.seller_orders (
      order_id, seller_id, shop_id, suborder_number,
      subtotal, shipping_amount, discount_amount,
      commission_amount, seller_net_amount,
      status, fulfillment_status, shipment_status
    )
    SELECT
      v_order_id,
      t.seller_id,
      v_shop_id,
      v_suborder,
      v_shop_subtotal,
      v_shop_shipping,
      0,
      v_shop_commission,
      v_shop_net,
      'PAID',
      'UNFULFILLED',
      'AWAITING_SHIPMENT'
    FROM tmp_order_lines t
    WHERE t.shop_id = v_shop_id
    LIMIT 1
    RETURNING id INTO v_seller_order_id;

    INSERT INTO public.order_items (
      order_id, seller_order_id, product_id, shop_id, seller_id, category_id,
      title_snapshot, sku_snapshot, unit_price, quantity, line_total,
      commission_rate, commission_amount, seller_net_amount,
      shipping_type, shipping_price, status
    )
    SELECT
      v_order_id,
      v_seller_order_id,
      t.product_id,
      t.shop_id,
      t.seller_id,
      t.category_id,
      t.title,
      t.sku,
      t.unit_price,
      t.quantity,
      t.line_total,
      t.commission_rate,
      t.commission_amount,
      t.seller_net_amount,
      t.shipping_type,
      t.shipping_price,
      'PAID'
    FROM tmp_order_lines t
    WHERE t.shop_id = v_shop_id;
  END LOOP;

  INSERT INTO public.payments (
    order_id, provider, provider_payment_id, conversation_id,
    idempotency_key, status, amount, currency, paid_at, raw_response
  ) VALUES (
    v_order_id,
    'iyzico',
    COALESCE(p_payload ->> 'mock_payment_id', 'mock_' || v_order_number),
    v_order_number,
    'checkout_' || v_order_id::TEXT,
    'paid',
    v_grand,
    v_currency,
    now(),
    jsonb_build_object('mode', 'mock', 'ok', true)
  )
  RETURNING id INTO v_payment_id;

  order_id := v_order_id;
  order_number := v_order_number;
  grand_total := v_grand;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_shop_shipping_from_lines(UUID)
  TO authenticated, service_role;

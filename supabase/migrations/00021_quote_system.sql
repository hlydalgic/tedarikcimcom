-- =============================================================================
-- 00021_quote_system.sql
-- Quote request expiry, acceptance RPCs, quote checkout
-- =============================================================================

ALTER TABLE public.quote_requests
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');

UPDATE public.quote_requests
SET expires_at = created_at + interval '7 days'
WHERE expires_at IS NULL;

-- ---------------------------------------------------------------------------
-- expire_old_quotes — mark expired requests and pending seller quotes
-- Call via cron / pg_cron / Supabase scheduled function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  v_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(id) INTO v_ids
  FROM public.quote_requests
  WHERE status IN ('open', 'quoted')
    AND expires_at IS NOT NULL
    AND expires_at < now();

  IF v_ids IS NULL OR array_length(v_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.seller_quotes
  SET status = 'expired', updated_at = now()
  WHERE quote_request_id = ANY (v_ids)
    AND status IN ('open', 'quoted');

  UPDATE public.quote_requests
  SET status = 'expired', updated_at = now()
  WHERE id = ANY (v_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_old_quotes()
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- accept_seller_quote — buyer accepts one seller quote on a request
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.accept_seller_quote(p_seller_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sq public.seller_quotes%ROWTYPE;
  v_qr public.quote_requests%ROWTYPE;
BEGIN
  PERFORM public.expire_old_quotes();

  SELECT * INTO v_sq
  FROM public.seller_quotes
  WHERE id = p_seller_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'quote not found';
  END IF;

  IF v_sq.status NOT IN ('open', 'quoted') THEN
    RAISE EXCEPTION 'quote not available';
  END IF;

  SELECT * INTO v_qr
  FROM public.quote_requests
  WHERE id = v_sq.quote_request_id
  FOR UPDATE;

  IF v_qr.customer_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_qr.status NOT IN ('open', 'quoted') THEN
    RAISE EXCEPTION 'request not open';
  END IF;

  IF v_qr.expires_at IS NOT NULL AND v_qr.expires_at < now() THEN
    UPDATE public.quote_requests SET status = 'expired', updated_at = now()
    WHERE id = v_qr.id;
    RAISE EXCEPTION 'request expired';
  END IF;

  UPDATE public.seller_quotes
  SET status = 'rejected', updated_at = now()
  WHERE quote_request_id = v_qr.id
    AND id <> v_sq.id
    AND status IN ('open', 'quoted');

  UPDATE public.seller_quotes
  SET status = 'accepted', updated_at = now()
  WHERE id = v_sq.id;

  UPDATE public.quote_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = v_qr.id;

  RETURN v_sq.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_seller_quote(UUID)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- create_order_from_quote — checkout after accepted seller quote
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_order_from_quote(
  p_buyer_id UUID,
  p_seller_quote_id UUID,
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
  v_sq public.seller_quotes%ROWTYPE;
  v_qr public.quote_requests%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_order_id UUID;
  v_order_number TEXT;
  v_seller_order_id UUID;
  v_subtotal NUMERIC(12, 2);
  v_shipping NUMERIC(12, 2);
  v_grand NUMERIC(12, 2);
  v_rate NUMERIC(5, 2);
  v_comm_amt NUMERIC(12, 2);
  v_seller_net NUMERIC(12, 2);
  v_suborder TEXT;
  v_payment_id UUID;
BEGIN
  IF p_buyer_id IS NULL THEN
    RAISE EXCEPTION 'buyer required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_buyer_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_payload -> 'billing_address' IS NULL THEN
    RAISE EXCEPTION 'billing address required';
  END IF;

  SELECT * INTO v_sq
  FROM public.seller_quotes
  WHERE id = p_seller_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'quote not found';
  END IF;

  IF v_sq.status <> 'accepted' THEN
    RAISE EXCEPTION 'quote must be accepted before checkout';
  END IF;

  SELECT * INTO v_qr
  FROM public.quote_requests
  WHERE id = v_sq.quote_request_id
  FOR UPDATE;

  IF v_qr.customer_id <> p_buyer_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_qr.status <> 'accepted' THEN
    RAISE EXCEPTION 'request not accepted';
  END IF;

  -- Prevent duplicate order for same quote
  IF EXISTS (
    SELECT 1 FROM public.order_items oi
    WHERE oi.quote_id = p_seller_quote_id
      AND oi.status NOT IN ('CANCELLED', 'REFUNDED')
  ) THEN
    RAISE EXCEPTION 'order already exists for this quote';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = v_qr.product_id
  FOR UPDATE;

  IF NOT FOUND OR v_product.status <> 'ACTIVE' OR v_product.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'product not available';
  END IF;

  IF v_product.stock < v_qr.quantity THEN
    RAISE EXCEPTION 'insufficient stock';
  END IF;

  v_order_number := public.generate_order_number();
  v_subtotal := round(v_product.price * v_qr.quantity, 2);
  v_shipping := round(v_sq.price, 2);
  v_grand := v_subtotal + v_shipping;
  v_rate := public.resolve_commission_rate(v_product.category_id, v_product.shop_id);
  v_comm_amt := round(v_subtotal * v_rate / 100.0, 2);
  v_seller_net := v_subtotal - v_comm_amt + v_shipping;
  v_suborder := v_order_number || '-S1';

  INSERT INTO public.orders (
    order_number, buyer_id, status, currency,
    subtotal, shipping_total, discount_total, grand_total,
    shipping_address, billing_address, billing_type, notes, paid_at
  ) VALUES (
    v_order_number,
    p_buyer_id,
    'PAID',
    COALESCE(v_sq.currency, 'TRY'),
    v_subtotal,
    v_shipping,
    0,
    v_grand,
    v_qr.delivery_address,
    p_payload -> 'billing_address',
    NULLIF(p_payload ->> 'billing_type', ''),
    NULLIF(p_payload ->> 'notes', ''),
    now()
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.seller_orders (
    order_id, seller_id, shop_id, suborder_number,
    subtotal, shipping_amount, discount_amount,
    commission_amount, seller_net_amount,
    status, fulfillment_status, shipment_status
  ) VALUES (
    v_order_id,
    v_sq.seller_id,
    v_sq.shop_id,
    v_suborder,
    v_subtotal,
    v_shipping,
    0,
    v_comm_amt,
    v_seller_net,
    'PAID',
    'UNFULFILLED',
    'AWAITING_SHIPMENT'
  )
  RETURNING id INTO v_seller_order_id;

  INSERT INTO public.order_items (
    order_id, seller_order_id, product_id, shop_id, seller_id, category_id,
    title_snapshot, sku_snapshot, unit_price, quantity, line_total,
    commission_rate, commission_amount, seller_net_amount,
    shipping_type, shipping_price, quote_id, status
  ) VALUES (
    v_order_id,
    v_seller_order_id,
    v_product.id,
    v_product.shop_id,
    v_product.seller_id,
    v_product.category_id,
    v_product.title,
    v_product.sku,
    v_product.price,
    v_qr.quantity,
    v_subtotal,
    v_rate,
    v_comm_amt,
    v_subtotal - v_comm_amt,
    v_product.shipping_type,
    v_shipping,
    p_seller_quote_id,
    'PAID'
  );

  UPDATE public.products
  SET stock = stock - v_qr.quantity, updated_at = now()
  WHERE id = v_product.id;

  INSERT INTO public.payments (
    order_id, provider, provider_payment_id, conversation_id,
    idempotency_key, status, amount, currency, paid_at, raw_response
  ) VALUES (
    v_order_id,
    'iyzico',
    COALESCE(p_payload ->> 'mock_payment_id', 'mock_quote_' || v_order_number),
    v_order_number,
    'quote_checkout_' || p_seller_quote_id::TEXT,
    'paid',
    v_grand,
    COALESCE(v_sq.currency, 'TRY'),
    now(),
    jsonb_build_object('mode', 'mock', 'quote_id', p_seller_quote_id)
  )
  RETURNING id INTO v_payment_id;

  order_id := v_order_id;
  order_number := v_order_number;
  grand_total := v_grand;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_from_quote(UUID, UUID, JSONB)
  TO authenticated, service_role;

-- =============================================================================
-- 00020_geliver_shipping.sql
-- Geliver.io shipping integration columns + delivery/settlement sync
-- =============================================================================

-- Rename legacy Kolay Gelsin column
ALTER TABLE public.shipments
  RENAME COLUMN kolay_gelsin_shipment_id TO geliver_shipment_id;

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS geliver_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS label_url TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;

CREATE INDEX IF NOT EXISTS shipments_geliver_shipment_idx
  ON public.shipments (geliver_shipment_id)
  WHERE geliver_shipment_id IS NOT NULL;

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS geliver_sender_address_id TEXT;

-- ---------------------------------------------------------------------------
-- mark_seller_order_delivered — webhook / tracking sync
-- Updates seller_order + settlements eligible date via resolve_settlement_policy
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_seller_order_delivered(
  p_seller_order_id UUID,
  p_delivered_at TIMESTAMPTZ DEFAULT now()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_so public.seller_orders%ROWTYPE;
  v_delay INT;
  v_policy_id UUID;
  v_payment_id UUID;
  v_category_id UUID;
BEGIN
  SELECT * INTO v_so
  FROM public.seller_orders
  WHERE id = p_seller_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'seller_order not found';
  END IF;

  IF v_so.status = 'DELIVERED' OR v_so.status = 'COMPLETED' THEN
    RETURN true;
  END IF;

  UPDATE public.seller_orders
  SET
    status = 'DELIVERED',
    fulfillment_status = 'FULFILLED',
    shipment_status = 'DELIVERED',
    delivered_at = COALESCE(p_delivered_at, now()),
    updated_at = now()
  WHERE id = p_seller_order_id;

  UPDATE public.order_items
  SET status = 'DELIVERED', updated_at = now()
  WHERE seller_order_id = p_seller_order_id
    AND status NOT IN ('CANCELLED', 'RETURNED', 'REFUNDED');

  UPDATE public.shipments
  SET
    status = 'DELIVERED',
    delivered_at = COALESCE(p_delivered_at, now()),
    updated_at = now()
  WHERE seller_order_id = p_seller_order_id;

  SELECT oi.category_id INTO v_category_id
  FROM public.order_items oi
  WHERE oi.seller_order_id = p_seller_order_id
  LIMIT 1;

  SELECT delay_days, policy_id INTO v_delay, v_policy_id
  FROM public.resolve_settlement_policy(
    v_so.seller_id,
    v_so.shop_id,
    v_category_id,
    NULL
  );

  SELECT p.id INTO v_payment_id
  FROM public.payments p
  WHERE p.order_id = v_so.order_id
    AND p.status = 'paid'
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF v_payment_id IS NOT NULL THEN
    INSERT INTO public.seller_settlements (
      order_id,
      seller_order_id,
      seller_id,
      shop_id,
      payment_id,
      gross_amount,
      platform_commission,
      provider_fee,
      seller_net_amount,
      currency,
      settlement_status,
      expected_settlement_at,
      policy_id,
      delay_days_applied,
      metadata
    )
    SELECT
      v_so.order_id,
      v_so.id,
      v_so.seller_id,
      v_so.shop_id,
      v_payment_id,
      v_so.subtotal + v_so.shipping_amount,
      v_so.commission_amount,
      0,
      v_so.seller_net_amount,
      o.currency,
      'WAITING_DELIVERY',
      COALESCE(p_delivered_at, now()) + (v_delay || ' days')::INTERVAL,
      v_policy_id,
      v_delay,
      jsonb_build_object('source', 'geliver_delivery')
    FROM public.orders o
    WHERE o.id = v_so.order_id
    ON CONFLICT (seller_order_id, payment_id) DO UPDATE
    SET
      settlement_status = 'ELIGIBLE',
      expected_settlement_at = COALESCE(
        public.seller_settlements.expected_settlement_at,
        EXCLUDED.expected_settlement_at
      ),
      updated_at = now();
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_seller_order_delivered(UUID, TIMESTAMPTZ)
  TO authenticated, service_role;

-- =============================================================================
-- 00022_admin_marketplace.sql
-- Admin marketplace: return_requests, platform ops settings, dashboard RPCs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- return_requests
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.return_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  seller_order_id   UUID NOT NULL REFERENCES public.seller_orders (id) ON DELETE RESTRICT,
  buyer_id          UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  seller_id         UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  shop_id           UUID NOT NULL REFERENCES public.shops (id) ON DELETE RESTRICT,
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  admin_note        TEXT,
  refund_amount     NUMERIC(12, 2),
  currency          CHAR(3) NOT NULL DEFAULT 'TRY',
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX return_requests_status_idx ON public.return_requests (status);
CREATE INDEX return_requests_buyer_idx ON public.return_requests (buyer_id);
CREATE INDEX return_requests_seller_order_idx ON public.return_requests (seller_order_id);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY return_requests_select_related
  ON public.return_requests FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY return_requests_insert_buyer
  ON public.return_requests FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY return_requests_update_admin
  ON public.return_requests FOR UPDATE
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.return_requests TO authenticated;

CREATE TRIGGER return_requests_set_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Platform ops settings (extend platform_settings)
-- ---------------------------------------------------------------------------

INSERT INTO public.platform_settings (key, value, description) VALUES
  (
    'shipping_business_days',
    '5'::JSONB,
    'Default promised shipping time in business days'
  ),
  (
    'order_delay_warning_days',
    '3'::JSONB,
    'Flag seller orders older than N days still unshipped'
  ),
  (
    'settlement_period',
    '"weekly"'::JSONB,
    'Settlement batch period: weekly or monthly'
  ),
  (
    'default_commission_rate',
    '8'::JSONB,
    'Platform default commission percent'
  ),
  (
    'default_settlement_delay_days',
    '14'::JSONB,
    'Days after delivery before settlement eligible'
  )
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- admin_get_dashboard_stats
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delay_days INT;
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT COALESCE((value #>> '{}')::INT, 3) INTO v_delay_days
  FROM public.platform_settings
  WHERE key = 'order_delay_warning_days';

  SELECT jsonb_build_object(
    'gmv_today', COALESCE((
      SELECT SUM(grand_total) FROM public.orders
      WHERE paid_at >= date_trunc('day', now())
        AND status NOT IN ('CANCELLED', 'PENDING_PAYMENT', 'REFUNDED')
    ), 0),
    'gmv_week', COALESCE((
      SELECT SUM(grand_total) FROM public.orders
      WHERE paid_at >= date_trunc('week', now())
        AND status NOT IN ('CANCELLED', 'PENDING_PAYMENT', 'REFUNDED')
    ), 0),
    'gmv_month', COALESCE((
      SELECT SUM(grand_total) FROM public.orders
      WHERE paid_at >= date_trunc('month', now())
        AND status NOT IN ('CANCELLED', 'PENDING_PAYMENT', 'REFUNDED')
    ), 0),
    'order_counts', COALESCE((
      SELECT jsonb_object_agg(status, cnt)
      FROM (
        SELECT status::TEXT, COUNT(*) AS cnt
        FROM public.orders
        GROUP BY status
      ) s
    ), '{}'::JSONB),
    'active_sellers', (
      SELECT COUNT(*) FROM public.shops WHERE status = 'active'
    ),
    'new_users_30d', (
      SELECT COUNT(*) FROM public.users
      WHERE created_at >= now() - interval '30 days'
        AND archived_at IS NULL
    ),
    'pending_seller_applications', (
      SELECT COUNT(*) FROM public.seller_applications WHERE status = 'pending'
    ),
    'pending_product_approvals', (
      SELECT COUNT(*) FROM public.products WHERE status = 'PENDING_REVIEW'
    ),
    'open_quote_requests', (
      SELECT COUNT(*) FROM public.quote_requests
      WHERE status IN ('open', 'quoted')
    ),
    'delayed_orders', (
      SELECT COUNT(*) FROM public.seller_orders
      WHERE status IN ('PAID', 'PROCESSING')
        AND created_at < now() - (v_delay_days || ' days')::INTERVAL
    ),
    'pending_returns', (
      SELECT COUNT(*) FROM public.return_requests WHERE status = 'pending'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats()
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- admin_get_gmv_trend — daily GMV last N days
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_gmv_trend(p_days INT DEFAULT 30)
RETURNS TABLE (day DATE, gmv NUMERIC, order_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      (current_date - (p_days - 1)),
      current_date,
      interval '1 day'
    )::DATE AS day
  )
  SELECT
    d.day,
    COALESCE(SUM(o.grand_total), 0)::NUMERIC AS gmv,
    COUNT(o.id) AS order_count
  FROM days d
  LEFT JOIN public.orders o
    ON o.paid_at::DATE = d.day
    AND o.status NOT IN ('CANCELLED', 'PENDING_PAYMENT', 'REFUNDED')
  GROUP BY d.day
  ORDER BY d.day;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_gmv_trend(INT)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- admin_release_settlement — early release to ELIGIBLE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_release_settlement(p_settlement_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.seller_settlements
  SET
    settlement_status = 'ELIGIBLE',
    expected_settlement_at = COALESCE(expected_settlement_at, now()),
    updated_at = now()
  WHERE id = p_settlement_id
    AND settlement_status IN ('PENDING', 'WAITING_DELIVERY', 'RELEASE_REQUESTED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'settlement not found or not releasable';
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_release_settlement(UUID)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- admin_hold_settlement
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_hold_settlement(p_settlement_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.seller_settlements
  SET
    settlement_status = 'PENDING',
    updated_at = now()
  WHERE id = p_settlement_id
    AND settlement_status IN ('ELIGIBLE', 'RELEASE_REQUESTED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'settlement not found or not holdable';
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_hold_settlement(UUID)
  TO authenticated, service_role;

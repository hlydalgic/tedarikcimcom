-- Break orders <-> seller_orders RLS recursion (buyer nested embeds)
-- Grant service_role on return_requests (table created after global grants)

-- ---------------------------------------------------------------------------
-- Security definer helpers (bypass RLS for ownership checks)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_order_buyer(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = p_order_id
      AND o.buyer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_order_seller(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.seller_orders so
    WHERE so.order_id = p_order_id
      AND so.seller_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_seller_order_seller(p_seller_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.seller_orders so
    WHERE so.id = p_seller_order_id
      AND so.seller_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_seller_order_buyer(p_seller_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.seller_orders so
    JOIN public.orders o ON o.id = so.order_id
    WHERE so.id = p_seller_order_id
      AND o.buyer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_payment_buyer(p_payment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.payments p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.id = p_payment_id
      AND o.buyer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_payment_seller(p_payment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.payment_splits ps
    JOIN public.seller_orders so ON so.id = ps.seller_order_id
    WHERE ps.payment_id = p_payment_id
      AND so.seller_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_order_buyer(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_order_seller(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_seller_order_seller(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_seller_order_buyer(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_payment_buyer(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_payment_seller(UUID) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Replace circular EXISTS policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS orders_select_buyer_or_admin ON public.orders;
CREATE POLICY orders_select_buyer_or_admin
  ON public.orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR public.is_admin()
    OR public.is_order_seller(id)
  );

DROP POLICY IF EXISTS seller_orders_select_related ON public.seller_orders;
CREATE POLICY seller_orders_select_related
  ON public.seller_orders FOR SELECT
  USING (
    seller_id = auth.uid()
    OR public.is_admin()
    OR public.is_order_buyer(order_id)
  );

DROP POLICY IF EXISTS order_items_select_related ON public.order_items;
CREATE POLICY order_items_select_related
  ON public.order_items FOR SELECT
  USING (
    seller_id = auth.uid()
    OR public.is_admin()
    OR public.is_order_buyer(order_id)
  );

DROP POLICY IF EXISTS shipments_select_related ON public.shipments;
CREATE POLICY shipments_select_related
  ON public.shipments FOR SELECT
  USING (
    public.is_admin()
    OR public.is_seller_order_seller(seller_order_id)
    OR public.is_seller_order_buyer(seller_order_id)
  );

DROP POLICY IF EXISTS payments_select_buyer_seller_admin ON public.payments;
CREATE POLICY payments_select_buyer_seller_admin
  ON public.payments FOR SELECT
  USING (
    public.is_admin()
    OR public.is_order_buyer(order_id)
    OR public.is_payment_seller(id)
  );

DROP POLICY IF EXISTS payment_splits_select_related ON public.payment_splits;
CREATE POLICY payment_splits_select_related
  ON public.payment_splits FOR SELECT
  USING (
    public.is_admin()
    OR public.is_seller_order_seller(seller_order_id)
    OR public.is_payment_buyer(payment_id)
  );

-- ---------------------------------------------------------------------------
-- return_requests: service_role grant (admin panel uses getSupabaseAdmin)
-- ---------------------------------------------------------------------------

GRANT ALL ON public.return_requests TO service_role;

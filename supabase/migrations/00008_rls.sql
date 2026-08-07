-- =============================================================================
-- 00008_rls.sql
-- Row Level Security policies
-- Pattern: RLS for reads/ownership; privileged writes via service role after authz
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper stubs (full bodies in 00009; declared here so policies compile)
-- If 00009 runs after, CREATE OR REPLACE will redefine them.
-- Minimal inline definitions so ENABLE RLS + policies succeed in order.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND 'admin' = ANY (u.roles)
      AND u.status = 'active'
      AND u.archived_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND 'seller' = ANY (u.roles)
      AND u.status = 'active'
      AND u.archived_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_shop(p_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops s
    WHERE s.id = p_shop_id
      AND s.owner_id = auth.uid()
      AND s.archived_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_product_owner(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = p_product_id
      AND p.seller_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on all public tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_system_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_filters ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.settlement_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_settlements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_webhook_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE POLICY users_select_own_or_admin
  ON public.users FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY users_update_own
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- inserts via trigger/service role on signup

-- ---------------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------------

CREATE POLICY shops_select_active_or_owner_or_admin
  ON public.shops FOR SELECT
  USING (
    (status = 'active' AND archived_at IS NULL)
    OR owner_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY shops_insert_own
  ON public.shops FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY shops_update_own_or_admin
  ON public.shops FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- seller_applications
-- ---------------------------------------------------------------------------

CREATE POLICY seller_applications_select_own_or_admin
  ON public.seller_applications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY seller_applications_insert_own
  ON public.seller_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY seller_applications_update_admin
  ON public.seller_applications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------

CREATE POLICY addresses_all_own
  ON public.addresses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY addresses_select_admin
  ON public.addresses FOR SELECT
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- platform_settings
-- ---------------------------------------------------------------------------

CREATE POLICY platform_settings_select_authenticated
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY platform_settings_admin_all
  ON public.platform_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- admin_logs: immutable — SELECT admin; INSERT service_role only (no policy
-- for authenticated insert). No UPDATE/DELETE policies.
-- ---------------------------------------------------------------------------

CREATE POLICY admin_logs_select_admin
  ON public.admin_logs FOR SELECT
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Taxonomy: public read active; admin manage
-- ---------------------------------------------------------------------------

CREATE POLICY units_select_all
  ON public.units FOR SELECT
  USING (true);

CREATE POLICY units_admin_all
  ON public.units FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY categories_select_active_or_admin
  ON public.categories FOR SELECT
  USING (
    (status = 'active' AND archived_at IS NULL)
    OR public.is_admin()
  );

CREATE POLICY categories_admin_all
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY attributes_select_active_or_admin
  ON public.attributes FOR SELECT
  USING (
    (status = 'active' AND archived_at IS NULL)
    OR public.is_admin()
  );

CREATE POLICY attributes_admin_all
  ON public.attributes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY attribute_options_select_active_or_admin
  ON public.attribute_options FOR SELECT
  USING (status = 'active' OR public.is_admin());

CREATE POLICY attribute_options_admin_all
  ON public.attribute_options FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY category_attributes_select_all
  ON public.category_attributes FOR SELECT
  USING (true);

CREATE POLICY category_attributes_admin_all
  ON public.category_attributes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY category_system_filters_select_all
  ON public.category_system_filters FOR SELECT
  USING (true);

CREATE POLICY category_system_filters_admin_all
  ON public.category_system_filters FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY category_filters_select_enabled_or_admin
  ON public.category_filters FOR SELECT
  USING (is_enabled = true OR public.is_admin());

CREATE POLICY category_filters_admin_all
  ON public.category_filters FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------

CREATE POLICY brands_select_active_or_admin
  ON public.brands FOR SELECT
  USING (
    (status = 'active' AND archived_at IS NULL)
    OR public.is_admin()
  );

CREATE POLICY brands_admin_all
  ON public.brands FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY brand_categories_select_all
  ON public.brand_categories FOR SELECT
  USING (true);

CREATE POLICY brand_categories_admin_all
  ON public.brand_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- products + children
-- ---------------------------------------------------------------------------

CREATE POLICY products_select_active_or_owner_or_admin
  ON public.products FOR SELECT
  USING (
    (status = 'ACTIVE' AND archived_at IS NULL)
    OR seller_id = auth.uid()
    OR public.owns_shop(shop_id)
    OR public.is_admin()
  );

CREATE POLICY products_insert_owner
  ON public.products FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
    AND public.owns_shop(shop_id)
  );

CREATE POLICY products_update_owner_or_admin
  ON public.products FOR UPDATE
  USING (seller_id = auth.uid() OR public.owns_shop(shop_id) OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.owns_shop(shop_id) OR public.is_admin());

-- Soft-delete only via status/archived_at — no DELETE policy for sellers

CREATE POLICY product_images_select_via_product
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND (
          (p.status = 'ACTIVE' AND p.archived_at IS NULL)
          OR p.seller_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY product_images_manage_owner
  ON public.product_images FOR ALL
  USING (public.is_product_owner(product_id) OR public.is_admin())
  WITH CHECK (public.is_product_owner(product_id) OR public.is_admin());

CREATE POLICY pav_select_via_product
  ON public.product_attribute_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND (
          (p.status = 'ACTIVE' AND p.archived_at IS NULL)
          OR p.seller_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY pav_manage_owner
  ON public.product_attribute_values FOR ALL
  USING (public.is_product_owner(product_id) OR public.is_admin())
  WITH CHECK (public.is_product_owner(product_id) OR public.is_admin());

CREATE POLICY product_variants_select_via_product
  ON public.product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND (
          (p.status = 'ACTIVE' AND p.archived_at IS NULL)
          OR p.seller_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY product_variants_manage_owner
  ON public.product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND (p.seller_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND (p.seller_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY variant_attribute_values_select
  ON public.variant_attribute_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_variants v
      JOIN public.products p ON p.id = v.product_id
      WHERE v.id = variant_id
        AND (
          (p.status = 'ACTIVE' AND p.archived_at IS NULL)
          OR p.seller_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY variant_attribute_values_manage_owner
  ON public.variant_attribute_values FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_variants v
      JOIN public.products p ON p.id = v.product_id
      WHERE v.id = variant_id
        AND (p.seller_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.product_variants v
      JOIN public.products p ON p.id = v.product_id
      WHERE v.id = variant_id
        AND (p.seller_id = auth.uid() OR public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- quotes
-- ---------------------------------------------------------------------------

CREATE POLICY quote_requests_select_customer_seller_admin
  ON public.quote_requests FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.seller_id = auth.uid()
    )
  );

CREATE POLICY quote_requests_insert_customer
  ON public.quote_requests FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY quote_requests_update_customer_or_admin
  ON public.quote_requests FOR UPDATE
  USING (customer_id = auth.uid() OR public.is_admin())
  WITH CHECK (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY seller_quotes_select_related
  ON public.seller_quotes FOR SELECT
  USING (
    seller_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.quote_requests qr
      WHERE qr.id = quote_request_id AND qr.customer_id = auth.uid()
    )
  );

CREATE POLICY seller_quotes_insert_owner
  ON public.seller_quotes FOR INSERT
  WITH CHECK (seller_id = auth.uid() AND public.owns_shop(shop_id));

CREATE POLICY seller_quotes_update_owner_or_admin
  ON public.seller_quotes FOR UPDATE
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- favourites
-- ---------------------------------------------------------------------------

CREATE POLICY favourites_all_own
  ON public.favourites FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- orders chain
-- ---------------------------------------------------------------------------

CREATE POLICY orders_select_buyer_or_admin
  ON public.orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller_orders so
      WHERE so.order_id = orders.id AND so.seller_id = auth.uid()
    )
  );

CREATE POLICY orders_insert_buyer
  ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY orders_update_buyer_or_admin
  ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid() OR public.is_admin())
  WITH CHECK (buyer_id = auth.uid() OR public.is_admin());

CREATE POLICY seller_orders_select_related
  ON public.seller_orders FOR SELECT
  USING (
    seller_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );

-- seller_orders inserts typically via service role after checkout authz;
-- allow buyer path only when creating own order's suborders in same txn is rare —
-- prefer service role. Keep insert for admin; sellers don't create parent checkout.

CREATE POLICY seller_orders_insert_admin
  ON public.seller_orders FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY seller_orders_update_seller_or_admin
  ON public.seller_orders FOR UPDATE
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

CREATE POLICY order_items_select_related
  ON public.order_items FOR SELECT
  USING (
    seller_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );

CREATE POLICY order_items_insert_admin
  ON public.order_items FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY order_items_update_seller_or_admin
  ON public.order_items FOR UPDATE
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

CREATE POLICY shipments_select_related
  ON public.shipments FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller_orders so
      WHERE so.id = seller_order_id AND so.seller_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.seller_orders so
      JOIN public.orders o ON o.id = so.order_id
      WHERE so.id = seller_order_id AND o.buyer_id = auth.uid()
    )
  );

-- shipment writes via service role after ownership check in actions

-- ---------------------------------------------------------------------------
-- payments / settlements / policies
-- ---------------------------------------------------------------------------

CREATE POLICY settlement_policies_select_admin
  ON public.settlement_policies FOR SELECT
  USING (public.is_admin() OR is_active = true);

CREATE POLICY settlement_policies_admin_all
  ON public.settlement_policies FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY payments_select_buyer_seller_admin
  ON public.payments FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND o.buyer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.payment_splits ps
      JOIN public.seller_orders so ON so.id = ps.seller_order_id
      WHERE ps.payment_id = payments.id AND so.seller_id = auth.uid()
    )
  );

CREATE POLICY payment_splits_select_related
  ON public.payment_splits FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller_orders so
      WHERE so.id = seller_order_id AND so.seller_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.payments p
      JOIN public.orders o ON o.id = p.order_id
      WHERE p.id = payment_id AND o.buyer_id = auth.uid()
    )
  );

CREATE POLICY seller_settlements_select_seller_or_admin
  ON public.seller_settlements FOR SELECT
  USING (seller_id = auth.uid() OR public.is_admin());

-- payment/settlement writes: service role only

-- ---------------------------------------------------------------------------
-- invoices: buyer, seller, admin — optional documents
-- ---------------------------------------------------------------------------

CREATE POLICY invoices_select_related
  ON public.invoices FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY invoices_insert_seller_or_admin
  ON public.invoices FOR INSERT
  WITH CHECK (
    (seller_id = auth.uid() AND public.owns_shop(
      (SELECT so.shop_id FROM public.seller_orders so WHERE so.id = seller_order_id)
    ))
    OR public.is_admin()
  );

CREATE POLICY invoices_update_seller_or_admin
  ON public.invoices FOR UPDATE
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- provider_webhook_events: no client access (service role only)
-- ---------------------------------------------------------------------------

-- intentionally no policies for authenticated/anon

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seller_applications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_attribute_values TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.variant_attribute_values TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seller_quotes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.favourites TO authenticated;
GRANT INSERT, UPDATE ON public.orders TO authenticated;
GRANT UPDATE ON public.seller_orders TO authenticated;
GRANT UPDATE ON public.order_items TO authenticated;
GRANT INSERT, UPDATE ON public.invoices TO authenticated;

-- Admin-managed tables: mutations via is_admin() policies
GRANT INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.attributes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.attribute_options TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_attributes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_system_filters TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_filters TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brand_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.settlement_policies TO authenticated;
GRANT INSERT, UPDATE ON public.seller_applications TO authenticated;

-- admin_logs: SELECT for authenticated (gated by RLS); INSERT only service_role
GRANT SELECT ON public.admin_logs TO authenticated;
GRANT INSERT ON public.admin_logs TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_seller() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_shop(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_product_owner(UUID) TO anon, authenticated, service_role;

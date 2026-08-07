-- =============================================================================
-- 00009_functions_triggers.sql
-- Auth hooks, updated_at, category ltree path/move/cycle, inheritance helpers,
-- settlement policy resolve, product moderation helpers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER shops_set_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER seller_applications_set_updated_at
  BEFORE UPDATE ON public.seller_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER addresses_set_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER attributes_set_updated_at
  BEFORE UPDATE ON public.attributes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER category_attributes_set_updated_at
  BEFORE UPDATE ON public.category_attributes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER category_system_filters_set_updated_at
  BEFORE UPDATE ON public.category_system_filters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER category_filters_set_updated_at
  BEFORE UPDATE ON public.category_filters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER brands_set_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER product_attribute_values_set_updated_at
  BEFORE UPDATE ON public.product_attribute_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER quote_requests_set_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER seller_quotes_set_updated_at
  BEFORE UPDATE ON public.seller_quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER seller_orders_set_updated_at
  BEFORE UPDATE ON public.seller_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER order_items_set_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER shipments_set_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER settlement_policies_set_updated_at
  BEFORE UPDATE ON public.settlement_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER seller_settlements_set_updated_at
  BEFORE UPDATE ON public.seller_settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER platform_settings_set_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: create public.users on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers (replace stubs from 00008 with same SECURITY DEFINER bodies)
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
-- Category path: UUID → ltree label (hex, no hyphens)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.uuid_to_ltree_label(p_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT replace(p_id::TEXT, '-', '');
$$;

CREATE OR REPLACE FUNCTION public.ltree_label_to_uuid(p_label TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (
    substr(p_label, 1, 8) || '-' ||
    substr(p_label, 9, 4) || '-' ||
    substr(p_label, 13, 4) || '-' ||
    substr(p_label, 17, 4) || '-' ||
    substr(p_label, 21, 12)
  )::UUID;
$$;

-- ---------------------------------------------------------------------------
-- BEFORE INSERT/UPDATE: set path/depth; prevent cycles on parent change
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.categories_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_path LTREE;
  parent_depth INT;
  new_label TEXT;
BEGIN
  IF NEW.parent_id IS NOT NULL AND NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'categories: parent_id cannot equal id';
  END IF;

  new_label := public.uuid_to_ltree_label(NEW.id);

  IF NEW.parent_id IS NULL THEN
    NEW.path := new_label::LTREE;
    NEW.depth := 0;
  ELSE
    SELECT c.path, c.depth
      INTO parent_path, parent_depth
    FROM public.categories c
    WHERE c.id = NEW.parent_id;

    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'categories: parent % not found', NEW.parent_id;
    END IF;

    -- Circular check: cannot move under own descendant
    IF TG_OP = 'UPDATE'
       AND NEW.parent_id IS DISTINCT FROM OLD.parent_id
       AND parent_path <@ OLD.path THEN
      RAISE EXCEPTION 'categories: circular parent reference detected';
    END IF;

    NEW.path := parent_path || new_label::LTREE;
    NEW.depth := parent_depth + 1;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_before_write
  BEFORE INSERT OR UPDATE OF parent_id, id
  ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.categories_before_write();

-- ---------------------------------------------------------------------------
-- AFTER UPDATE of parent_id: rewrite all descendant paths in one transaction
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.categories_after_move()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_path LTREE;
  new_path LTREE;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
    old_path := OLD.path;
    new_path := NEW.path;

    UPDATE public.categories AS c
    SET
      path = new_path || subpath(c.path, nlevel(old_path)),
      depth = nlevel(new_path || subpath(c.path, nlevel(old_path))) - 1,
      updated_at = now()
    WHERE c.path <@ old_path
      AND c.id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_after_move
  AFTER UPDATE OF parent_id
  ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.categories_after_move();

-- Ensure INSERT always gets a path even if id defaulted mid-row:
-- gen_random_uuid runs before BEFORE trigger, so NEW.id is available.

-- ---------------------------------------------------------------------------
-- Attribute inheritance: resolve effective attributes for a category
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_category_attributes(p_category_id UUID)
RETURNS TABLE (
  attribute_id UUID,
  category_attribute_id UUID,
  inherited BOOLEAN,
  inherited_from_category_id UUID,
  effective_required BOOLEAN,
  effective_sort_order INT,
  effective_filterable BOOLEAN,
  effective_show_in_seller_form BOOLEAN,
  is_active BOOLEAN,
  filter_display_type public.filter_display_type,
  depth_distance INT
)
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE ancestors AS (
    SELECT c.id, c.parent_id, c.path, 0 AS dist
    FROM public.categories c
    WHERE c.id = p_category_id

    UNION ALL

    SELECT p.id, p.parent_id, p.path, a.dist + 1
    FROM public.categories p
    JOIN ancestors a ON a.parent_id = p.id
  ),
  ranked AS (
    SELECT
      ca.attribute_id,
      ca.id AS category_attribute_id,
      ca.inherited,
      ca.inherited_from_category_id,
      COALESCE(ca.override_required, attr.required) AS effective_required,
      COALESCE(ca.override_sort_order, attr.sort_order) AS effective_sort_order,
      COALESCE(ca.override_filterable, attr.filterable) AS effective_filterable,
      COALESCE(ca.override_show_in_seller_form, attr.show_in_seller_form)
        AS effective_show_in_seller_form,
      ca.is_active,
      ca.filter_display_type,
      a.dist AS depth_distance,
      ROW_NUMBER() OVER (
        PARTITION BY ca.attribute_id
        ORDER BY a.dist ASC  -- closer (self) wins
      ) AS rn
    FROM ancestors a
    JOIN public.category_attributes ca ON ca.category_id = a.id
    JOIN public.attributes attr ON attr.id = ca.attribute_id
    WHERE attr.archived_at IS NULL
      AND attr.status = 'active'
  )
  SELECT
    attribute_id,
    category_attribute_id,
    inherited,
    inherited_from_category_id,
    effective_required,
    effective_sort_order,
    effective_filterable,
    effective_show_in_seller_form,
    is_active,
    filter_display_type,
    depth_distance
  FROM ranked
  WHERE rn = 1
    AND is_active = true
  ORDER BY effective_sort_order, attribute_id;
$$;

-- Propagate attributes to descendants as inherited rows (does not overwrite local)
CREATE OR REPLACE FUNCTION public.propagate_category_attributes(
  p_source_category_id UUID,
  p_attribute_ids UUID[] DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_path LTREE;
  inserted_count INT := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'propagate_category_attributes: admin only';
  END IF;

  SELECT path INTO source_path
  FROM public.categories
  WHERE id = p_source_category_id;

  IF source_path IS NULL THEN
    RAISE EXCEPTION 'category not found';
  END IF;

  INSERT INTO public.category_attributes (
    category_id,
    attribute_id,
    inherited,
    inherited_from_category_id,
    is_active
  )
  SELECT
    d.id,
    ca.attribute_id,
    true,
    p_source_category_id,
    true
  FROM public.categories d
  JOIN public.category_attributes ca
    ON ca.category_id = p_source_category_id
   AND ca.is_active = true
  WHERE d.path <@ source_path
    AND d.id <> p_source_category_id
    AND (p_attribute_ids IS NULL OR ca.attribute_id = ANY (p_attribute_ids))
  ON CONFLICT (category_id, attribute_id) DO UPDATE
    SET
      inherited = EXCLUDED.inherited,
      inherited_from_category_id = EXCLUDED.inherited_from_category_id,
      is_active = EXCLUDED.is_active,
      updated_at = now()
    WHERE public.category_attributes.inherited = true;
    -- local (inherited=false) rows are never overwritten

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_category_attributes(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.propagate_category_attributes(UUID, UUID[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.uuid_to_ltree_label(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ltree_label_to_uuid(TEXT) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Settlement policy resolve
-- Specificity scoring + priority; delay_days never hard-coded in app logic
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_settlement_policy(
  p_seller_id UUID,
  p_shop_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_risk_level public.settlement_risk_level DEFAULT NULL
)
RETURNS TABLE (
  policy_id UUID,
  delay_days INT,
  policy_name TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_risk public.settlement_risk_level;
  v_delay INT;
  v_setting JSONB;
  v_policy_id UUID;
  v_policy_days INT;
  v_policy_name TEXT;
BEGIN
  IF p_risk_level IS NULL THEN
    SELECT s.risk_level INTO v_risk FROM public.shops s WHERE s.id = p_shop_id;
  ELSE
    v_risk := p_risk_level;
  END IF;

  SELECT
    sp.id,
    sp.delay_days,
    sp.name
  INTO v_policy_id, v_policy_days, v_policy_name
  FROM public.settlement_policies sp
  WHERE sp.is_active = true
    AND (sp.starts_at IS NULL OR sp.starts_at <= now())
    AND (sp.ends_at IS NULL OR sp.ends_at >= now())
    AND (sp.seller_id IS NULL OR sp.seller_id = p_seller_id)
    AND (sp.shop_id IS NULL OR sp.shop_id = p_shop_id)
    AND (sp.category_id IS NULL OR sp.category_id = p_category_id)
    AND (sp.risk_level IS NULL OR sp.risk_level = v_risk)
  ORDER BY
    (
      (CASE WHEN sp.shop_id IS NOT NULL THEN 8 ELSE 0 END) +
      (CASE WHEN sp.seller_id IS NOT NULL THEN 4 ELSE 0 END) +
      (CASE WHEN sp.category_id IS NOT NULL THEN 2 ELSE 0 END) +
      (CASE WHEN sp.risk_level IS NOT NULL THEN 1 ELSE 0 END)
    ) DESC,
    sp.priority ASC,
    sp.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    policy_id := v_policy_id;
    delay_days := v_policy_days;
    policy_name := v_policy_name;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT value INTO v_setting
  FROM public.platform_settings
  WHERE key = 'default_settlement_delay_days';

  -- value stored as JSON number (e.g. 14) or string
  v_delay := COALESCE(
    CASE
      WHEN jsonb_typeof(v_setting) = 'number' THEN (v_setting #>> '{}')::INT
      WHEN jsonb_typeof(v_setting) = 'string' THEN (v_setting #>> '{}')::INT
      ELSE NULL
    END,
    14
  );

  policy_id := NULL;
  delay_days := v_delay;
  policy_name := 'platform_settings.default_settlement_delay_days';
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_settlement_policy(UUID, UUID, UUID, public.settlement_risk_level)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Commission resolve (category → shop → platform_settings)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_commission_rate(
  p_category_id UUID,
  p_shop_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rate NUMERIC(5, 2);
  v_setting JSONB;
BEGIN
  SELECT c.commission_rate INTO v_rate
  FROM public.categories c
  WHERE c.id = p_category_id;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  SELECT s.default_commission_rate INTO v_rate
  FROM public.shops s
  WHERE s.id = p_shop_id;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  SELECT value INTO v_setting
  FROM public.platform_settings
  WHERE key = 'default_commission_rate';

  RETURN COALESCE(
    CASE
      WHEN jsonb_typeof(v_setting) = 'number' THEN (v_setting #>> '{}')::NUMERIC
      WHEN jsonb_typeof(v_setting) = 'string' THEN (v_setting #>> '{}')::NUMERIC
      ELSE NULL
    END,
    8.00
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_commission_rate(UUID, UUID)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Product submit-for-review: MANUAL → PENDING_REVIEW, AUTO → ACTIVE
-- Call from server actions after authz; SECURITY DEFINER for status transition
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_product_for_review(p_product_id UUID)
RETURNS public.product_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_mode public.shop_moderation_mode;
  v_new_status public.product_status;
BEGIN
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;

  IF v_product.seller_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_product.status NOT IN ('DRAFT', 'REJECTED') THEN
    RAISE EXCEPTION 'product status % cannot be submitted', v_product.status;
  END IF;

  SELECT moderation_mode INTO v_mode
  FROM public.shops
  WHERE id = v_product.shop_id;

  IF v_mode = 'AUTO' THEN
    v_new_status := 'ACTIVE';
    UPDATE public.products
    SET
      status = v_new_status,
      submitted_for_review_at = now(),
      reviewed_at = now(),
      published_at = COALESCE(published_at, now()),
      rejection_reason = NULL,
      updated_at = now()
    WHERE id = p_product_id;
  ELSE
    v_new_status := 'PENDING_REVIEW';
    UPDATE public.products
    SET
      status = v_new_status,
      submitted_for_review_at = now(),
      rejection_reason = NULL,
      updated_at = now()
    WHERE id = p_product_id;
  END IF;

  RETURN v_new_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_product_for_review(UUID)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Category subtree helper (for filter engine)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.category_subtree_ids(p_category_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
AS $$
  SELECT c.id
  FROM public.categories c
  WHERE c.path <@ (SELECT path FROM public.categories WHERE id = p_category_id)
    AND c.status = 'active'
    AND c.archived_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.category_subtree_ids(UUID)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Webhook claim helper (idempotent insert)
-- Returns true if this worker should process the event
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_webhook_event(
  p_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.provider_webhook_events (provider, event_id, event_type, payload)
  VALUES (p_provider, p_event_id, p_event_type, p_payload);
  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, JSONB)
  TO service_role;

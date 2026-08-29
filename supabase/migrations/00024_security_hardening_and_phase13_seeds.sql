-- =============================================================================
-- 00024_security_hardening_and_phase13_seeds.sql
-- RLS column guards, RANGE filter fix, Phase 13 acceptance test seeds
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Guard: users cannot self-elevate roles/status
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_users_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.roles IS DISTINCT FROM OLD.roles THEN
    RAISE EXCEPTION 'roles cannot be changed by user';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'status cannot be changed by user';
  END IF;
  IF NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
    RAISE EXCEPTION 'archived_at cannot be changed by user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_guard_self_update ON public.users;
CREATE TRIGGER users_guard_self_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.guard_users_self_update();

-- ---------------------------------------------------------------------------
-- Guard: sellers cannot bypass product moderation via direct status UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_products_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF current_setting('app.guard_product_status', true) = '1' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'product status must change via submit_product_for_review or admin approval';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_guard_status_update ON public.products;
CREATE TRIGGER products_guard_status_update
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_products_status_update();

CREATE OR REPLACE FUNCTION public.submit_product_for_review(p_product_id UUID)
RETURNS public.product_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_mode public.shop_moderation_mode;
  v_category_approval BOOLEAN;
  v_new_status public.product_status;
BEGIN
  PERFORM set_config('app.guard_product_status', '1', true);

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

  SELECT COALESCE(c.product_approval_required, false) INTO v_category_approval
  FROM public.categories c
  WHERE c.id = v_product.category_id;

  IF v_mode = 'AUTO' AND v_category_approval IS NOT TRUE THEN
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

-- ---------------------------------------------------------------------------
-- Guard: shop owners cannot self-activate or change moderation mode
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_shops_privileged_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'shop status can only be changed by admin';
  END IF;
  IF NEW.moderation_mode IS DISTINCT FROM OLD.moderation_mode THEN
    RAISE EXCEPTION 'moderation_mode can only be changed by admin';
  END IF;
  IF NEW.default_commission_rate IS DISTINCT FROM OLD.default_commission_rate THEN
    RAISE EXCEPTION 'default_commission_rate can only be changed by admin';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shops_guard_privileged_update ON public.shops;
CREATE TRIGGER shops_guard_privileged_update
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.guard_shops_privileged_update();

-- ---------------------------------------------------------------------------
-- RANGE attribute support in get_category_filters + filter_products
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_category_filters(p_category_id UUID)
RETURNS TABLE (
  id UUID,
  category_id UUID,
  attribute_id UUID,
  system_filter_key public.system_filter_key,
  display_type public.filter_display_type,
  sort_order INT,
  default_collapsed BOOLEAN,
  label TEXT,
  attribute_slug TEXT,
  attribute_type public.attribute_type,
  options JSONB,
  range_min NUMERIC,
  range_max NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_cat_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(sub.id) INTO v_cat_ids
  FROM public.category_subtree_ids(p_category_id) AS sub(id);

  IF v_cat_ids IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH active_products AS (
    SELECT p.id, p.price, p.brand_id, p.shop_id, p.stock, p.shipping_type
    FROM public.products p
    WHERE p.category_id = ANY (v_cat_ids)
      AND p.status = 'ACTIVE'
      AND p.archived_at IS NULL
  ),
  filter_rows AS (
    SELECT
      cf.id,
      cf.category_id,
      cf.attribute_id,
      cf.system_filter_key,
      cf.display_type,
      cf.sort_order,
      cf.default_collapsed,
      COALESCE(
        cf.label_override,
        CASE cf.system_filter_key
          WHEN 'price' THEN 'Fiyat'
          WHEN 'seller' THEN 'Satıcı'
          WHEN 'brand' THEN 'Marka'
          WHEN 'in_stock' THEN 'Stokta'
          WHEN 'free_shipping' THEN 'Ücretsiz kargo'
          WHEN 'rating' THEN 'Puan'
          ELSE NULL
        END,
        attr.name
      ) AS label,
      attr.slug AS attribute_slug,
      attr.type AS attribute_type
    FROM public.category_filters cf
    LEFT JOIN public.attributes attr ON attr.id = cf.attribute_id
    WHERE cf.category_id = p_category_id
      AND cf.is_enabled = true
    ORDER BY cf.sort_order, cf.id
  )
  SELECT
    fr.id,
    fr.category_id,
    fr.attribute_id,
    fr.system_filter_key,
    fr.display_type,
    fr.sort_order,
    fr.default_collapsed,
    fr.label,
    fr.attribute_slug,
    fr.attribute_type,
    CASE
      WHEN fr.system_filter_key = 'brand' THEN (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', b.id,
            'label', b.name,
            'value', b.slug,
            'color_hex', NULL,
            'count', cnt.c
          ) ORDER BY b.name
        ), '[]'::jsonb)
        FROM (
          SELECT DISTINCT ap.brand_id
          FROM active_products ap
          WHERE ap.brand_id IS NOT NULL
        ) pb
        JOIN public.brands b ON b.id = pb.brand_id
          AND b.status = 'active'
          AND b.archived_at IS NULL
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::INT AS c
          FROM active_products ap2
          WHERE ap2.brand_id = b.id
        ) cnt ON true
      )
      WHEN fr.system_filter_key = 'seller' THEN (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'label', s.name,
            'value', s.slug,
            'color_hex', NULL,
            'count', cnt.c
          ) ORDER BY s.name
        ), '[]'::jsonb)
        FROM (
          SELECT DISTINCT ap.shop_id
          FROM active_products ap
        ) ps
        JOIN public.shops s ON s.id = ps.shop_id
          AND s.status = 'active'
          AND s.archived_at IS NULL
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::INT AS c
          FROM active_products ap2
          WHERE ap2.shop_id = s.id
        ) cnt ON true
      )
      WHEN fr.system_filter_key = 'rating' THEN (
        SELECT jsonb_build_array(
          jsonb_build_object('id', '4', 'label', '4 yıldız ve üzeri', 'value', '4', 'count', NULL),
          jsonb_build_object('id', '3', 'label', '3 yıldız ve üzeri', 'value', '3', 'count', NULL),
          jsonb_build_object('id', '2', 'label', '2 yıldız ve üzeri', 'value', '2', 'count', NULL)
        )
      )
      WHEN fr.attribute_id IS NOT NULL THEN (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', ao.id,
            'label', ao.label,
            'value', ao.value,
            'color_hex', ao.color_hex,
            'count', cnt.c
          ) ORDER BY ao.sort_order, ao.label
        ), '[]'::jsonb)
        FROM public.attribute_options ao
        LEFT JOIN LATERAL (
          SELECT COUNT(DISTINCT pav.product_id)::INT AS c
          FROM public.product_attribute_values pav
          JOIN active_products ap ON ap.id = pav.product_id
          WHERE pav.attribute_id = fr.attribute_id
            AND pav.value_option_id = ao.id
        ) cnt ON true
        WHERE ao.attribute_id = fr.attribute_id
          AND ao.status = 'active'
      )
      ELSE '[]'::jsonb
    END AS options,
    CASE
      WHEN fr.system_filter_key = 'price' THEN (SELECT MIN(ap.price) FROM active_products ap)
      WHEN fr.attribute_id IS NOT NULL AND fr.attribute_type = 'RANGE' THEN (
        SELECT MIN((pav.value_json ->> 'min')::NUMERIC)
        FROM public.product_attribute_values pav
        JOIN active_products ap ON ap.id = pav.product_id
        WHERE pav.attribute_id = fr.attribute_id
          AND pav.value_json IS NOT NULL
          AND (pav.value_json ->> 'min') IS NOT NULL
      )
      WHEN fr.attribute_id IS NOT NULL AND fr.attribute_type IN ('NUMBER', 'NUMBER_WITH_UNIT', 'YEAR') THEN (
        SELECT MIN(pav.value_number)
        FROM public.product_attribute_values pav
        JOIN active_products ap ON ap.id = pav.product_id
        WHERE pav.attribute_id = fr.attribute_id
          AND pav.value_number IS NOT NULL
      )
      ELSE NULL
    END AS range_min,
    CASE
      WHEN fr.system_filter_key = 'price' THEN (SELECT MAX(ap.price) FROM active_products ap)
      WHEN fr.attribute_id IS NOT NULL AND fr.attribute_type = 'RANGE' THEN (
        SELECT MAX((pav.value_json ->> 'max')::NUMERIC)
        FROM public.product_attribute_values pav
        JOIN active_products ap ON ap.id = pav.product_id
        WHERE pav.attribute_id = fr.attribute_id
          AND pav.value_json IS NOT NULL
          AND (pav.value_json ->> 'max') IS NOT NULL
      )
      WHEN fr.attribute_id IS NOT NULL AND fr.attribute_type IN ('NUMBER', 'NUMBER_WITH_UNIT', 'YEAR') THEN (
        SELECT MAX(pav.value_number)
        FROM public.product_attribute_values pav
        JOIN active_products ap ON ap.id = pav.product_id
        WHERE pav.attribute_id = fr.attribute_id
          AND pav.value_number IS NOT NULL
      )
      ELSE NULL
    END AS range_max
  FROM filter_rows fr;
END;
$$;

-- Patch filter_products range branch only (full function replace via reading existing)
-- We update the attr filter range OR clause in filter_products:

CREATE OR REPLACE FUNCTION public.filter_products(
  p_category_id UUID DEFAULT NULL,
  p_shop_id UUID DEFAULT NULL,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_sort TEXT DEFAULT 'newest',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 24
)
RETURNS TABLE (
  product_id UUID,
  title TEXT,
  slug TEXT,
  price NUMERIC,
  compare_at_price NUMERIC,
  currency CHAR(3),
  stock INT,
  shipping_type public.shipping_type,
  brand_id UUID,
  brand_name TEXT,
  brand_slug TEXT,
  shop_id UUID,
  shop_name TEXT,
  shop_slug TEXT,
  shop_rating_avg NUMERIC,
  primary_image_url TEXT,
  published_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_cat_ids UUID[];
  v_offset INT;
  v_price_min NUMERIC;
  v_price_max NUMERIC;
  v_brand_ids UUID[];
  v_shop_ids UUID[];
  v_in_stock BOOLEAN;
  v_free_shipping BOOLEAN;
  v_rating_min NUMERIC;
BEGIN
  v_offset := GREATEST(p_page - 1, 0) * GREATEST(p_page_size, 1);

  IF p_category_id IS NOT NULL THEN
    SELECT ARRAY_AGG(sub.id) INTO v_cat_ids
    FROM public.category_subtree_ids(p_category_id) AS sub(id);
  END IF;

  v_price_min := NULLIF(p_filters ->> 'price_min', '')::NUMERIC;
  v_price_max := NULLIF(p_filters ->> 'price_max', '')::NUMERIC;

  IF p_filters ? 'brand_ids' AND jsonb_typeof(p_filters -> 'brand_ids') = 'array' THEN
    SELECT ARRAY_AGG(x::UUID) INTO v_brand_ids
    FROM jsonb_array_elements_text(p_filters -> 'brand_ids') AS t(x)
    WHERE x ~ '^[0-9a-f]{8}-';
  END IF;

  IF p_filters ? 'shop_ids' AND jsonb_typeof(p_filters -> 'shop_ids') = 'array' THEN
    SELECT ARRAY_AGG(x::UUID) INTO v_shop_ids
    FROM jsonb_array_elements_text(p_filters -> 'shop_ids') AS t(x)
    WHERE x ~ '^[0-9a-f]{8}-';
  END IF;

  IF p_filters ? 'in_stock' THEN
    v_in_stock := (p_filters ->> 'in_stock')::BOOLEAN;
  END IF;
  IF p_filters ? 'free_shipping' THEN
    v_free_shipping := (p_filters ->> 'free_shipping')::BOOLEAN;
  END IF;
  IF p_filters ? 'rating_min' THEN
    v_rating_min := NULLIF(p_filters ->> 'rating_min', '')::NUMERIC;
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      p.title,
      p.slug,
      p.price,
      p.compare_at_price,
      p.currency,
      p.stock,
      p.shipping_type,
      p.brand_id,
      b.name AS brand_name,
      b.slug AS brand_slug,
      p.shop_id,
      s.name AS shop_name,
      s.slug AS shop_slug,
      s.rating_avg AS shop_rating_avg,
      pi.url AS primary_image_url,
      p.published_at
    FROM public.products p
    JOIN public.shops s ON s.id = p.shop_id
      AND s.status = 'active'
      AND s.archived_at IS NULL
    LEFT JOIN public.brands b ON b.id = p.brand_id
      AND b.status = 'active'
      AND b.archived_at IS NULL
    LEFT JOIN LATERAL (
      SELECT img.url FROM public.product_images img
      WHERE img.product_id = p.id
      ORDER BY img.is_primary DESC, img.sort_order ASC
      LIMIT 1
    ) pi ON true
    WHERE p.status = 'ACTIVE'
      AND p.archived_at IS NULL
      AND (p_category_id IS NULL OR p.category_id = ANY (v_cat_ids))
      AND (p_shop_id IS NULL OR p.shop_id = p_shop_id)
      AND (v_price_min IS NULL OR p.price >= v_price_min)
      AND (v_price_max IS NULL OR p.price <= v_price_max)
      AND (v_brand_ids IS NULL OR p.brand_id = ANY (v_brand_ids))
      AND (v_shop_ids IS NULL OR p.shop_id = ANY (v_shop_ids))
      AND (v_in_stock IS NULL OR (v_in_stock = true AND p.stock > 0) OR (v_in_stock = false))
      AND (
        v_free_shipping IS NULL
        OR (v_free_shipping = true AND p.shipping_type = 'FREE')
        OR (v_free_shipping = false)
      )
      AND (v_rating_min IS NULL OR COALESCE(s.rating_avg, 0) >= v_rating_min)
  ),
  attr_filtered AS (
    SELECT b.*
    FROM base b
    WHERE (
      NOT (p_filters ? 'attributes')
      OR p_filters -> 'attributes' = '{}'::jsonb
      OR NOT EXISTS (
        SELECT 1
        FROM jsonb_each(p_filters -> 'attributes') AS ae(attr_id, attr_filter)
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.product_attribute_values pav
          WHERE pav.product_id = b.id
            AND pav.attribute_id = ae.attr_id::UUID
            AND (
              (attr_filter ->> 'type' = 'options' AND pav.value_option_id = ANY (
                ARRAY(
                  SELECT x::UUID
                  FROM jsonb_array_elements_text(attr_filter -> 'values') AS t(x)
                  WHERE x ~ '^[0-9a-f]{8}-'
                )
              ))
              OR (
                attr_filter ->> 'type' = 'range'
                AND (
                  (
                    pav.value_number IS NOT NULL
                    AND pav.value_number >= COALESCE(NULLIF(attr_filter ->> 'min', '')::NUMERIC, pav.value_number)
                    AND pav.value_number <= COALESCE(NULLIF(attr_filter ->> 'max', '')::NUMERIC, pav.value_number)
                  )
                  OR (
                    pav.value_json IS NOT NULL
                    AND (pav.value_json ->> 'min') IS NOT NULL
                    AND (pav.value_json ->> 'max') IS NOT NULL
                    AND (pav.value_json ->> 'min')::NUMERIC <= COALESCE(NULLIF(attr_filter ->> 'max', '')::NUMERIC, (pav.value_json ->> 'max')::NUMERIC)
                    AND (pav.value_json ->> 'max')::NUMERIC >= COALESCE(NULLIF(attr_filter ->> 'min', '')::NUMERIC, (pav.value_json ->> 'min')::NUMERIC)
                  )
                )
              )
              OR (
                attr_filter ->> 'type' = 'boolean'
                AND pav.value_boolean IS NOT NULL
                AND pav.value_boolean = (attr_filter ->> 'value')::BOOLEAN
              )
              OR (
                attr_filter ->> 'type' = 'text'
                AND pav.value_text IS NOT NULL
                AND pav.value_text = ANY (
                  ARRAY(SELECT jsonb_array_elements_text(attr_filter -> 'values'))
                )
              )
            )
        )
      )
    )
  ),
  counted AS (
    SELECT af.*, COUNT(*) OVER () AS total_count
    FROM attr_filtered af
  )
  SELECT
    c.id,
    c.title,
    c.slug,
    c.price,
    c.compare_at_price,
    c.currency,
    c.stock,
    c.shipping_type,
    c.brand_id,
    c.brand_name,
    c.brand_slug,
    c.shop_id,
    c.shop_name,
    c.shop_slug,
    c.shop_rating_avg,
    c.primary_image_url,
    c.published_at,
    c.total_count
  FROM counted c
  ORDER BY
    CASE WHEN p_sort = 'price_asc' THEN c.price END ASC NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN c.price END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN c.published_at END DESC NULLS LAST,
    c.title ASC
  LIMIT GREATEST(p_page_size, 1)
  OFFSET v_offset;
END;
$$;

-- ---------------------------------------------------------------------------
-- Phase 13 TEST 1: Oto Yedek Parça → Fren Sistemi → Fren Balatası
-- ---------------------------------------------------------------------------

INSERT INTO public.attributes (
  id, name, slug, type, unit_id,
  required, filterable, searchable, comparable, is_variant_attribute,
  show_on_card, show_on_detail, show_in_specs, show_in_seller_form,
  sort_order, validation_rules, status
) VALUES
  (
    'b2000000-0000-4000-8000-000000000071',
    'Araç Markası', 'arac-markasi', 'SELECT', NULL,
    true, true, true, true, false,
    true, true, true, true,
    10, '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000072',
    'Araç Modeli', 'arac-modeli', 'SELECT', NULL,
    true, true, true, true, false,
    true, true, true, true,
    20, '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000073',
    'Model Yılı', 'model-yili', 'YEAR', NULL,
    true, true, false, true, false,
    false, true, true, true,
    30, '{"min": 1980, "max": 2030}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000074',
    'OEM No', 'oem-no', 'TEXT', NULL,
    false, false, true, false, false,
    false, true, true, true,
    40, '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000075',
    'Ön/Arka', 'on-arka', 'SELECT', NULL,
    true, true, false, true, false,
    true, true, true, true,
    50, '{}'::JSONB, 'active'
  )
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, updated_at = now();

INSERT INTO public.attribute_options (id, attribute_id, label, value, sort_order, status) VALUES
  ('c3000000-0000-4000-8000-000000000101', 'b2000000-0000-4000-8000-000000000071', 'Ford', 'ford', 1, 'active'),
  ('c3000000-0000-4000-8000-000000000102', 'b2000000-0000-4000-8000-000000000071', 'Renault', 'renault', 2, 'active'),
  ('c3000000-0000-4000-8000-000000000103', 'b2000000-0000-4000-8000-000000000071', 'Volkswagen', 'volkswagen', 3, 'active'),
  ('c3000000-0000-4000-8000-000000000111', 'b2000000-0000-4000-8000-000000000072', 'Focus', 'focus', 1, 'active'),
  ('c3000000-0000-4000-8000-000000000112', 'b2000000-0000-4000-8000-000000000072', 'Clio', 'clio', 2, 'active'),
  ('c3000000-0000-4000-8000-000000000113', 'b2000000-0000-4000-8000-000000000072', 'Golf', 'golf', 3, 'active'),
  ('c3000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000075', 'Ön', 'on', 1, 'active'),
  ('c3000000-0000-4000-8000-000000000122', 'b2000000-0000-4000-8000-000000000075', 'Arka', 'arka', 2, 'active')
ON CONFLICT (attribute_id, value) DO UPDATE SET label = EXCLUDED.label;

INSERT INTO public.categories (
  id, parent_id, name, slug, status, sort_order, show_on_homepage, show_in_nav, path, depth
) VALUES
  (
    'd4000000-0000-4000-8000-000000000004', NULL,
    'Oto Yedek Parça', 'oto-yedek-parca', 'active', 4, false, true,
    'd400000000004000800000000000000004'::LTREE, 0
  ),
  (
    'd4000000-0000-4000-8000-000000000041',
    'd4000000-0000-4000-8000-000000000004',
    'Fren Sistemi', 'fren-sistemi', 'active', 1, false, true,
    'd400000000004000800000000000000004.d400000000004000800000000000000041'::LTREE, 1
  ),
  (
    'd4000000-0000-4000-8000-000000000141',
    'd4000000-0000-4000-8000-000000000041',
    'Fren Balatası', 'fren-balatasi', 'active', 1, false, true,
    'd400000000004000800000000000000004.d400000000004000800000000000000041.d400000000004000800000000000000141'::LTREE, 2
  )
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id, updated_at = now();

INSERT INTO public.category_attributes (category_id, attribute_id, inherited, is_active, override_sort_order, filter_display_type)
VALUES
  ('d4000000-0000-4000-8000-000000000141', 'b2000000-0000-4000-8000-000000000071', false, true, 10, 'CHECKBOX'),
  ('d4000000-0000-4000-8000-000000000141', 'b2000000-0000-4000-8000-000000000072', false, true, 20, 'CHECKBOX'),
  ('d4000000-0000-4000-8000-000000000141', 'b2000000-0000-4000-8000-000000000073', false, true, 30, 'RANGE_SLIDER'),
  ('d4000000-0000-4000-8000-000000000141', 'b2000000-0000-4000-8000-000000000074', false, true, 40, NULL),
  ('d4000000-0000-4000-8000-000000000141', 'b2000000-0000-4000-8000-000000000075', false, true, 50, 'RADIO')
ON CONFLICT (category_id, attribute_id) DO UPDATE SET is_active = true, filter_display_type = EXCLUDED.filter_display_type;

DELETE FROM public.category_filters
WHERE category_id = 'd4000000-0000-4000-8000-000000000141';

INSERT INTO public.category_filters (
  category_id, attribute_id, system_filter_key, display_type, sort_order, is_enabled
) VALUES
  ('d4000000-0000-4000-8000-000000000141', NULL, 'price', 'RANGE_SLIDER', 1, true),
  ('d4000000-0000-4000-8000-000000000141', NULL, 'brand', 'SEARCHABLE_CHECKBOX_LIST', 2, true),
  ('d4000000-0000-4000-8000-000000000141', 'b2000000-0000-4000-8000-000000000071', NULL, 'CHECKBOX', 3, true),
  ('d4000000-0000-4000-8000-000000000141', 'b2000000-0000-4000-8000-000000000072', NULL, 'CHECKBOX', 4, true),
  ('d4000000-0000-4000-8000-000000000141', 'b2000000-0000-4000-8000-000000000073', NULL, 'RANGE_SLIDER', 5, true);

-- Phase 13 TEST 2: Bahçe Hortumu filters (attributes already seeded)
DELETE FROM public.category_filters
WHERE category_id = 'd4000000-0000-4000-8000-000000000031';

INSERT INTO public.category_filters (
  category_id, attribute_id, system_filter_key, display_type, sort_order, is_enabled
) VALUES
  ('d4000000-0000-4000-8000-000000000031', NULL, 'price', 'RANGE_SLIDER', 1, true),
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000004', NULL, 'RANGE_SLIDER', 2, true),
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000003', NULL, 'RANGE_SLIDER', 3, true),
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000013', NULL, 'COLOR_SWATCHES', 4, true),
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000061', NULL, 'TOGGLE', 5, true),
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000062', NULL, 'RANGE_SLIDER', 6, true);

-- Küresel Vana: add Çalışma Sıcaklığı RANGE filter
INSERT INTO public.category_filters (
  category_id, attribute_id, system_filter_key, display_type, sort_order, is_enabled
)
SELECT
  'd4000000-0000-4000-8000-000000000121',
  'b2000000-0000-4000-8000-000000000054',
  NULL,
  'MIN_MAX',
  6,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_filters
  WHERE category_id = 'd4000000-0000-4000-8000-000000000121'
    AND attribute_id = 'b2000000-0000-4000-8000-000000000054'
);

-- =============================================================================
-- 00018_storefront_catalog_rpcs.sql
-- Storefront catalog: dynamic filters, product listing, specs, search
-- =============================================================================

-- ---------------------------------------------------------------------------
-- get_category_filters — filter definitions + facet options for a category PLP
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
      WHEN fr.attribute_id IS NOT NULL AND fr.attribute_type IN ('NUMBER', 'NUMBER_WITH_UNIT', 'RANGE', 'YEAR') THEN (
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
      WHEN fr.attribute_id IS NOT NULL AND fr.attribute_type IN ('NUMBER', 'NUMBER_WITH_UNIT', 'RANGE', 'YEAR') THEN (
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

GRANT EXECUTE ON FUNCTION public.get_category_filters(UUID)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- filter_products — paginated listing with multi-filter support
-- p_filters JSONB shape (app layer):
-- {
--   "price_min": number, "price_max": number,
--   "brand_ids": ["uuid"], "shop_ids": ["uuid"],
--   "in_stock": bool, "free_shipping": bool, "rating_min": number,
--   "attributes": {
--     "<attribute_uuid>": { "type": "options", "values": ["option_uuid"] }
--     | { "type": "range", "min": n, "max": n }
--     | { "type": "boolean", "value": bool }
--     | { "type": "text", "values": ["text"] }
--   }
-- }
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.filter_products(
  p_category_id UUID DEFAULT NULL,
  p_shop_id UUID DEFAULT NULL,
  p_filters JSONB DEFAULT '{}'::JSONB,
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
  v_attr_key TEXT;
  v_attr_val JSONB;
  v_attr_type TEXT;
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

  v_rating_min := NULLIF(p_filters ->> 'rating_min', '')::NUMERIC;

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
      SELECT img.url
      FROM public.product_images img
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
                AND pav.value_number IS NOT NULL
                AND pav.value_number >= COALESCE(NULLIF(attr_filter ->> 'min', '')::NUMERIC, pav.value_number)
                AND pav.value_number <= COALESCE(NULLIF(attr_filter ->> 'max', '')::NUMERIC, pav.value_number)
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

GRANT EXECUTE ON FUNCTION public.filter_products(UUID, UUID, JSONB, TEXT, INT, INT)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- get_product_specs — dynamic technical specs for PDP
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_product_specs(p_product_id UUID)
RETURNS TABLE (
  attribute_id UUID,
  attribute_name TEXT,
  attribute_slug TEXT,
  attribute_type public.attribute_type,
  unit_symbol TEXT,
  display_value TEXT,
  sort_order INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    a.id AS attribute_id,
    a.name AS attribute_name,
    a.slug AS attribute_slug,
    a.type AS attribute_type,
    u.symbol AS unit_symbol,
    CASE a.type
      WHEN 'BOOLEAN' THEN CASE WHEN pav.value_boolean THEN 'Evet' ELSE 'Hayır' END
      WHEN 'NUMBER' THEN TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM pav.value_number::TEXT))
      WHEN 'NUMBER_WITH_UNIT' THEN
        TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM pav.value_number::TEXT))
        || COALESCE(' ' || u.symbol, '')
      WHEN 'RANGE' THEN
        COALESCE(pav.value_json ->> 'min', '') || ' – ' || COALESCE(pav.value_json ->> 'max', '')
      WHEN 'SELECT' THEN ao.label
      WHEN 'MULTI_SELECT' THEN (
        SELECT string_agg(mo.label, ', ' ORDER BY mo.sort_order)
        FROM public.attribute_options mo
        WHERE mo.id = ANY (
          ARRAY(
            SELECT jsonb_array_elements_text(pav.value_json -> 'option_ids')::UUID
          )
        )
      )
      WHEN 'COLOR' THEN COALESCE(ao.label, pav.value_text)
      WHEN 'DATE' THEN to_char(pav.value_text::DATE, 'DD.MM.YYYY')
      WHEN 'YEAR' THEN pav.value_number::TEXT
      ELSE COALESCE(pav.value_text, ao.label)
    END AS display_value,
    a.sort_order
  FROM public.product_attribute_values pav
  JOIN public.attributes a ON a.id = pav.attribute_id
    AND a.status = 'active'
    AND a.archived_at IS NULL
    AND a.show_in_specs = true
  LEFT JOIN public.units u ON u.id = a.unit_id
  LEFT JOIN public.attribute_options ao ON ao.id = pav.value_option_id
  WHERE pav.product_id = p_product_id
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = p_product_id
        AND p.status = 'ACTIVE'
        AND p.archived_at IS NULL
    )
  ORDER BY a.sort_order, a.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_specs(UUID)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- search_products — full-text search including searchable attribute values
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_products(
  p_query TEXT,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 24,
  p_sort TEXT DEFAULT 'relevance'
)
RETURNS TABLE (
  product_id UUID,
  title TEXT,
  slug TEXT,
  price NUMERIC,
  compare_at_price NUMERIC,
  currency CHAR(3),
  stock INT,
  brand_name TEXT,
  brand_slug TEXT,
  shop_name TEXT,
  shop_slug TEXT,
  primary_image_url TEXT,
  published_at TIMESTAMPTZ,
  rank REAL,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tsquery TSQUERY;
  v_offset INT;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_tsquery := plainto_tsquery('turkish', trim(p_query));
  v_offset := GREATEST(p_page - 1, 0) * GREATEST(p_page_size, 1);

  RETURN QUERY
  WITH matched AS (
    SELECT
      p.id,
      p.title,
      p.slug,
      p.price,
      p.compare_at_price,
      p.currency,
      p.stock,
      b.name AS brand_name,
      b.slug AS brand_slug,
      s.name AS shop_name,
      s.slug AS shop_slug,
      pi.url AS primary_image_url,
      p.published_at,
      GREATEST(
        ts_rank(
          to_tsvector('turkish', coalesce(p.title, '') || ' ' || coalesce(p.description, '')),
          v_tsquery
        ),
        COALESCE((
          SELECT MAX(
            ts_rank(
              to_tsvector('turkish', coalesce(pav.value_text, ao.label, '')),
              v_tsquery
            )
          )
          FROM public.product_attribute_values pav
          JOIN public.attributes a ON a.id = pav.attribute_id AND a.searchable = true
          LEFT JOIN public.attribute_options ao ON ao.id = pav.value_option_id
          WHERE pav.product_id = p.id
        ), 0)
      ) AS rank
    FROM public.products p
    JOIN public.shops s ON s.id = p.shop_id
      AND s.status = 'active'
      AND s.archived_at IS NULL
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN LATERAL (
      SELECT img.url FROM public.product_images img
      WHERE img.product_id = p.id
      ORDER BY img.is_primary DESC, img.sort_order ASC
      LIMIT 1
    ) pi ON true
    WHERE p.status = 'ACTIVE'
      AND p.archived_at IS NULL
      AND (
        to_tsvector('turkish', coalesce(p.title, '') || ' ' || coalesce(p.description, '')) @@ v_tsquery
        OR EXISTS (
          SELECT 1
          FROM public.product_attribute_values pav
          JOIN public.attributes a ON a.id = pav.attribute_id AND a.searchable = true
          LEFT JOIN public.attribute_options ao ON ao.id = pav.value_option_id
          WHERE pav.product_id = p.id
            AND to_tsvector('turkish', coalesce(pav.value_text, ao.label, '')) @@ v_tsquery
        )
        OR p.title ILIKE '%' || trim(p_query) || '%'
        OR p.sku ILIKE '%' || trim(p_query) || '%'
      )
  ),
  counted AS (
    SELECT m.*, COUNT(*) OVER () AS total_count FROM matched m
  )
  SELECT
    c.id,
    c.title,
    c.slug,
    c.price,
    c.compare_at_price,
    c.currency,
    c.stock,
    c.brand_name,
    c.brand_slug,
    c.shop_name,
    c.shop_slug,
    c.primary_image_url,
    c.published_at,
    c.rank,
    c.total_count
  FROM counted c
  ORDER BY
    CASE WHEN p_sort = 'relevance' THEN c.rank END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_asc' THEN c.price END ASC NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN c.price END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN c.published_at END DESC NULLS LAST,
    c.title ASC
  LIMIT GREATEST(p_page_size, 1)
  OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products(TEXT, INT, INT, TEXT)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- search_product_suggestions — autocomplete for header search
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_product_suggestions(
  p_query TEXT,
  p_limit INT DEFAULT 8
)
RETURNS TABLE (
  suggestion_type TEXT,
  label TEXT,
  href TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tsquery TSQUERY;
  v_lim INT := LEAST(GREATEST(p_limit, 1), 20);
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_tsquery := plainto_tsquery('turkish', trim(p_query));

  RETURN QUERY
  (
    SELECT 'product'::TEXT, p.title, ('/urunler/' || p.slug)::TEXT
    FROM public.products p
    WHERE p.status = 'ACTIVE'
      AND p.archived_at IS NULL
      AND (
        to_tsvector('turkish', coalesce(p.title, '')) @@ v_tsquery
        OR p.title ILIKE trim(p_query) || '%'
      )
    ORDER BY p.published_at DESC NULLS LAST
    LIMIT v_lim
  )
  UNION ALL
  (
    SELECT 'category'::TEXT, c.name, ('/kategoriler/' || c.slug)::TEXT
    FROM public.categories c
    WHERE c.status = 'active'
      AND c.archived_at IS NULL
      AND c.name ILIKE '%' || trim(p_query) || '%'
    ORDER BY c.sort_order, c.name
    LIMIT GREATEST(v_lim / 2, 2)
  )
  LIMIT v_lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_product_suggestions(TEXT, INT)
  TO anon, authenticated, service_role;

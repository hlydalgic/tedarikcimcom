-- Category navigation, search autocomplete, and filter_products subtree control

-- ---------------------------------------------------------------------------
-- category_slug_path — full URL slug path for a category
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.category_slug_path(p_category_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE chain AS (
    SELECT id, parent_id, slug, 0 AS depth
    FROM public.categories
    WHERE id = p_category_id

    UNION ALL

    SELECT c.id, c.parent_id, c.slug, chain.depth + 1
    FROM public.categories c
    JOIN chain ON c.id = chain.parent_id
  )
  SELECT string_agg(slug, '/' ORDER BY depth DESC)
  FROM chain;
$$;

GRANT EXECUTE ON FUNCTION public.category_slug_path(UUID)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- filter_products — add p_include_subcategories (default true)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.filter_products(UUID, UUID, JSONB, TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.filter_products(UUID, UUID, JSONB, TEXT, INT, INT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.filter_products(
  p_category_id UUID DEFAULT NULL,
  p_shop_id UUID DEFAULT NULL,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_sort TEXT DEFAULT 'newest',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 24,
  p_include_subcategories BOOLEAN DEFAULT true
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
    IF p_include_subcategories THEN
      SELECT ARRAY_AGG(sub.id) INTO v_cat_ids
      FROM public.category_subtree_ids(p_category_id) AS sub(id);
    ELSE
      v_cat_ids := ARRAY[p_category_id];
    END IF;
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

GRANT EXECUTE ON FUNCTION public.filter_products(UUID, UUID, JSONB, TEXT, INT, INT, BOOLEAN)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- search_product_suggestions — categories, brands, products (in order)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_product_suggestions(TEXT, INT);

CREATE OR REPLACE FUNCTION public.search_product_suggestions(
  p_query TEXT,
  p_limit INT DEFAULT 8
)
RETURNS TABLE (
  suggestion_type TEXT,
  label TEXT,
  href TEXT,
  image_url TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_q TEXT;
  v_lim INT := LEAST(GREATEST(p_limit, 1), 20);
  v_cat_lim INT;
  v_brand_lim INT;
  v_prod_lim INT;
  v_tsquery TSQUERY;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_q := trim(p_query);
  v_tsquery := plainto_tsquery('turkish', v_q);
  v_cat_lim := GREATEST(v_lim / 3, 2);
  v_brand_lim := GREATEST(v_lim / 3, 2);
  v_prod_lim := GREATEST(v_lim - v_cat_lim - v_brand_lim, 2);

  RETURN QUERY
  (
    SELECT
      'category'::TEXT,
      c.name,
      ('/kategoriler/' || public.category_slug_path(c.id))::TEXT,
      c.icon
    FROM public.categories c
    WHERE c.status = 'active'
      AND c.archived_at IS NULL
      AND c.name ILIKE '%' || v_q || '%'
    ORDER BY c.depth, c.sort_order, c.name
    LIMIT v_cat_lim
  )
  UNION ALL
  (
    SELECT
      'brand'::TEXT,
      b.name,
      ('/arama?q=' || replace(replace(b.name, '&', '%26'), ' ', '+'))::TEXT,
      b.logo_url
    FROM public.brands b
    WHERE b.status = 'active'
      AND b.archived_at IS NULL
      AND b.name ILIKE '%' || v_q || '%'
    ORDER BY b.name
    LIMIT v_brand_lim
  )
  UNION ALL
  (
    SELECT
      'product'::TEXT,
      p.title,
      ('/urunler/' || p.slug)::TEXT,
      pi.url
    FROM public.products p
    LEFT JOIN LATERAL (
      SELECT img.url
      FROM public.product_images img
      WHERE img.product_id = p.id
      ORDER BY img.is_primary DESC, img.sort_order ASC
      LIMIT 1
    ) pi ON true
    WHERE p.status = 'ACTIVE'
      AND p.archived_at IS NULL
      AND (
        to_tsvector('turkish', coalesce(p.title, '')) @@ v_tsquery
        OR p.title ILIKE v_q || '%'
        OR p.sku ILIKE v_q || '%'
      )
    ORDER BY p.published_at DESC NULLS LAST
    LIMIT v_prod_lim
  )
  LIMIT v_lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_product_suggestions(TEXT, INT)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- search_products — optional category filter
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_products(TEXT, INT, INT, TEXT);
DROP FUNCTION IF EXISTS public.search_products(TEXT, INT, INT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.search_products(TEXT, INT, INT, TEXT, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.search_products(
  p_query TEXT,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 24,
  p_sort TEXT DEFAULT 'relevance',
  p_category_id UUID DEFAULT NULL,
  p_filters JSONB DEFAULT '{}'::jsonb
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
  v_q TEXT;
  v_cat_ids UUID[];
  v_price_min NUMERIC;
  v_price_max NUMERIC;
  v_brand_ids UUID[];
  v_shop_ids UUID[];
  v_in_stock BOOLEAN;
  v_free_shipping BOOLEAN;
  v_rating_min NUMERIC;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_q := trim(p_query);
  v_tsquery := plainto_tsquery('turkish', v_q);
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
  WITH matched AS (
    SELECT
      sd.product_id AS id,
      sd.title,
      sd.slug,
      sd.price,
      sd.compare_at_price,
      sd.currency,
      sd.stock,
      sd.brand_name,
      sd.brand_slug,
      sd.shop_name,
      sd.shop_slug,
      sd.primary_image_url,
      sd.published_at,
      GREATEST(
        ts_rank(sd.document, v_tsquery),
        CASE
          WHEN sd.title ILIKE '%' || v_q || '%' THEN 0.5
          WHEN sd.sku ILIKE '%' || v_q || '%' THEN 0.4
          ELSE 0
        END
      ) AS rank
    FROM public.search_documents sd
    JOIN public.products p ON p.id = sd.product_id
      AND p.status = 'ACTIVE'
      AND p.archived_at IS NULL
    JOIN public.shops s ON s.id = p.shop_id
      AND s.status = 'active'
      AND s.archived_at IS NULL
    WHERE (
      sd.document @@ v_tsquery
      OR sd.title ILIKE '%' || v_q || '%'
      OR sd.sku ILIKE '%' || v_q || '%'
    )
    AND (
      p_category_id IS NULL
      OR p.category_id = ANY (v_cat_ids)
    )
    AND (v_price_min IS NULL OR sd.price >= v_price_min)
    AND (v_price_max IS NULL OR sd.price <= v_price_max)
    AND (v_brand_ids IS NULL OR p.brand_id = ANY (v_brand_ids))
    AND (v_shop_ids IS NULL OR p.shop_id = ANY (v_shop_ids))
    AND (v_in_stock IS NULL OR (v_in_stock = true AND sd.stock > 0) OR (v_in_stock = false))
    AND (
      v_free_shipping IS NULL
      OR (v_free_shipping = true AND p.shipping_type = 'FREE')
      OR (v_free_shipping = false)
    )
    AND (v_rating_min IS NULL OR COALESCE(s.rating_avg, 0) >= v_rating_min)
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

GRANT EXECUTE ON FUNCTION public.search_products(TEXT, INT, INT, TEXT, UUID, JSONB)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- get_search_category_facets — category facets for search results sidebar
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_search_category_facets(
  p_query TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_path TEXT,
  product_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_q TEXT;
  v_tsquery TSQUERY;
  v_lim INT := LEAST(GREATEST(p_limit, 1), 50);
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_q := trim(p_query);
  v_tsquery := plainto_tsquery('turkish', v_q);

  RETURN QUERY
  WITH matched AS (
    SELECT p.category_id
    FROM public.search_documents sd
    JOIN public.products p ON p.id = sd.product_id
      AND p.status = 'ACTIVE'
      AND p.archived_at IS NULL
    WHERE p.category_id IS NOT NULL
      AND (
        sd.document @@ v_tsquery
        OR sd.title ILIKE '%' || v_q || '%'
        OR sd.sku ILIKE '%' || v_q || '%'
      )
  )
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    public.category_slug_path(c.id) AS category_path,
    COUNT(*)::BIGINT AS product_count
  FROM matched m
  JOIN public.categories c ON c.id = m.category_id
    AND c.status = 'active'
    AND c.archived_at IS NULL
  GROUP BY c.id, c.name
  ORDER BY product_count DESC, c.name
  LIMIT v_lim;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_search_category_facets(TEXT, INT)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- get_search_filters — dynamic filters from search result products
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_search_filters(
  p_query TEXT,
  p_category_id UUID DEFAULT NULL
)
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
  v_q TEXT;
  v_tsquery TSQUERY;
  v_cat_ids UUID[];
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_q := trim(p_query);
  v_tsquery := plainto_tsquery('turkish', v_q);

  IF p_category_id IS NOT NULL THEN
    SELECT ARRAY_AGG(sub.id) INTO v_cat_ids
    FROM public.category_subtree_ids(p_category_id) AS sub(id);
  END IF;

  RETURN QUERY
  WITH active_products AS (
    SELECT
      p.id,
      p.price,
      p.brand_id,
      p.shop_id,
      p.stock,
      p.shipping_type,
      p.category_id
    FROM public.search_documents sd
    JOIN public.products p ON p.id = sd.product_id
      AND p.status = 'ACTIVE'
      AND p.archived_at IS NULL
    WHERE (
      sd.document @@ v_tsquery
      OR sd.title ILIKE '%' || v_q || '%'
      OR sd.sku ILIKE '%' || v_q || '%'
    )
    AND (
      p_category_id IS NULL
      OR p.category_id = ANY (v_cat_ids)
    )
  ),
  filter_rows AS (
    SELECT *
    FROM (
      VALUES
        (gen_random_uuid(), NULL::UUID, NULL::UUID, 'price'::public.system_filter_key, 'MIN_MAX'::public.filter_display_type, 10, false, 'Fiyat'::TEXT, NULL::TEXT, NULL::public.attribute_type),
        (gen_random_uuid(), NULL::UUID, NULL::UUID, 'brand'::public.system_filter_key, 'SEARCHABLE_CHECKBOX_LIST'::public.filter_display_type, 20, false, 'Marka'::TEXT, NULL::TEXT, NULL::public.attribute_type),
        (gen_random_uuid(), NULL::UUID, NULL::UUID, 'seller'::public.system_filter_key, 'SEARCHABLE_CHECKBOX_LIST'::public.filter_display_type, 30, true, 'Satıcı'::TEXT, NULL::TEXT, NULL::public.attribute_type),
        (gen_random_uuid(), NULL::UUID, NULL::UUID, 'in_stock'::public.system_filter_key, 'TOGGLE'::public.filter_display_type, 40, true, 'Stokta'::TEXT, NULL::TEXT, NULL::public.attribute_type),
        (gen_random_uuid(), NULL::UUID, NULL::UUID, 'free_shipping'::public.system_filter_key, 'TOGGLE'::public.filter_display_type, 50, true, 'Ücretsiz kargo'::TEXT, NULL::TEXT, NULL::public.attribute_type)
    ) AS t(id, category_id, attribute_id, system_filter_key, display_type, sort_order, default_collapsed, label, attribute_slug, attribute_type)
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
      ELSE '[]'::jsonb
    END AS options,
    CASE
      WHEN fr.system_filter_key = 'price' THEN (SELECT MIN(ap.price) FROM active_products ap)
      ELSE NULL
    END AS range_min,
    CASE
      WHEN fr.system_filter_key = 'price' THEN (SELECT MAX(ap.price) FROM active_products ap)
      ELSE NULL
    END AS range_max
  FROM filter_rows fr
  WHERE (
    fr.system_filter_key != 'brand'
    OR EXISTS (SELECT 1 FROM active_products ap WHERE ap.brand_id IS NOT NULL)
  )
  AND (
    fr.system_filter_key != 'seller'
    OR EXISTS (SELECT 1 FROM active_products ap)
  )
  AND (
    fr.system_filter_key != 'price'
    OR EXISTS (SELECT 1 FROM active_products ap)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_search_filters(TEXT, UUID)
  TO anon, authenticated, service_role;

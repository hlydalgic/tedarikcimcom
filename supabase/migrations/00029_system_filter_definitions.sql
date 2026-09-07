-- Global system filter catalog (category_system_filters) + dynamic keys

-- ---------------------------------------------------------------------------
-- Replace legacy per-category category_system_filters with global catalog
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS public.category_system_filters CASCADE;

CREATE TABLE public.category_system_filters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  display_type    public.filter_display_type NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_builtin      BOOLEAN NOT NULL DEFAULT false,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT category_system_filters_key_unique UNIQUE (key),
  CONSTRAINT category_system_filters_key_format CHECK (key ~ '^[a-z][a-z0-9_]*$')
);

CREATE INDEX category_system_filters_active_idx
  ON public.category_system_filters (sort_order, name)
  WHERE archived_at IS NULL AND is_active = true;

CREATE TRIGGER category_system_filters_set_updated_at
  BEFORE UPDATE ON public.category_system_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.category_system_filters (
  key, name, description, display_type, sort_order, is_active, is_builtin
) VALUES
  (
    'price',
    'Fiyat',
    'Ürün fiyat aralığı filtresi',
    'MIN_MAX',
    10,
    true,
    true
  ),
  (
    'brand',
    'Marka',
    'Marka listesi filtresi',
    'SEARCHABLE_CHECKBOX_LIST',
    20,
    true,
    true
  ),
  (
    'seller',
    'Satıcı',
    'Satıcı / mağaza filtresi',
    'SEARCHABLE_CHECKBOX_LIST',
    30,
    true,
    true
  ),
  (
    'in_stock',
    'Stokta',
    'Stokta olan ürünler',
    'TOGGLE',
    40,
    true,
    true
  ),
  (
    'free_shipping',
    'Ücretsiz kargo',
    'Ücretsiz kargo seçeneği',
    'TOGGLE',
    50,
    true,
    true
  ),
  (
    'rating',
    'Puan',
    'Satıcı / ürün puan filtresi',
    'CHECKBOX',
    60,
    true,
    true
  );

-- ---------------------------------------------------------------------------
-- category_filters.system_filter_key: enum → text (FK to catalog)
-- ---------------------------------------------------------------------------

ALTER TABLE public.category_filters
  ALTER COLUMN system_filter_key TYPE TEXT
  USING system_filter_key::TEXT;

ALTER TABLE public.category_filters
  ADD CONSTRAINT category_filters_system_key_fkey
  FOREIGN KEY (system_filter_key)
  REFERENCES public.category_system_filters (key)
  ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.category_system_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY category_system_filters_select_active
  ON public.category_system_filters
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND archived_at IS NULL);

CREATE POLICY category_system_filters_admin_all
  ON public.category_system_filters
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.category_system_filters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_system_filters TO authenticated;

-- ---------------------------------------------------------------------------
-- get_category_filters — labels from category_system_filters catalog
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_category_filters(p_category_id UUID)
RETURNS TABLE (
  id UUID,
  category_id UUID,
  attribute_id UUID,
  system_filter_key TEXT,
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
      COALESCE(cf.label_override, csf.name, attr.name) AS label,
      attr.slug AS attribute_slug,
      attr.type AS attribute_type
    FROM public.category_filters cf
    LEFT JOIN public.category_system_filters csf
      ON csf.key = cf.system_filter_key
      AND csf.archived_at IS NULL
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

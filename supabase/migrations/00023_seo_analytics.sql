-- =============================================================================
-- 00023_seo_analytics.sql
-- SEO site URL, search analytics, KPI events, search_documents MV
-- =============================================================================

-- Site URL for sitemap, canonical, OG (falls back to NEXT_PUBLIC_SITE_URL in app)
ALTER TABLE public.marketplace_settings
  ADD COLUMN IF NOT EXISTS site_url TEXT;

-- ---------------------------------------------------------------------------
-- search_events — storefront search analytics
-- ---------------------------------------------------------------------------

CREATE TABLE public.search_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query               TEXT NOT NULL,
  result_count        INT NOT NULL DEFAULT 0,
  clicked_product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  session_id          TEXT NOT NULL,
  user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX search_events_query_idx ON public.search_events (query);
CREATE INDEX search_events_created_at_idx ON public.search_events (created_at DESC);
CREATE INDEX search_events_session_idx ON public.search_events (session_id);

-- ---------------------------------------------------------------------------
-- analytics_events — provider-agnostic marketplace KPI events
-- ---------------------------------------------------------------------------

CREATE TABLE public.analytics_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name   TEXT NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX analytics_events_name_created_idx
  ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX analytics_events_created_at_idx
  ON public.analytics_events (created_at DESC);

-- ---------------------------------------------------------------------------
-- search_documents — materialized view for product full-text search
-- Schedule refresh via Supabase cron: SELECT refresh_search_documents();
-- ---------------------------------------------------------------------------

CREATE MATERIALIZED VIEW public.search_documents AS
SELECT
  p.id AS product_id,
  p.title,
  p.slug,
  p.description,
  p.sku,
  p.price,
  p.compare_at_price,
  p.currency,
  p.stock,
  p.published_at,
  p.shop_id,
  s.name AS shop_name,
  s.slug AS shop_slug,
  b.name AS brand_name,
  b.slug AS brand_slug,
  pi.url AS primary_image_url,
  (
    setweight(to_tsvector('turkish', coalesce(p.title, '')), 'A') ||
    setweight(to_tsvector('turkish', coalesce(p.description, '')), 'B') ||
    setweight(to_tsvector('turkish', coalesce(p.sku, '')), 'A') ||
    setweight(to_tsvector('turkish', coalesce(attr_text.search_text, '')), 'C')
  ) AS document
FROM public.products p
JOIN public.shops s ON s.id = p.shop_id
  AND s.status = 'active'
  AND s.archived_at IS NULL
LEFT JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN LATERAL (
  SELECT img.url
  FROM public.product_images img
  WHERE img.product_id = p.id
  ORDER BY img.is_primary DESC, img.sort_order ASC
  LIMIT 1
) pi ON true
LEFT JOIN LATERAL (
  SELECT string_agg(
    coalesce(pav.value_text, ao.label, ''),
    ' '
  ) AS search_text
  FROM public.product_attribute_values pav
  JOIN public.attributes a ON a.id = pav.attribute_id AND a.searchable = true
  LEFT JOIN public.attribute_options ao ON ao.id = pav.value_option_id
  WHERE pav.product_id = p.id
) attr_text ON true
WHERE p.status = 'ACTIVE'
  AND p.archived_at IS NULL;

CREATE UNIQUE INDEX search_documents_product_id_uidx
  ON public.search_documents (product_id);
CREATE INDEX search_documents_document_gin_idx
  ON public.search_documents USING GIN (document);

CREATE OR REPLACE FUNCTION public.refresh_search_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.search_documents;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_search_documents()
  TO service_role;

-- ---------------------------------------------------------------------------
-- search_products — use search_documents MV
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
  v_q TEXT;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_q := trim(p_query);
  v_tsquery := plainto_tsquery('turkish', v_q);
  v_offset := GREATEST(p_page - 1, 0) * GREATEST(p_page_size, 1);

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
    WHERE sd.document @@ v_tsquery
      OR sd.title ILIKE '%' || v_q || '%'
      OR sd.sku ILIKE '%' || v_q || '%'
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

-- ---------------------------------------------------------------------------
-- Admin analytics RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_search_analytics(p_days INT DEFAULT 30)
RETURNS TABLE (
  query TEXT,
  search_count BIGINT,
  avg_result_count NUMERIC,
  click_count BIGINT,
  click_rate NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      lower(trim(se.query)) AS q,
      se.result_count,
      se.clicked_product_id
    FROM public.search_events se
    WHERE se.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
      AND length(trim(se.query)) >= 2
  ),
  searches AS (
    SELECT q, COUNT(*) AS search_count, AVG(result_count)::NUMERIC AS avg_result_count
    FROM base
    GROUP BY q
  ),
  clicks AS (
    SELECT q, COUNT(*) AS click_count
    FROM base
    WHERE clicked_product_id IS NOT NULL
    GROUP BY q
  )
  SELECT
    s.q AS query,
    s.search_count,
    s.avg_result_count,
    COALESCE(c.click_count, 0) AS click_count,
    CASE
      WHEN s.search_count > 0
      THEN ROUND(COALESCE(c.click_count, 0)::NUMERIC / s.search_count, 4)
      ELSE 0
    END AS click_rate
  FROM searches s
  LEFT JOIN clicks c ON c.q = s.q
  ORDER BY s.search_count DESC
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_zero_result_searches(p_days INT DEFAULT 30)
RETURNS TABLE (
  query TEXT,
  search_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(trim(se.query)) AS query,
    COUNT(*)::BIGINT AS search_count
  FROM public.search_events se
  WHERE se.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    AND se.result_count = 0
    AND se.clicked_product_id IS NULL
    AND length(trim(se.query)) >= 2
  GROUP BY lower(trim(se.query))
  ORDER BY search_count DESC
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_analytics_event_counts(p_days INT DEFAULT 30)
RETURNS TABLE (
  event_name TEXT,
  event_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ae.event_name,
    COUNT(*)::BIGINT AS event_count
  FROM public.analytics_events ae
  WHERE ae.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
  GROUP BY ae.event_name
  ORDER BY event_count DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_analytics_funnel(p_days INT DEFAULT 30)
RETURNS TABLE (
  view_product BIGINT,
  add_to_cart BIGINT,
  begin_checkout BIGINT,
  purchase BIGINT,
  view_to_cart_rate NUMERIC,
  cart_to_purchase_rate NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH counts AS (
    SELECT
      COUNT(*) FILTER (WHERE event_name = 'view_product') AS view_product,
      COUNT(*) FILTER (WHERE event_name = 'add_to_cart') AS add_to_cart,
      COUNT(*) FILTER (WHERE event_name = 'begin_checkout') AS begin_checkout,
      COUNT(*) FILTER (WHERE event_name = 'purchase') AS purchase
    FROM public.analytics_events
    WHERE created_at >= now() - make_interval(days => GREATEST(p_days, 1))
  )
  SELECT
    view_product,
    add_to_cart,
    begin_checkout,
    purchase,
    CASE WHEN view_product > 0
      THEN ROUND(add_to_cart::NUMERIC / view_product, 4) ELSE 0 END,
    CASE WHEN add_to_cart > 0
      THEN ROUND(purchase::NUMERIC / add_to_cart, 4) ELSE 0 END
  FROM counts;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_search_analytics(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_zero_result_searches(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_analytics_event_counts(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_analytics_funnel(INT) TO service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY search_events_insert_all
  ON public.search_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY search_events_admin_select
  ON public.search_events FOR SELECT
  USING (public.is_admin());

CREATE POLICY analytics_events_insert_all
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY analytics_events_admin_select
  ON public.analytics_events FOR SELECT
  USING (public.is_admin());

GRANT INSERT ON public.search_events TO anon, authenticated, service_role;
GRANT INSERT ON public.analytics_events TO anon, authenticated, service_role;
GRANT SELECT ON public.search_events TO service_role;
GRANT SELECT ON public.analytics_events TO service_role;

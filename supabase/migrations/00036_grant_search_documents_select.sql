-- search_documents was created (00023) after the blanket
-- "GRANT SELECT ON ALL TABLES" in 00008, so anon/authenticated never received
-- SELECT on it. search_products / get_search_filters / get_search_category_facets
-- run as SECURITY INVOKER and failed with
-- "permission denied for materialized view search_documents".
-- The view only contains ACTIVE products of active shops (public catalog data).

GRANT SELECT ON public.search_documents TO anon, authenticated;

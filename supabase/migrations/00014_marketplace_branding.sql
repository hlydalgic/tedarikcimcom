-- =============================================================================
-- 00014_marketplace_branding.sql
-- White-label branding + feature flags (single-tenant per deployment)
-- NO tenant_id — 1 Supabase project = 1 marketplace instance
-- Commission source of truth remains platform_settings (not here)
-- =============================================================================

CREATE TABLE public.marketplace_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_name    TEXT NOT NULL,
  short_name          TEXT NOT NULL,
  logo_url            TEXT,
  logo_dark_url       TEXT,
  favicon_url         TEXT,
  primary_color       TEXT NOT NULL DEFAULT '#0A4D8C',
  secondary_color     TEXT NOT NULL DEFAULT '#1A6B9A',
  accent_color        TEXT NOT NULL DEFAULT '#FF6B1A',
  support_email       TEXT,
  support_phone       TEXT,
  company_name        TEXT,
  default_currency    CHAR(3) NOT NULL DEFAULT 'TRY',
  default_country     CHAR(2) NOT NULL DEFAULT 'TR',
  default_locale      TEXT NOT NULL DEFAULT 'tr',
  seo_title           TEXT,
  seo_description     TEXT,
  tagline             TEXT,
  social_links        JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce at most one row per deployment
CREATE UNIQUE INDEX marketplace_settings_singleton_uidx
  ON public.marketplace_settings ((true));

CREATE TABLE public.marketplace_features (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviews_enabled             BOOLEAN NOT NULL DEFAULT false,
  favorites_enabled           BOOLEAN NOT NULL DEFAULT true,
  quotes_enabled              BOOLEAN NOT NULL DEFAULT true,
  special_shipping_enabled    BOOLEAN NOT NULL DEFAULT true,
  product_variants_enabled    BOOLEAN NOT NULL DEFAULT true,
  seller_chat_enabled         BOOLEAN NOT NULL DEFAULT false,
  b2b_pricing_enabled         BOOLEAN NOT NULL DEFAULT false,
  compare_products_enabled    BOOLEAN NOT NULL DEFAULT false,
  coupons_enabled             BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX marketplace_features_singleton_uidx
  ON public.marketplace_features ((true));

CREATE TRIGGER marketplace_settings_set_updated_at
  BEFORE UPDATE ON public.marketplace_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER marketplace_features_set_updated_at
  BEFORE UPDATE ON public.marketplace_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_settings_select_all
  ON public.marketplace_settings FOR SELECT
  USING (true);

CREATE POLICY marketplace_settings_admin_all
  ON public.marketplace_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY marketplace_features_select_all
  ON public.marketplace_features FOR SELECT
  USING (true);

CREATE POLICY marketplace_features_admin_all
  ON public.marketplace_features FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.marketplace_settings TO anon, authenticated;
GRANT SELECT ON public.marketplace_features TO anon, authenticated;
GRANT ALL ON public.marketplace_settings TO service_role;
GRANT ALL ON public.marketplace_features TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_features TO authenticated;

-- ---------------------------------------------------------------------------
-- marketplace-assets: logos, favicon (public read; admin write)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-assets',
  'marketplace-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY marketplace_assets_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketplace-assets');

CREATE POLICY marketplace_assets_admin_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'marketplace-assets'
    AND public.is_admin()
  );

CREATE POLICY marketplace_assets_admin_update
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'marketplace-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'marketplace-assets' AND public.is_admin());

CREATE POLICY marketplace_assets_admin_delete
  ON storage.objects FOR DELETE
  USING (bucket_id = 'marketplace-assets' AND public.is_admin());

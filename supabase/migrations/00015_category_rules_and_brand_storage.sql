-- =============================================================================
-- 00015_category_rules_and_brand_storage.sql
-- Category product rules + brand logo storage
-- =============================================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS required_image_count INT NOT NULL DEFAULT 1
    CHECK (required_image_count >= 0),
  ADD COLUMN IF NOT EXISTS brand_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sku_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS barcode_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS condition_allowed public.product_condition[] NOT NULL
    DEFAULT ARRAY['new', 'refurbished', 'used']::public.product_condition[],
  ADD COLUMN IF NOT EXISTS allowed_shipping_types public.shipping_type[] NOT NULL
    DEFAULT ARRAY[
      'STANDARD',
      'FREE',
      'SELLER_DEFINED',
      'QUOTE_REQUIRED',
      'PICKUP'
    ]::public.shipping_type[],
  ADD COLUMN IF NOT EXISTS product_approval_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_description_length INT NOT NULL DEFAULT 0
    CHECK (min_description_length >= 0);

COMMENT ON COLUMN public.categories.required_image_count IS
  'Minimum product images required when listing in this category';
COMMENT ON COLUMN public.categories.product_approval_required IS
  'When true, products in this category require admin approval regardless of shop moderation_mode';

-- Brand logos (public read; admin write via service role / is_admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-logos',
  'brand-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY brand_logos_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-logos');

CREATE POLICY brand_logos_admin_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-logos'
    AND public.is_admin()
  );

CREATE POLICY brand_logos_admin_update
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'brand-logos' AND public.is_admin())
  WITH CHECK (bucket_id = 'brand-logos' AND public.is_admin());

CREATE POLICY brand_logos_admin_delete
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-logos' AND public.is_admin());

-- =============================================================================
-- 00010_storage.sql
-- Storage buckets + policies
-- invoices: PRIVATE only — downloads via server signed URL (no public URL)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'product-images',
    'product-images',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'shop-assets',
    'shop-assets',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'category-images',
    'category-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'invoices',
    'invoices',
    false, -- PRIVATE — signed URL only
    20971520, -- 20 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- product-images: public read; seller uploads under {shop_id}/...
-- ---------------------------------------------------------------------------

CREATE POLICY product_images_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY product_images_seller_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND public.owns_shop((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY product_images_seller_update
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND public.owns_shop((storage.foldername(name))[1]::UUID)
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.owns_shop((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY product_images_seller_delete
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (
      public.owns_shop((storage.foldername(name))[1]::UUID)
      OR public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- shop-assets: public read; owner writes {shop_id}/...
-- ---------------------------------------------------------------------------

CREATE POLICY shop_assets_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-assets');

CREATE POLICY shop_assets_seller_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop-assets'
    AND auth.uid() IS NOT NULL
    AND public.owns_shop((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY shop_assets_seller_update
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'shop-assets'
    AND public.owns_shop((storage.foldername(name))[1]::UUID)
  )
  WITH CHECK (
    bucket_id = 'shop-assets'
    AND public.owns_shop((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY shop_assets_seller_delete
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shop-assets'
    AND (
      public.owns_shop((storage.foldername(name))[1]::UUID)
      OR public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- category-images: public read; admin write
-- ---------------------------------------------------------------------------

CREATE POLICY category_images_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'category-images');

CREATE POLICY category_images_admin_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'category-images'
    AND public.is_admin()
  );

CREATE POLICY category_images_admin_update
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'category-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'category-images' AND public.is_admin());

CREATE POLICY category_images_admin_delete
  ON storage.objects FOR DELETE
  USING (bucket_id = 'category-images' AND public.is_admin());

-- ---------------------------------------------------------------------------
-- invoices: NO public/authenticated SELECT on storage.objects
-- Upload: seller under invoices/{shop_id}/{invoice_id}.pdf
-- Download: server action + service role createSignedUrl only
-- ---------------------------------------------------------------------------

CREATE POLICY invoices_seller_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices'
    AND auth.uid() IS NOT NULL
    AND (
      public.owns_shop((storage.foldername(name))[1]::UUID)
      OR public.is_admin()
    )
  );

CREATE POLICY invoices_seller_update
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'invoices'
    AND (
      public.owns_shop((storage.foldername(name))[1]::UUID)
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'invoices'
    AND (
      public.owns_shop((storage.foldername(name))[1]::UUID)
      OR public.is_admin()
    )
  );

CREATE POLICY invoices_seller_delete
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'invoices'
    AND (
      public.owns_shop((storage.foldername(name))[1]::UUID)
      OR public.is_admin()
    )
  );

-- Intentionally omitted: SELECT policy on invoices bucket for authenticated/anon.
-- Service role bypasses RLS for signed URL generation after app-level authz.

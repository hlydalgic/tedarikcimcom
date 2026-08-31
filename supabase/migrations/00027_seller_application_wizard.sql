-- =============================================================================
-- 00027_seller_application_wizard.sql
-- Multi-step seller application fields + private document storage
-- =============================================================================

ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS company_type TEXT NOT NULL DEFAULT 'limited'
    CHECK (company_type IN ('sahis', 'limited', 'anonim')),
  ADD COLUMN IF NOT EXISTS shop_name TEXT,
  ADD COLUMN IF NOT EXISTS activity_city TEXT,
  ADD COLUMN IF NOT EXISTS activity_district TEXT,
  ADD COLUMN IF NOT EXISTS activity_address TEXT,
  ADD COLUMN IF NOT EXISTS billing_same_as_activity BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_district TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS return_city TEXT,
  ADD COLUMN IF NOT EXISTS return_district TEXT,
  ADD COLUMN IF NOT EXISTS return_address TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS tax_certificate_path TEXT,
  ADD COLUMN IF NOT EXISTS signature_circular_path TEXT,
  ADD COLUMN IF NOT EXISTS seller_contract_accepted BOOLEAN NOT NULL DEFAULT false;

UPDATE public.seller_applications
SET shop_name = company_name
WHERE shop_name IS NULL;

-- ---------------------------------------------------------------------------
-- seller-applications bucket (private — signed URL for admin review)
-- Path: {user_id}/{document_type}_{timestamp}.{ext}
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'seller-applications',
    'seller-applications',
    false,
    10485760, -- 10 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY seller_applications_storage_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'seller-applications'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY seller_applications_storage_select
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'seller-applications'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY seller_applications_storage_delete
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'seller-applications'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

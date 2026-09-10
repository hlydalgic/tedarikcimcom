-- =============================================================================
-- 00034_seller_application_postal_codes.sql
-- Optional postal codes for seller application addresses
-- =============================================================================

ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS activity_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS return_postal_code TEXT;

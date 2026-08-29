-- =============================================================================
-- 00016_auth_user_profile_and_seller_application.sql
-- Account type on users + richer seller_applications fields
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'corporate')),
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS tax_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_office TEXT;

COMMENT ON COLUMN public.users.account_type IS
  'Buyer account type: individual or corporate';

ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS tax_office TEXT,
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS category_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS e_invoice_declared BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kvkk_accepted BOOLEAN NOT NULL DEFAULT false;

-- Enrich signup trigger with profile metadata from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    phone,
    account_type,
    company_name,
    tax_number,
    tax_office
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual'),
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'tax_number',
    NEW.raw_user_meta_data ->> 'tax_office'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    account_type = COALESCE(EXCLUDED.account_type, public.users.account_type),
    company_name = COALESCE(EXCLUDED.company_name, public.users.company_name),
    tax_number = COALESCE(EXCLUDED.tax_number, public.users.tax_number),
    tax_office = COALESCE(EXCLUDED.tax_office, public.users.tax_office),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 00002_identity_shops.sql
-- Users, shops, applications, addresses, platform settings, admin logs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- users (1:1 with auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  roles           TEXT[] NOT NULL DEFAULT ARRAY['buyer']::TEXT[],
  status          public.entity_status NOT NULL DEFAULT 'active',
  locale          TEXT NOT NULL DEFAULT 'tr',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ
);

CREATE INDEX users_roles_gin ON public.users USING GIN (roles);
CREATE INDEX users_email_idx ON public.users (email);
CREATE INDEX users_status_idx ON public.users (status);

-- ---------------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------------

CREATE TABLE public.shops (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                  UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  slug                      TEXT NOT NULL,
  name                      TEXT NOT NULL,
  description               TEXT,
  logo_url                  TEXT,
  banner_url                TEXT,
  status                    public.entity_status NOT NULL DEFAULT 'pending',
  moderation_mode           public.shop_moderation_mode NOT NULL DEFAULT 'MANUAL',
  iyzico_submerchant_key    TEXT,
  iyzico_submerchant_id     TEXT,
  iyzico_onboarded_at       TIMESTAMPTZ,
  iban                      TEXT,
  tax_number                TEXT,
  tax_office                TEXT,
  company_name              TEXT,
  tckn                      TEXT,
  default_commission_rate   NUMERIC(5, 2) NOT NULL DEFAULT 8.00
                            CHECK (default_commission_rate >= 0 AND default_commission_rate <= 100),
  risk_level                public.settlement_risk_level NOT NULL DEFAULT 'NEW_SELLER',
  rating_avg                NUMERIC(3, 2),
  rating_count              INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  onboarding_step           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at               TIMESTAMPTZ,

  CONSTRAINT shops_slug_unique UNIQUE (slug)
);

CREATE INDEX shops_owner_id_idx ON public.shops (owner_id);
CREATE INDEX shops_status_idx ON public.shops (status);
CREATE INDEX shops_moderation_mode_idx ON public.shops (moderation_mode);

-- ---------------------------------------------------------------------------
-- seller_applications
-- ---------------------------------------------------------------------------

CREATE TABLE public.seller_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL,
  tax_number      TEXT,
  phone           TEXT,
  note            TEXT,
  status          public.entity_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX seller_applications_user_id_idx ON public.seller_applications (user_id);
CREATE INDEX seller_applications_status_idx ON public.seller_applications (status);

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------

CREATE TABLE public.addresses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title                 TEXT,
  full_name             TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  city                  TEXT NOT NULL,
  district              TEXT NOT NULL,
  address_line          TEXT NOT NULL,
  postal_code           TEXT,
  is_default_shipping   BOOLEAN NOT NULL DEFAULT false,
  is_default_billing    BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX addresses_user_id_idx ON public.addresses (user_id);

-- ---------------------------------------------------------------------------
-- platform_settings (key/value)
-- ---------------------------------------------------------------------------

CREATE TABLE public.platform_settings (
  key           TEXT PRIMARY KEY,
  value         JSONB NOT NULL DEFAULT '{}'::JSONB,
  description   TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by    UUID REFERENCES public.users (id) ON DELETE SET NULL
);

INSERT INTO public.platform_settings (key, value, description) VALUES
  (
    'default_commission_rate',
    '8'::JSONB,
    'Platform default commission percent when category/shop override is null'
  ),
  (
    'default_settlement_delay_days',
    '14'::JSONB,
    'Fallback settlement hold days when no settlement_policies row matches'
  );

-- ---------------------------------------------------------------------------
-- admin_logs (immutable audit trail)
-- ---------------------------------------------------------------------------

CREATE TABLE public.admin_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  old_data        JSONB,
  new_data        JSONB,
  metadata        JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_logs_admin_created_idx
  ON public.admin_logs (admin_user_id, created_at DESC);
CREATE INDEX admin_logs_entity_idx
  ON public.admin_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX admin_logs_action_idx
  ON public.admin_logs (action, created_at DESC);

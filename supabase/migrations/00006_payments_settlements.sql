-- =============================================================================
-- 00006_payments_settlements.sql
-- payments, payment_splits, settlement_policies, seller_settlements
-- iyzico split = primary settlement; DB = audit/reconciliation ledger
-- =============================================================================

-- ---------------------------------------------------------------------------
-- settlement_policies (configurable delay — no hard-coded hold days in app)
-- ---------------------------------------------------------------------------

CREATE TABLE public.settlement_policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  seller_id       UUID REFERENCES public.users (id) ON DELETE CASCADE,
  shop_id         UUID REFERENCES public.shops (id) ON DELETE CASCADE,
  category_id     UUID REFERENCES public.categories (id) ON DELETE CASCADE,
  risk_level      public.settlement_risk_level,
  delay_days      INT NOT NULL CHECK (delay_days >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  priority        INT NOT NULL DEFAULT 100,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX settlement_policies_active_priority_idx
  ON public.settlement_policies (is_active, priority)
  WHERE is_active = true;

CREATE INDEX settlement_policies_seller_idx
  ON public.settlement_policies (seller_id)
  WHERE seller_id IS NOT NULL;

CREATE INDEX settlement_policies_shop_idx
  ON public.settlement_policies (shop_id)
  WHERE shop_id IS NOT NULL;

CREATE INDEX settlement_policies_category_idx
  ON public.settlement_policies (category_id)
  WHERE category_id IS NOT NULL;

-- Default catch-all policy (delay from platform_settings can still override
-- via resolve function; this row gives an explicit DB default).
INSERT INTO public.settlement_policies (name, delay_days, priority, metadata)
VALUES (
  'Platform default',
  14,
  1000,
  '{"source": "seed", "note": "Fallback; prefer platform_settings.default_settlement_delay_days"}'::JSONB
);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------

CREATE TABLE public.payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  provider              TEXT NOT NULL DEFAULT 'iyzico',
  provider_payment_id   TEXT,
  conversation_id       TEXT,
  idempotency_key       TEXT NOT NULL,
  status                public.payment_status NOT NULL DEFAULT 'pending',
  amount                NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency              CHAR(3) NOT NULL DEFAULT 'TRY',
  raw_request           JSONB,
  raw_response          JSONB,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT payments_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE UNIQUE INDEX payments_provider_payment_id_uidx
  ON public.payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE INDEX payments_order_id_idx ON public.payments (order_id);
CREATE INDEX payments_conversation_id_idx ON public.payments (conversation_id)
  WHERE conversation_id IS NOT NULL;
CREATE INDEX payments_status_idx ON public.payments (status);

-- ---------------------------------------------------------------------------
-- payment_splits (iyzico marketplace basket lines)
-- ---------------------------------------------------------------------------

CREATE TABLE public.payment_splits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id            UUID NOT NULL REFERENCES public.payments (id) ON DELETE CASCADE,
  seller_order_id       UUID NOT NULL REFERENCES public.seller_orders (id) ON DELETE CASCADE,
  order_item_id         UUID REFERENCES public.order_items (id) ON DELETE SET NULL,
  shop_id               UUID NOT NULL REFERENCES public.shops (id) ON DELETE RESTRICT,
  submerchant_key       TEXT NOT NULL,
  item_amount           NUMERIC(12, 2) NOT NULL CHECK (item_amount >= 0),
  commission_amount     NUMERIC(12, 2) NOT NULL CHECK (commission_amount >= 0),
  submerchant_payout    NUMERIC(12, 2) NOT NULL,
  provider_split_id     TEXT,
  status                TEXT NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payment_splits_grain_uidx
  ON public.payment_splits (payment_id, seller_order_id, COALESCE(order_item_id, '00000000-0000-0000-0000-000000000000'::UUID));

CREATE INDEX payment_splits_seller_order_idx
  ON public.payment_splits (seller_order_id);

CREATE INDEX payment_splits_shop_idx
  ON public.payment_splits (shop_id);

-- ---------------------------------------------------------------------------
-- seller_settlements (internal audit ledger; 1 row per seller_order + payment)
-- ---------------------------------------------------------------------------

CREATE TABLE public.seller_settlements (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  UUID NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  seller_order_id           UUID NOT NULL REFERENCES public.seller_orders (id) ON DELETE RESTRICT,
  seller_id                 UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  shop_id                   UUID NOT NULL REFERENCES public.shops (id) ON DELETE RESTRICT,
  payment_id                UUID NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  provider_transaction_id   TEXT,
  gross_amount              NUMERIC(12, 2) NOT NULL CHECK (gross_amount >= 0),
  platform_commission       NUMERIC(12, 2) NOT NULL CHECK (platform_commission >= 0),
  provider_fee              NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (provider_fee >= 0),
  seller_net_amount         NUMERIC(12, 2) NOT NULL,
  currency                  CHAR(3) NOT NULL DEFAULT 'TRY',
  settlement_status         public.settlement_status NOT NULL DEFAULT 'PENDING',
  expected_settlement_at    TIMESTAMPTZ,
  provider_settled_at       TIMESTAMPTZ,
  released_at               TIMESTAMPTZ,
  refunded_amount           NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  chargeback_amount         NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (chargeback_amount >= 0),
  policy_id                 UUID REFERENCES public.settlement_policies (id) ON DELETE SET NULL,
  delay_days_applied        INT CHECK (delay_days_applied IS NULL OR delay_days_applied >= 0),
  metadata                  JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT seller_settlements_seller_order_payment_unique
    UNIQUE (seller_order_id, payment_id)
);

CREATE INDEX seller_settlements_status_expected_idx
  ON public.seller_settlements (settlement_status, expected_settlement_at);

CREATE INDEX seller_settlements_seller_status_idx
  ON public.seller_settlements (seller_id, settlement_status);

CREATE INDEX seller_settlements_order_id_idx
  ON public.seller_settlements (order_id);

CREATE INDEX seller_settlements_payment_id_idx
  ON public.seller_settlements (payment_id);

CREATE INDEX seller_settlements_provider_tx_idx
  ON public.seller_settlements (provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

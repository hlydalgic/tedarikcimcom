-- =============================================================================
-- 00007_invoices_webhooks.sql
-- Optional invoices (not required for shipping) + webhook idempotency
-- =============================================================================

-- ---------------------------------------------------------------------------
-- invoices (optional — seller may upload; never blocking fulfillment)
-- document_path = private storage path only (no public URL column)
-- ---------------------------------------------------------------------------

CREATE TABLE public.invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  seller_order_id   UUID NOT NULL REFERENCES public.seller_orders (id) ON DELETE RESTRICT,
  seller_id         UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  buyer_id          UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  invoice_number    TEXT NOT NULL,
  invoice_type      public.invoice_type NOT NULL DEFAULT 'SALES',
  invoice_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  document_path     TEXT,
  status            public.invoice_status NOT NULL DEFAULT 'DRAFT',
  total_amount      NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  currency          CHAR(3) NOT NULL DEFAULT 'TRY',
  metadata          JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number)
);

CREATE INDEX invoices_buyer_created_idx
  ON public.invoices (buyer_id, created_at DESC);

CREATE INDEX invoices_seller_created_idx
  ON public.invoices (seller_id, created_at DESC);

CREATE INDEX invoices_seller_order_idx
  ON public.invoices (seller_order_id);

CREATE INDEX invoices_order_id_idx
  ON public.invoices (order_id);

CREATE INDEX invoices_status_idx
  ON public.invoices (status);

-- ---------------------------------------------------------------------------
-- provider_webhook_events (idempotent webhook/callback processing)
-- ---------------------------------------------------------------------------

CREATE TABLE public.provider_webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL,
  event_id        TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'received'
                  CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT provider_webhook_events_provider_event_unique UNIQUE (provider, event_id)
);

CREATE INDEX provider_webhook_events_status_created_idx
  ON public.provider_webhook_events (status, created_at);

CREATE INDEX provider_webhook_events_provider_type_idx
  ON public.provider_webhook_events (provider, event_type);

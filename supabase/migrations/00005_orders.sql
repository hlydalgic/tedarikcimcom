-- =============================================================================
-- 00005_orders.sql
-- orders → seller_orders → order_items → shipments
-- =============================================================================

-- ---------------------------------------------------------------------------
-- orders (buyer parent order)
-- ---------------------------------------------------------------------------

CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        TEXT NOT NULL,
  buyer_id            UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  status              public.order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  currency            CHAR(3) NOT NULL DEFAULT 'TRY',
  subtotal            NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_total      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_total >= 0),
  discount_total      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  grand_total         NUMERIC(12, 2) NOT NULL CHECK (grand_total >= 0),
  shipping_address    JSONB NOT NULL,
  billing_address     JSONB NOT NULL,
  billing_type        TEXT CHECK (billing_type IS NULL OR billing_type IN ('individual', 'corporate')),
  notes               TEXT,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at        TIMESTAMPTZ,

  CONSTRAINT orders_order_number_unique UNIQUE (order_number)
);

CREATE INDEX orders_buyer_created_idx
  ON public.orders (buyer_id, created_at DESC);

CREATE INDEX orders_status_idx
  ON public.orders (status);

-- ---------------------------------------------------------------------------
-- seller_orders (suborder per shop)
-- ---------------------------------------------------------------------------

CREATE TABLE public.seller_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  seller_id             UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  shop_id               UUID NOT NULL REFERENCES public.shops (id) ON DELETE RESTRICT,
  suborder_number       TEXT NOT NULL,
  subtotal              NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_amount       NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount       NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  commission_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  seller_net_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status                public.seller_order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  fulfillment_status    public.fulfillment_status NOT NULL DEFAULT 'UNFULFILLED',
  shipment_status       public.shipment_status NOT NULL DEFAULT 'AWAITING_SHIPMENT',
  delivered_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT seller_orders_order_shop_unique UNIQUE (order_id, shop_id),
  CONSTRAINT seller_orders_suborder_number_unique UNIQUE (suborder_number)
);

CREATE INDEX seller_orders_seller_status_idx
  ON public.seller_orders (seller_id, status);

CREATE INDEX seller_orders_shop_status_idx
  ON public.seller_orders (shop_id, status);

CREATE INDEX seller_orders_order_id_idx
  ON public.seller_orders (order_id);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

CREATE TABLE public.order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  seller_order_id       UUID NOT NULL REFERENCES public.seller_orders (id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  variant_id            UUID REFERENCES public.product_variants (id) ON DELETE RESTRICT,
  shop_id               UUID NOT NULL REFERENCES public.shops (id) ON DELETE RESTRICT,
  seller_id             UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  category_id           UUID NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  title_snapshot        TEXT NOT NULL,
  sku_snapshot          TEXT,
  unit_price            NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity              INT NOT NULL CHECK (quantity > 0),
  line_total            NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
  commission_rate       NUMERIC(5, 2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_amount     NUMERIC(12, 2) NOT NULL CHECK (commission_amount >= 0),
  seller_net_amount     NUMERIC(12, 2) NOT NULL,
  shipping_type         public.shipping_type NOT NULL,
  shipping_price        NUMERIC(12, 2),
  status                public.order_item_status NOT NULL DEFAULT 'PENDING',
  quote_id              UUID REFERENCES public.seller_quotes (id) ON DELETE SET NULL,
  attribute_snapshot    JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX order_items_seller_order_idx
  ON public.order_items (seller_order_id);

CREATE INDEX order_items_order_id_idx
  ON public.order_items (order_id);

CREATE INDEX order_items_shop_status_idx
  ON public.order_items (shop_id, status);

CREATE INDEX order_items_seller_id_idx
  ON public.order_items (seller_id);

CREATE INDEX order_items_product_id_idx
  ON public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- shipments (per order_item; can expand to seller_order later)
-- ---------------------------------------------------------------------------

CREATE TABLE public.shipments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id               UUID NOT NULL REFERENCES public.order_items (id) ON DELETE CASCADE,
  seller_order_id             UUID NOT NULL REFERENCES public.seller_orders (id) ON DELETE CASCADE,
  carrier_code                TEXT,
  tracking_code               TEXT,
  kolay_gelsin_shipment_id    TEXT,
  status                      public.shipment_status NOT NULL DEFAULT 'AWAITING_SHIPMENT',
  shipped_at                  TIMESTAMPTZ,
  delivered_at                TIMESTAMPTZ,
  raw_payload                 JSONB,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX shipments_order_item_idx ON public.shipments (order_item_id);
CREATE INDEX shipments_seller_order_idx ON public.shipments (seller_order_id);
CREATE INDEX shipments_tracking_idx ON public.shipments (tracking_code)
  WHERE tracking_code IS NOT NULL;
CREATE INDEX shipments_kolay_gelsin_idx ON public.shipments (kolay_gelsin_shipment_id)
  WHERE kolay_gelsin_shipment_id IS NOT NULL;

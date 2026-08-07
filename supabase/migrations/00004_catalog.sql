-- =============================================================================
-- 00004_catalog.sql
-- Brands, products, EAV values, variants, images, quotes, favourites
-- =============================================================================

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------

CREATE TABLE public.brands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  logo_url        TEXT,
  status          public.entity_status NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ,

  CONSTRAINT brands_slug_unique UNIQUE (slug)
);

CREATE INDEX brands_status_idx ON public.brands (status);
CREATE INDEX brands_name_trgm_idx ON public.brands USING GIN (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- brand_categories (M2M)
-- ---------------------------------------------------------------------------

CREATE TABLE public.brand_categories (
  brand_id        UUID NOT NULL REFERENCES public.brands (id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (brand_id, category_id)
);

CREATE INDEX brand_categories_category_idx ON public.brand_categories (category_id);

-- ---------------------------------------------------------------------------
-- products (core fields only — dynamic attrs in product_attribute_values)
-- ---------------------------------------------------------------------------

CREATE TABLE public.products (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                 UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  shop_id                   UUID NOT NULL REFERENCES public.shops (id) ON DELETE RESTRICT,
  category_id               UUID NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  brand_id                  UUID REFERENCES public.brands (id) ON DELETE SET NULL,
  title                     TEXT NOT NULL,
  slug                      TEXT NOT NULL,
  description               TEXT,
  condition                 public.product_condition NOT NULL DEFAULT 'new',
  status                    public.product_status NOT NULL DEFAULT 'DRAFT',
  price                     NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_at_price          NUMERIC(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  currency                  CHAR(3) NOT NULL DEFAULT 'TRY',
  stock                     INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku                       TEXT,
  barcode                   TEXT,
  seller_sku                TEXT,
  shipping_type             public.shipping_type NOT NULL DEFAULT 'STANDARD',
  shipping_price            NUMERIC(12, 2) CHECK (shipping_price IS NULL OR shipping_price >= 0),
  weight_kg                 NUMERIC(10, 3) CHECK (weight_kg IS NULL OR weight_kg >= 0),
  rejection_reason          TEXT,
  moderation_note           TEXT,
  submitted_for_review_at   TIMESTAMPTZ,
  reviewed_at               TIMESTAMPTZ,
  reviewed_by               UUID REFERENCES public.users (id) ON DELETE SET NULL,
  published_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at               TIMESTAMPTZ,

  CONSTRAINT products_shop_slug_unique UNIQUE (shop_id, slug)
);

CREATE INDEX products_category_status_idx
  ON public.products (category_id, status);

CREATE INDEX products_shop_status_idx
  ON public.products (shop_id, status);

CREATE INDEX products_seller_id_idx
  ON public.products (seller_id);

CREATE INDEX products_brand_id_idx
  ON public.products (brand_id);

CREATE INDEX products_status_published_idx
  ON public.products (status, published_at DESC);

CREATE INDEX products_title_trgm_idx
  ON public.products USING GIN (title gin_trgm_ops);

CREATE INDEX products_title_fts_idx
  ON public.products
  USING GIN (to_tsvector('turkish', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  alt_text        TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX product_images_product_sort_idx
  ON public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- product_attribute_values (typed EAV)
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_attribute_values (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  attribute_id      UUID NOT NULL REFERENCES public.attributes (id) ON DELETE CASCADE,
  value_text        TEXT,
  value_number      NUMERIC,
  value_boolean     BOOLEAN,
  value_option_id   UUID REFERENCES public.attribute_options (id) ON DELETE SET NULL,
  value_json        JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT product_attribute_values_unique UNIQUE (product_id, attribute_id)
);

CREATE INDEX pav_attribute_option_idx
  ON public.product_attribute_values (attribute_id, value_option_id);

CREATE INDEX pav_attribute_number_idx
  ON public.product_attribute_values (attribute_id, value_number);

CREATE INDEX pav_attribute_boolean_idx
  ON public.product_attribute_values (attribute_id, value_boolean);

CREATE INDEX pav_attribute_text_idx
  ON public.product_attribute_values (attribute_id, value_text);

CREATE INDEX pav_value_json_gin_idx
  ON public.product_attribute_values USING GIN (value_json);

CREATE INDEX pav_product_id_idx
  ON public.product_attribute_values (product_id);

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  price             NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_at_price  NUMERIC(12, 2),
  stock             INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku               TEXT,
  barcode           TEXT,
  seller_sku        TEXT,
  status            public.entity_status NOT NULL DEFAULT 'active',
  images            JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at       TIMESTAMPTZ
);

CREATE INDEX product_variants_product_status_idx
  ON public.product_variants (product_id, status);

-- ---------------------------------------------------------------------------
-- variant_attribute_values
-- ---------------------------------------------------------------------------

CREATE TABLE public.variant_attribute_values (
  variant_id      UUID NOT NULL REFERENCES public.product_variants (id) ON DELETE CASCADE,
  attribute_id    UUID NOT NULL REFERENCES public.attributes (id) ON DELETE CASCADE,
  option_id       UUID NOT NULL REFERENCES public.attribute_options (id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (variant_id, attribute_id)
);

CREATE INDEX variant_attribute_values_option_idx
  ON public.variant_attribute_values (attribute_id, option_id);

-- ---------------------------------------------------------------------------
-- quote_requests (QUOTE_REQUIRED shipping)
-- ---------------------------------------------------------------------------

CREATE TABLE public.quote_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  product_id          UUID NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  quantity            INT NOT NULL CHECK (quantity > 0),
  delivery_address    JSONB NOT NULL,
  note                TEXT,
  status              public.quote_status NOT NULL DEFAULT 'open',
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quote_requests_customer_status_idx
  ON public.quote_requests (customer_id, status);

CREATE INDEX quote_requests_product_status_idx
  ON public.quote_requests (product_id, status);

-- ---------------------------------------------------------------------------
-- seller_quotes
-- ---------------------------------------------------------------------------

CREATE TABLE public.seller_quotes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id    UUID NOT NULL REFERENCES public.quote_requests (id) ON DELETE CASCADE,
  seller_id           UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  shop_id             UUID NOT NULL REFERENCES public.shops (id) ON DELETE RESTRICT,
  price               NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency            CHAR(3) NOT NULL DEFAULT 'TRY',
  estimated_days      INT CHECK (estimated_days IS NULL OR estimated_days >= 0),
  note                TEXT,
  status              public.quote_status NOT NULL DEFAULT 'open',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT seller_quotes_request_seller_unique UNIQUE (quote_request_id, seller_id)
);

CREATE INDEX seller_quotes_shop_status_idx
  ON public.seller_quotes (shop_id, status);

-- ---------------------------------------------------------------------------
-- favourites
-- ---------------------------------------------------------------------------

CREATE TABLE public.favourites (
  user_id         UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX favourites_product_id_idx ON public.favourites (product_id);

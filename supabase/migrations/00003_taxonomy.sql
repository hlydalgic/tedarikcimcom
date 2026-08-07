-- =============================================================================
-- 00003_taxonomy.sql
-- Dynamic category engine: units, categories (ltree), attributes, filters
-- =============================================================================

-- ---------------------------------------------------------------------------
-- units
-- ---------------------------------------------------------------------------

CREATE TABLE public.units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  symbol          TEXT NOT NULL,
  category        TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT units_symbol_category_unique UNIQUE (symbol, category)
);

CREATE INDEX units_category_idx ON public.units (category);

-- ---------------------------------------------------------------------------
-- categories (adjacency list + id-based ltree path)
-- path labels = UUID hex without hyphens (immutable ids, never slug/name)
-- ---------------------------------------------------------------------------

CREATE TABLE public.categories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id         UUID REFERENCES public.categories (id) ON DELETE RESTRICT,
  path              LTREE NOT NULL,
  depth             INT NOT NULL DEFAULT 0,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  image_url         TEXT,
  icon              TEXT,
  status            public.entity_status NOT NULL DEFAULT 'active',
  sort_order        INT NOT NULL DEFAULT 0,
  seo_title         TEXT,
  seo_description   TEXT,
  show_on_homepage  BOOLEAN NOT NULL DEFAULT false,
  show_in_nav       BOOLEAN NOT NULL DEFAULT true,
  commission_rate   NUMERIC(5, 2)
                    CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100)),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at       TIMESTAMPTZ,

  CONSTRAINT categories_no_self_parent CHECK (parent_id IS DISTINCT FROM id)
);

CREATE UNIQUE INDEX categories_root_slug_uidx
  ON public.categories (slug)
  WHERE parent_id IS NULL AND archived_at IS NULL;

CREATE UNIQUE INDEX categories_sibling_slug_uidx
  ON public.categories (parent_id, slug)
  WHERE parent_id IS NOT NULL AND archived_at IS NULL;

CREATE INDEX categories_parent_sort_idx
  ON public.categories (parent_id, sort_order);

CREATE INDEX categories_status_idx
  ON public.categories (status);

CREATE INDEX categories_path_gist_idx
  ON public.categories USING GIST (path);

CREATE INDEX categories_homepage_idx
  ON public.categories (show_on_homepage)
  WHERE show_on_homepage = true AND status = 'active';

-- ---------------------------------------------------------------------------
-- attributes (global definition catalog)
-- ---------------------------------------------------------------------------

CREATE TABLE public.attributes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  type                    public.attribute_type NOT NULL,
  unit_id                 UUID REFERENCES public.units (id) ON DELETE SET NULL,
  required                BOOLEAN NOT NULL DEFAULT false,
  filterable              BOOLEAN NOT NULL DEFAULT false,
  searchable              BOOLEAN NOT NULL DEFAULT false,
  comparable              BOOLEAN NOT NULL DEFAULT false,
  is_variant_attribute    BOOLEAN NOT NULL DEFAULT false,
  show_on_card            BOOLEAN NOT NULL DEFAULT false,
  show_on_detail          BOOLEAN NOT NULL DEFAULT true,
  show_in_specs           BOOLEAN NOT NULL DEFAULT true,
  show_in_seller_form     BOOLEAN NOT NULL DEFAULT true,
  sort_order              INT NOT NULL DEFAULT 0,
  placeholder             TEXT,
  help_text               TEXT,
  default_value           TEXT,
  validation_rules        JSONB NOT NULL DEFAULT '{}'::JSONB,
  status                  public.entity_status NOT NULL DEFAULT 'active',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at             TIMESTAMPTZ,

  CONSTRAINT attributes_slug_unique UNIQUE (slug)
);

CREATE INDEX attributes_type_idx ON public.attributes (type);
CREATE INDEX attributes_filterable_idx
  ON public.attributes (filterable)
  WHERE filterable = true;
CREATE INDEX attributes_searchable_idx
  ON public.attributes (searchable)
  WHERE searchable = true;
CREATE INDEX attributes_status_idx ON public.attributes (status);

-- ---------------------------------------------------------------------------
-- attribute_options
-- ---------------------------------------------------------------------------

CREATE TABLE public.attribute_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id    UUID NOT NULL REFERENCES public.attributes (id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  value           TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  status          public.entity_status NOT NULL DEFAULT 'active',
  color_hex       TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT attribute_options_attr_value_unique UNIQUE (attribute_id, value)
);

CREATE INDEX attribute_options_attribute_sort_idx
  ON public.attribute_options (attribute_id, sort_order);

-- ---------------------------------------------------------------------------
-- category_attributes (assignment + inheritance + overrides)
-- ---------------------------------------------------------------------------

CREATE TABLE public.category_attributes (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id                     UUID NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  attribute_id                    UUID NOT NULL REFERENCES public.attributes (id) ON DELETE CASCADE,
  inherited                       BOOLEAN NOT NULL DEFAULT false,
  inherited_from_category_id      UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  override_required               BOOLEAN,
  override_sort_order             INT,
  override_filterable             BOOLEAN,
  override_show_in_seller_form    BOOLEAN,
  is_active                       BOOLEAN NOT NULL DEFAULT true,
  filter_display_type             public.filter_display_type,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT category_attributes_unique UNIQUE (category_id, attribute_id)
);

CREATE INDEX category_attributes_category_active_idx
  ON public.category_attributes (category_id, is_active);

CREATE INDEX category_attributes_attribute_idx
  ON public.category_attributes (attribute_id);

CREATE INDEX category_attributes_inherited_from_idx
  ON public.category_attributes (inherited_from_category_id)
  WHERE inherited = true;

-- ---------------------------------------------------------------------------
-- category_system_filters
-- ---------------------------------------------------------------------------

CREATE TABLE public.category_system_filters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         UUID NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  filter_key          public.system_filter_key NOT NULL,
  enabled             BOOLEAN NOT NULL DEFAULT true,
  sort_order          INT NOT NULL DEFAULT 0,
  display_type        public.filter_display_type,
  default_collapsed   BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT category_system_filters_unique UNIQUE (category_id, filter_key)
);

CREATE INDEX category_system_filters_category_idx
  ON public.category_system_filters (category_id, sort_order)
  WHERE enabled = true;

-- ---------------------------------------------------------------------------
-- category_filters (ordered sidebar: attribute XOR system filter)
-- ---------------------------------------------------------------------------

CREATE TABLE public.category_filters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         UUID NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  attribute_id        UUID REFERENCES public.attributes (id) ON DELETE CASCADE,
  system_filter_key   public.system_filter_key,
  display_type        public.filter_display_type NOT NULL,
  sort_order          INT NOT NULL DEFAULT 0,
  is_enabled          BOOLEAN NOT NULL DEFAULT true,
  default_collapsed   BOOLEAN NOT NULL DEFAULT false,
  label_override      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT category_filters_xor CHECK (
    (attribute_id IS NOT NULL AND system_filter_key IS NULL)
    OR (attribute_id IS NULL AND system_filter_key IS NOT NULL)
  )
);

CREATE UNIQUE INDEX category_filters_attr_uidx
  ON public.category_filters (category_id, attribute_id)
  WHERE attribute_id IS NOT NULL;

CREATE UNIQUE INDEX category_filters_system_uidx
  ON public.category_filters (category_id, system_filter_key)
  WHERE system_filter_key IS NOT NULL;

CREATE INDEX category_filters_category_sort_idx
  ON public.category_filters (category_id, sort_order)
  WHERE is_enabled = true;

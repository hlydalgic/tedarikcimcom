-- =============================================================================
-- 00013_seed_taxonomy.sql
-- Sample taxonomy for engine tests (NOT production catalog data)
-- Demonstrates: category tree, shared attrs, inheritance, filters
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared / parent attributes
-- ---------------------------------------------------------------------------

INSERT INTO public.attributes (
  id, name, slug, type, unit_id,
  required, filterable, searchable, comparable, is_variant_attribute,
  show_on_card, show_on_detail, show_in_specs, show_in_seller_form,
  sort_order, placeholder, help_text, validation_rules, status
) VALUES
  -- Boru shared
  (
    'b2000000-0000-4000-8000-000000000001',
    'Marka', 'marka', 'TEXT', NULL,
    false, false, true, false, false,
    true, true, true, true,
    10, 'Ürün markası', 'Marka bilgisi (katalog markası ayrıca brand_id ile bağlanır)',
    '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'Malzeme', 'malzeme', 'SELECT', NULL,
    true, true, true, true, false,
    true, true, true, true,
    20, NULL, NULL,
    '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000003',
    'Çap', 'cap', 'NUMBER', 'a1000000-0000-4000-8000-000000000001', -- mm
    true, true, true, true, true,
    true, true, true, true,
    30, 'örn. 32', 'Dış çap (mm)',
    '{"min": 1, "max": 2000, "step": 0.1}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000004',
    'Uzunluk', 'uzunluk', 'NUMBER', 'a1000000-0000-4000-8000-000000000003', -- m
    false, true, false, true, false,
    true, true, true, true,
    40, 'örn. 6', 'Boru / hortum uzunluğu (m)',
    '{"min": 0.1, "max": 500, "step": 0.1}'::JSONB, 'active'
  ),
  -- HDPE-specific
  (
    'b2000000-0000-4000-8000-000000000011',
    'Basınç Sınıfı / PN', 'basinc-sinifi-pn', 'SELECT', NULL,
    true, true, true, true, false,
    true, true, true, true,
    50, NULL, 'Nominal basınç sınıfı',
    '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000012',
    'SDR', 'sdr', 'SELECT', NULL,
    false, true, true, true, false,
    true, true, true, true,
    60, NULL, 'Standard Dimension Ratio',
    '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000013',
    'Renk', 'renk', 'COLOR', NULL,
    false, true, false, false, false,
    true, true, true, true,
    70, NULL, NULL,
    '{}'::JSONB, 'active'
  ),
  -- PPRC-specific
  (
    'b2000000-0000-4000-8000-000000000021',
    'PPR Tipi', 'ppr-tipi', 'SELECT', NULL,
    false, true, false, false, false,
    false, true, true, true,
    55, NULL, NULL,
    '{}'::JSONB, 'active'
  ),
  -- UPVC-specific
  (
    'b2000000-0000-4000-8000-000000000031',
    'SN Sınıfı', 'sn-sinifi', 'SELECT', NULL,
    false, true, false, false, false,
    false, true, true, true,
    55, NULL, 'Ring stiffness class',
    '{}'::JSONB, 'active'
  ),
  -- Koruge-specific
  (
    'b2000000-0000-4000-8000-000000000041',
    'Halka Sertliği', 'halka-sertligi', 'SELECT', NULL,
    false, true, false, false, false,
    false, true, true, true,
    55, NULL, NULL,
    '{}'::JSONB, 'active'
  ),
  -- Küresel Vana
  (
    'b2000000-0000-4000-8000-000000000051',
    'Bağlantı Tipi', 'baglanti-tipi', 'SELECT', NULL,
    true, true, true, false, false,
    true, true, true, true,
    50, NULL, NULL,
    '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000052',
    'Basınç Sınıfı', 'basinc-sinifi-vana', 'SELECT', NULL,
    true, true, true, true, false,
    true, true, true, true,
    60, NULL, NULL,
    '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000053',
    'Gövde Malzemesi', 'govde-malzemesi', 'SELECT', NULL,
    true, true, true, true, false,
    true, true, true, true,
    70, NULL, NULL,
    '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000054',
    'Çalışma Sıcaklığı', 'calisma-sicakligi', 'RANGE',
    'a1000000-0000-4000-8000-000000000061', -- °C
    false, true, false, true, false,
    false, true, true, true,
    80, NULL, 'Min–max çalışma sıcaklığı (°C)',
    '{"min": -50, "max": 400}'::JSONB, 'active'
  ),
  -- Bahçe Hortumu (TEST 2 smoke)
  (
    'b2000000-0000-4000-8000-000000000061',
    'UV Dayanımı', 'uv-dayanimi', 'BOOLEAN', NULL,
    false, true, false, false, false,
    true, true, true, true,
    50, NULL, 'UV dayanımlı mı?',
    '{}'::JSONB, 'active'
  ),
  (
    'b2000000-0000-4000-8000-000000000062',
    'Basınç', 'basinc-hortum', 'NUMBER',
    'a1000000-0000-4000-8000-000000000021', -- bar
    false, true, false, true, false,
    true, true, true, true,
    60, NULL, 'Maks. çalışma basıncı (bar)',
    '{"min": 0, "max": 50, "step": 0.5}'::JSONB, 'active'
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  unit_id = EXCLUDED.unit_id,
  required = EXCLUDED.required,
  filterable = EXCLUDED.filterable,
  searchable = EXCLUDED.searchable,
  is_variant_attribute = EXCLUDED.is_variant_attribute,
  validation_rules = EXCLUDED.validation_rules,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Attribute options
-- ---------------------------------------------------------------------------

INSERT INTO public.attribute_options (id, attribute_id, label, value, sort_order, status, color_hex) VALUES
  -- Malzeme
  ('c3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000002', 'PE100', 'PE100', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000002', 'PE80', 'PE80', 2, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000002', 'PPR-C', 'PPR-C', 3, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000002', 'UPVC', 'UPVC', 4, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000002', 'HDPE', 'HDPE', 5, 'active', NULL),
  -- Basınç Sınıfı / PN (boru)
  ('c3000000-0000-4000-8000-000000000011', 'b2000000-0000-4000-8000-000000000011', 'PN6', 'PN6', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000012', 'b2000000-0000-4000-8000-000000000011', 'PN10', 'PN10', 2, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000013', 'b2000000-0000-4000-8000-000000000011', 'PN16', 'PN16', 3, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000014', 'b2000000-0000-4000-8000-000000000011', 'PN20', 'PN20', 4, 'active', NULL),
  -- SDR
  ('c3000000-0000-4000-8000-000000000021', 'b2000000-0000-4000-8000-000000000012', 'SDR11', 'SDR11', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000022', 'b2000000-0000-4000-8000-000000000012', 'SDR17', 'SDR17', 2, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000023', 'b2000000-0000-4000-8000-000000000012', 'SDR26', 'SDR26', 3, 'active', NULL),
  -- Renk
  ('c3000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000013', 'Siyah', 'siyah', 1, 'active', '#1A1A1A'),
  ('c3000000-0000-4000-8000-000000000032', 'b2000000-0000-4000-8000-000000000013', 'Mavi', 'mavi', 2, 'active', '#1E5AA8'),
  ('c3000000-0000-4000-8000-000000000033', 'b2000000-0000-4000-8000-000000000013', 'Sarı', 'sari', 3, 'active', '#F5C518'),
  -- PPR tipi
  ('c3000000-0000-4000-8000-000000000041', 'b2000000-0000-4000-8000-000000000021', 'Tip 3', 'tip-3', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000042', 'b2000000-0000-4000-8000-000000000021', 'Tip 4', 'tip-4', 2, 'active', NULL),
  -- SN
  ('c3000000-0000-4000-8000-000000000051', 'b2000000-0000-4000-8000-000000000031', 'SN4', 'SN4', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000052', 'b2000000-0000-4000-8000-000000000031', 'SN8', 'SN8', 2, 'active', NULL),
  -- Halka sertliği
  ('c3000000-0000-4000-8000-000000000061', 'b2000000-0000-4000-8000-000000000041', 'SN4', 'SN4', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000062', 'b2000000-0000-4000-8000-000000000041', 'SN8', 'SN8', 2, 'active', NULL),
  -- Bağlantı tipi
  ('c3000000-0000-4000-8000-000000000071', 'b2000000-0000-4000-8000-000000000051', 'Dişli', 'disli', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000072', 'b2000000-0000-4000-8000-000000000051', 'Flanşlı', 'flansli', 2, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000073', 'b2000000-0000-4000-8000-000000000051', 'Kaynaklı', 'kaynakli', 3, 'active', NULL),
  -- Vana PN
  ('c3000000-0000-4000-8000-000000000081', 'b2000000-0000-4000-8000-000000000052', 'PN10', 'PN10', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000082', 'b2000000-0000-4000-8000-000000000052', 'PN16', 'PN16', 2, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000083', 'b2000000-0000-4000-8000-000000000052', 'PN25', 'PN25', 3, 'active', NULL),
  -- Gövde malzemesi
  ('c3000000-0000-4000-8000-000000000091', 'b2000000-0000-4000-8000-000000000053', 'Pirinç', 'pirinc', 1, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000092', 'b2000000-0000-4000-8000-000000000053', 'Paslanmaz', 'paslanmaz', 2, 'active', NULL),
  ('c3000000-0000-4000-8000-000000000093', 'b2000000-0000-4000-8000-000000000053', 'Dökme Demir', 'dokme-demir', 3, 'active', NULL)
ON CONFLICT (attribute_id, value) DO UPDATE
SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, color_hex = EXCLUDED.color_hex;

-- ---------------------------------------------------------------------------
-- Category tree (fixed UUIDs → path via categories_before_write trigger)
-- ---------------------------------------------------------------------------

-- Roots
INSERT INTO public.categories (
  id, parent_id, name, slug, description, status, sort_order,
  show_on_homepage, show_in_nav, path, depth
) VALUES
  (
    'd4000000-0000-4000-8000-000000000001', NULL,
    'Tesisat', 'tesisat', 'Tesisat ve boru sistemleri (seed)',
    'active', 1, true, true,
    'd400000000004000800000000000000001'::LTREE, 0
  ),
  (
    'd4000000-0000-4000-8000-000000000002', NULL,
    'Hırdavat', 'hirdavat', 'Hırdavat ve bağlantı (seed)',
    'active', 2, true, true,
    'd400000000004000800000000000000002'::LTREE, 0
  ),
  (
    'd4000000-0000-4000-8000-000000000003', NULL,
    'Sulama Sistemleri', 'sulama-sistemleri', 'Sulama ve bahçe (seed)',
    'active', 3, true, true,
    'd400000000004000800000000000000003'::LTREE, 0
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, slug = EXCLUDED.slug, updated_at = now();

-- Level 1 under Tesisat / Hırdavat / Sulama
INSERT INTO public.categories (
  id, parent_id, name, slug, description, status, sort_order,
  show_on_homepage, show_in_nav, path, depth
) VALUES
  (
    'd4000000-0000-4000-8000-000000000011',
    'd4000000-0000-4000-8000-000000000001',
    'Boru', 'boru', 'Boru ana kategorisi',
    'active', 1, false, true,
    'd400000000004000800000000000000001.d400000000004000800000000000000011'::LTREE, 1
  ),
  (
    'd4000000-0000-4000-8000-000000000012',
    'd4000000-0000-4000-8000-000000000001',
    'Vana', 'vana', 'Vana ana kategorisi',
    'active', 2, false, true,
    'd400000000004000800000000000000001.d400000000004000800000000000000012'::LTREE, 1
  ),
  (
    'd4000000-0000-4000-8000-000000000021',
    'd4000000-0000-4000-8000-000000000002',
    'Bağlantı Elemanları', 'baglanti-elemanlari', NULL,
    'active', 1, false, true,
    'd400000000004000800000000000000002.d400000000004000800000000000000021'::LTREE, 1
  ),
  (
    'd4000000-0000-4000-8000-000000000031',
    'd4000000-0000-4000-8000-000000000003',
    'Bahçe Hortumu', 'bahce-hortumu', NULL,
    'active', 1, true, true,
    'd400000000004000800000000000000003.d400000000004000800000000000000031'::LTREE, 1
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, updated_at = now();

-- Level 2 under Boru / Vana
INSERT INTO public.categories (
  id, parent_id, name, slug, description, status, sort_order,
  show_on_homepage, show_in_nav, path, depth
) VALUES
  (
    'd4000000-0000-4000-8000-000000000111',
    'd4000000-0000-4000-8000-000000000011',
    'PPRC Boru', 'pprc-boru', NULL, 'active', 1, false, true,
    'd400000000004000800000000000000001.d400000000004000800000000000000011.d400000000004000800000000000000111'::LTREE, 2
  ),
  (
    'd4000000-0000-4000-8000-000000000112',
    'd4000000-0000-4000-8000-000000000011',
    'HDPE Boru', 'hdpe-boru', NULL, 'active', 2, true, true,
    'd400000000004000800000000000000001.d400000000004000800000000000000011.d400000000004000800000000000000112'::LTREE, 2
  ),
  (
    'd4000000-0000-4000-8000-000000000113',
    'd4000000-0000-4000-8000-000000000011',
    'UPVC Boru', 'upvc-boru', NULL, 'active', 3, false, true,
    'd400000000004000800000000000000001.d400000000004000800000000000000011.d400000000004000800000000000000113'::LTREE, 2
  ),
  (
    'd4000000-0000-4000-8000-000000000114',
    'd4000000-0000-4000-8000-000000000011',
    'Koruge Boru', 'koruge-boru', NULL, 'active', 4, false, true,
    'd400000000004000800000000000000001.d400000000004000800000000000000011.d400000000004000800000000000000114'::LTREE, 2
  ),
  (
    'd4000000-0000-4000-8000-000000000121',
    'd4000000-0000-4000-8000-000000000012',
    'Küresel Vana', 'kuresel-vana', NULL, 'active', 1, true, true,
    'd400000000004000800000000000000001.d400000000004000800000000000000012.d400000000004000800000000000000121'::LTREE, 2
  ),
  (
    'd4000000-0000-4000-8000-000000000122',
    'd4000000-0000-4000-8000-000000000012',
    'Kelebek Vana', 'kelebek-vana', NULL, 'active', 2, false, true,
    'd400000000004000800000000000000001.d400000000004000800000000000000012.d400000000004000800000000000000122'::LTREE, 2
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, updated_at = now();

-- Fix HDPE path typo if trigger recalculates on conflict update of parent_id —
-- Force correct paths via UPDATE so trigger rewrite is consistent
UPDATE public.categories SET parent_id = parent_id WHERE id IN (
  'd4000000-0000-4000-8000-000000000111',
  'd4000000-0000-4000-8000-000000000112',
  'd4000000-0000-4000-8000-000000000113',
  'd4000000-0000-4000-8000-000000000114',
  'd4000000-0000-4000-8000-000000000121',
  'd4000000-0000-4000-8000-000000000122'
);

-- ---------------------------------------------------------------------------
-- category_attributes: Boru parent (local) + children inherit + local extras
-- ---------------------------------------------------------------------------

-- Boru parent: Marka, Malzeme, Çap, Uzunluk (local, not inherited)
INSERT INTO public.category_attributes (
  id, category_id, attribute_id, inherited, inherited_from_category_id, is_active, override_sort_order
) VALUES
  ('e5000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000011', 'b2000000-0000-4000-8000-000000000001', false, NULL, true, 10),
  ('e5000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000011', 'b2000000-0000-4000-8000-000000000002', false, NULL, true, 20),
  ('e5000000-0000-4000-8000-000000000003', 'd4000000-0000-4000-8000-000000000011', 'b2000000-0000-4000-8000-000000000003', false, NULL, true, 30),
  ('e5000000-0000-4000-8000-000000000004', 'd4000000-0000-4000-8000-000000000011', 'b2000000-0000-4000-8000-000000000004', false, NULL, true, 40)
ON CONFLICT (category_id, attribute_id) DO UPDATE
SET inherited = EXCLUDED.inherited, is_active = true, updated_at = now();

-- Helper: inherit Boru attrs onto pipe children
INSERT INTO public.category_attributes (
  category_id, attribute_id, inherited, inherited_from_category_id, is_active, override_sort_order
)
SELECT
  child.id,
  ca.attribute_id,
  true,
  'd4000000-0000-4000-8000-000000000011',
  true,
  ca.override_sort_order
FROM public.categories child
CROSS JOIN public.category_attributes ca
WHERE child.parent_id = 'd4000000-0000-4000-8000-000000000011'
  AND ca.category_id = 'd4000000-0000-4000-8000-000000000011'
ON CONFLICT (category_id, attribute_id) DO UPDATE
SET
  inherited = true,
  inherited_from_category_id = 'd4000000-0000-4000-8000-000000000011',
  is_active = true,
  updated_at = now();

-- HDPE local attrs
INSERT INTO public.category_attributes (
  category_id, attribute_id, inherited, is_active, override_sort_order, filter_display_type
) VALUES
  ('d4000000-0000-4000-8000-000000000112', 'b2000000-0000-4000-8000-000000000011', false, true, 50, 'CHECKBOX'),
  ('d4000000-0000-4000-8000-000000000112', 'b2000000-0000-4000-8000-000000000012', false, true, 60, 'CHECKBOX'),
  ('d4000000-0000-4000-8000-000000000112', 'b2000000-0000-4000-8000-000000000013', false, true, 70, 'COLOR_SWATCHES')
ON CONFLICT (category_id, attribute_id) DO UPDATE
SET inherited = false, is_active = true, filter_display_type = EXCLUDED.filter_display_type, updated_at = now();

-- PPRC / UPVC / Koruge local
INSERT INTO public.category_attributes (category_id, attribute_id, inherited, is_active, override_sort_order)
VALUES
  ('d4000000-0000-4000-8000-000000000111', 'b2000000-0000-4000-8000-000000000021', false, true, 55),
  ('d4000000-0000-4000-8000-000000000113', 'b2000000-0000-4000-8000-000000000031', false, true, 55),
  ('d4000000-0000-4000-8000-000000000114', 'b2000000-0000-4000-8000-000000000041', false, true, 55)
ON CONFLICT (category_id, attribute_id) DO UPDATE
SET is_active = true, updated_at = now();

-- Küresel Vana: Çap (shared) + local valve attrs
INSERT INTO public.category_attributes (
  category_id, attribute_id, inherited, is_active, override_sort_order, filter_display_type
) VALUES
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000003', false, true, 30, 'RANGE_SLIDER'),
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000051', false, true, 50, 'CHECKBOX'),
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000052', false, true, 60, 'CHECKBOX'),
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000053', false, true, 70, 'CHECKBOX'),
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000054', false, true, 80, 'MIN_MAX')
ON CONFLICT (category_id, attribute_id) DO UPDATE
SET is_active = true, filter_display_type = EXCLUDED.filter_display_type, updated_at = now();

-- Bahçe Hortumu
INSERT INTO public.category_attributes (category_id, attribute_id, inherited, is_active, override_sort_order)
VALUES
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000004', false, true, 10), -- uzunluk
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000003', false, true, 20), -- çap
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000013', false, true, 30), -- renk
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000061', false, true, 40), -- UV
  ('d4000000-0000-4000-8000-000000000031', 'b2000000-0000-4000-8000-000000000062', false, true, 50)  -- basınç
ON CONFLICT (category_id, attribute_id) DO UPDATE
SET is_active = true, updated_at = now();

-- ---------------------------------------------------------------------------
-- HDPE Boru filters (system + attribute)
-- ---------------------------------------------------------------------------

INSERT INTO public.category_system_filters (
  category_id, filter_key, enabled, sort_order, display_type, default_collapsed
) VALUES
  ('d4000000-0000-4000-8000-000000000112', 'price', true, 1, 'RANGE_SLIDER', false),
  ('d4000000-0000-4000-8000-000000000112', 'brand', true, 2, 'SEARCHABLE_CHECKBOX_LIST', false),
  ('d4000000-0000-4000-8000-000000000112', 'in_stock', true, 90, 'TOGGLE', true),
  ('d4000000-0000-4000-8000-000000000112', 'free_shipping', true, 91, 'TOGGLE', true)
ON CONFLICT (category_id, filter_key) DO UPDATE
SET enabled = true, sort_order = EXCLUDED.sort_order, display_type = EXCLUDED.display_type;

-- HDPE Boru category_filters (idempotent replace)
DELETE FROM public.category_filters
WHERE category_id = 'd4000000-0000-4000-8000-000000000112';

INSERT INTO public.category_filters (
  category_id, attribute_id, system_filter_key, display_type, sort_order, is_enabled, default_collapsed
) VALUES
  ('d4000000-0000-4000-8000-000000000112', NULL, 'price', 'RANGE_SLIDER', 1, true, false),
  ('d4000000-0000-4000-8000-000000000112', NULL, 'brand', 'SEARCHABLE_CHECKBOX_LIST', 2, true, false),
  ('d4000000-0000-4000-8000-000000000112', 'b2000000-0000-4000-8000-000000000003', NULL, 'RANGE_SLIDER', 3, true, false),
  ('d4000000-0000-4000-8000-000000000112', 'b2000000-0000-4000-8000-000000000011', NULL, 'CHECKBOX', 4, true, false),
  ('d4000000-0000-4000-8000-000000000112', 'b2000000-0000-4000-8000-000000000012', NULL, 'CHECKBOX', 5, true, false),
  ('d4000000-0000-4000-8000-000000000112', 'b2000000-0000-4000-8000-000000000004', NULL, 'RANGE_SLIDER', 6, true, false);

-- Küresel Vana filters (smoke)
DELETE FROM public.category_filters
WHERE category_id = 'd4000000-0000-4000-8000-000000000121';

INSERT INTO public.category_filters (
  category_id, attribute_id, system_filter_key, display_type, sort_order, is_enabled
) VALUES
  ('d4000000-0000-4000-8000-000000000121', NULL, 'price', 'RANGE_SLIDER', 1, true),
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000003', NULL, 'RANGE_SLIDER', 2, true),
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000051', NULL, 'CHECKBOX', 3, true),
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000052', NULL, 'CHECKBOX', 4, true),
  ('d4000000-0000-4000-8000-000000000121', 'b2000000-0000-4000-8000-000000000053', NULL, 'CHECKBOX', 5, true);

-- ---------------------------------------------------------------------------
-- Sample brands (for Marka / brand filter)
-- ---------------------------------------------------------------------------

INSERT INTO public.brands (id, name, slug, status) VALUES
  ('f6000000-0000-4000-8000-000000000001', 'Fırat', 'firat', 'active'),
  ('f6000000-0000-4000-8000-000000000002', 'Dizayn', 'dizayn', 'active'),
  ('f6000000-0000-4000-8000-000000000003', 'Superlit', 'superlit', 'active'),
  ('f6000000-0000-4000-8000-000000000004', 'Kalde', 'kalde', 'active')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, status = 'active';

INSERT INTO public.brand_categories (brand_id, category_id) VALUES
  ('f6000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000011'),
  ('f6000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000112'),
  ('f6000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000112'),
  ('f6000000-0000-4000-8000-000000000003', 'd4000000-0000-4000-8000-000000000112'),
  ('f6000000-0000-4000-8000-000000000004', 'd4000000-0000-4000-8000-000000000121')
ON CONFLICT DO NOTHING;

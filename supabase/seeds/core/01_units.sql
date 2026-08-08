-- =============================================================================
-- 00011_seed_units.sql
-- Measurement units for NUMBER_WITH_UNIT / display
-- =============================================================================

INSERT INTO public.units (id, name, symbol, category) VALUES
  -- length
  ('a1000000-0000-4000-8000-000000000001', 'Milimetre', 'mm', 'length'),
  ('a1000000-0000-4000-8000-000000000002', 'Santimetre', 'cm', 'length'),
  ('a1000000-0000-4000-8000-000000000003', 'Metre', 'm', 'length'),
  ('a1000000-0000-4000-8000-000000000004', 'İnç', 'inch', 'length'),
  -- mass
  ('a1000000-0000-4000-8000-000000000011', 'Kilogram', 'kg', 'weight'),
  ('a1000000-0000-4000-8000-000000000012', 'Gram', 'g', 'weight'),
  -- pressure
  ('a1000000-0000-4000-8000-000000000021', 'Bar', 'bar', 'pressure'),
  ('a1000000-0000-4000-8000-000000000022', 'PSI', 'psi', 'pressure'),
  -- electrical
  ('a1000000-0000-4000-8000-000000000031', 'Volt', 'volt', 'electrical'),
  ('a1000000-0000-4000-8000-000000000032', 'Watt', 'watt', 'electrical'),
  -- volume
  ('a1000000-0000-4000-8000-000000000041', 'Litre', 'litre', 'volume'),
  -- quantity
  ('a1000000-0000-4000-8000-000000000051', 'Adet', 'adet', 'quantity'),
  -- temperature
  ('a1000000-0000-4000-8000-000000000061', 'Derece Celsius', '°C', 'temperature')
ON CONFLICT (symbol, category) DO UPDATE
SET name = EXCLUDED.name;

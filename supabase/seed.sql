-- =============================================================================
-- Seed orchestrator (supabase db reset)
-- Strategy A: schema stays in migrations; data seeds live here.
-- Migrations 00011–00013 remain in history for existing deploys;
-- new instances should rely on this seeds/ tree.
-- =============================================================================

\ir seeds/core/01_units.sql
\ir seeds/core/02_platform_settings.sql
\ir seeds/core/03_marketplace_features.sql
\ir seeds/instance/01_marketplace_settings.sql
\ir seeds/instance/02_taxonomy.sql
\ir seeds/instance/03_brands.sql

-- =============================================================================
-- 00012_seed_platform_settings.sql
-- Platform defaults (no hard-coded delay/commission in application code)
-- =============================================================================

INSERT INTO public.platform_settings (key, value, description) VALUES
  (
    'default_commission_rate',
    '8'::JSONB,
    'Platform default commission percent when category/shop override is null'
  ),
  (
    'default_delay_days',
    '14'::JSONB,
    'Alias for settlement hold days (admin-facing key)'
  ),
  (
    'default_settlement_delay_days',
    '14'::JSONB,
    'Fallback used by resolve_settlement_policy when no policy matches'
  ),
  (
    'payout_hold_days',
    '14'::JSONB,
    'Internal ledger hold days after delivery before ELIGIBLE'
  )
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

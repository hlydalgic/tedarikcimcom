-- =============================================================================
-- Instance seed: marketplace branding (this deployment = tedarikcim)
-- Swap this file for other white-label instances
-- =============================================================================

INSERT INTO public.marketplace_settings (
  marketplace_name,
  short_name,
  logo_url,
  logo_dark_url,
  favicon_url,
  primary_color,
  secondary_color,
  accent_color,
  support_email,
  support_phone,
  company_name,
  default_currency,
  default_country,
  default_locale,
  seo_title,
  seo_description,
  tagline,
  social_links
) VALUES (
  'tedarikcim',
  'tedarikcim',
  NULL,
  NULL,
  NULL,
  '#0A4D8C',
  '#1A6B9A',
  '#FF6B1A',
  'destek@tedarikcim.com',
  NULL,
  'tedarikcim',
  'TRY',
  'TR',
  'tr',
  'Türkiye''nin Teknik Ürünler Pazaryeri',
  'Boru, vana, hırdavat ve altyapı malzemelerini doğrulanmış satıcılardan güvenle tedarik edin.',
  'Boru, hırdavat, vana ve daha fazlası — güvenilir satıcılardan tek platformda',
  '{}'::JSONB
)
ON CONFLICT ((true)) DO UPDATE SET
  marketplace_name = EXCLUDED.marketplace_name,
  short_name = EXCLUDED.short_name,
  logo_url = EXCLUDED.logo_url,
  logo_dark_url = EXCLUDED.logo_dark_url,
  favicon_url = EXCLUDED.favicon_url,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  accent_color = EXCLUDED.accent_color,
  support_email = EXCLUDED.support_email,
  support_phone = EXCLUDED.support_phone,
  company_name = EXCLUDED.company_name,
  default_currency = EXCLUDED.default_currency,
  default_country = EXCLUDED.default_country,
  default_locale = EXCLUDED.default_locale,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  tagline = EXCLUDED.tagline,
  social_links = EXCLUDED.social_links,
  updated_at = now();

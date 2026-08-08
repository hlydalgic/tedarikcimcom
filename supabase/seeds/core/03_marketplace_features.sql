-- =============================================================================
-- Core seed: marketplace feature flags (single row)
-- =============================================================================

INSERT INTO public.marketplace_features (
  reviews_enabled,
  favorites_enabled,
  quotes_enabled,
  special_shipping_enabled,
  product_variants_enabled,
  seller_chat_enabled,
  b2b_pricing_enabled,
  compare_products_enabled,
  coupons_enabled
) VALUES (
  false,
  true,
  true,
  true,
  true,
  false,
  false,
  false,
  false
)
ON CONFLICT ((true)) DO UPDATE SET
  reviews_enabled = EXCLUDED.reviews_enabled,
  favorites_enabled = EXCLUDED.favorites_enabled,
  quotes_enabled = EXCLUDED.quotes_enabled,
  special_shipping_enabled = EXCLUDED.special_shipping_enabled,
  product_variants_enabled = EXCLUDED.product_variants_enabled,
  seller_chat_enabled = EXCLUDED.seller_chat_enabled,
  b2b_pricing_enabled = EXCLUDED.b2b_pricing_enabled,
  compare_products_enabled = EXCLUDED.compare_products_enabled,
  coupons_enabled = EXCLUDED.coupons_enabled,
  updated_at = now();

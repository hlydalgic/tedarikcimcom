export const ANALYTICS_EVENTS = [
  "view_home",
  "view_category",
  "view_product",
  "search",
  "apply_filter",
  "add_to_favorite",
  "add_to_cart",
  "begin_checkout",
  "purchase",
  "seller_signup_started",
  "seller_signup_completed",
  "product_published",
  "quote_request_submitted",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

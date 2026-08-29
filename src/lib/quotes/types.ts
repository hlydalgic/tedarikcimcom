export const QUOTE_STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  quoted: "Teklif verildi",
  accepted: "Kabul edildi",
  rejected: "Reddedildi",
  expired: "Süresi doldu",
  cancelled: "İptal edildi",
};

export type QuoteAddressSnapshot = {
  full_name: string;
  phone: string;
  city: string;
  district: string;
  address_line: string;
  postal_code?: string;
};

export type QuoteRequestListItem = {
  id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  product_image: string | null;
  quantity: number;
  status: string;
  note: string | null;
  expires_at: string | null;
  created_at: string;
  quote_count: number;
};

export type SellerQuoteRow = {
  id: string;
  quote_request_id: string;
  seller_id: string;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  price: number;
  currency: string;
  estimated_days: number | null;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type QuoteRequestDetail = {
  id: string;
  customer_id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  product_image: string | null;
  product_price: number;
  product_currency: string;
  quantity: number;
  delivery_address: QuoteAddressSnapshot;
  note: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  seller_quotes: SellerQuoteRow[];
};

export type SellerQuoteRequestListItem = {
  id: string;
  product_title: string;
  product_slug: string;
  quantity: number;
  status: string;
  note: string | null;
  expires_at: string | null;
  created_at: string;
  customer_name: string | null;
  my_quote_status: string | null;
  my_quote_price: number | null;
};

export type SellerQuoteRequestDetail = QuoteRequestDetail & {
  customer_name: string | null;
  my_quote: SellerQuoteRow | null;
};

export type AdminQuoteRequestRow = {
  id: string;
  product_title: string;
  customer_name: string | null;
  quantity: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  quote_count: number;
  is_expired: boolean;
};

export type QuoteCheckoutDetail = {
  quote_id: string;
  request_id: string;
  product_title: string;
  product_slug: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  shipping_price: number;
  currency: string;
  shop_name: string;
  delivery_address: QuoteAddressSnapshot;
  estimated_days: number | null;
};

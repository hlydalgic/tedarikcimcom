export type AddressSnapshot = {
  title?: string;
  full_name: string;
  phone: string;
  city: string;
  district: string;
  address_line: string;
  postal_code?: string;
  company_name?: string;
  tax_number?: string;
  tax_office?: string;
};

export type AddressRow = {
  id: string;
  user_id: string;
  title: string | null;
  full_name: string;
  phone: string;
  city: string;
  district: string;
  address_line: string;
  postal_code: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
};

export type ShopShippingSelection = Record<
  string,
  { amount: number; label: string }
>;

export type CheckoutPayload = {
  items: { product_id: string; quantity: number }[];
  shop_shipping: Record<string, { amount: number }>;
  shipping_address: AddressSnapshot;
  billing_address: AddressSnapshot;
  billing_type: "individual" | "corporate";
  notes?: string;
  currency: string;
  mock_payment: boolean;
  mock_payment_id?: string;
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Ödeme bekleniyor",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  PARTIALLY_FULFILLED: "Kısmen tamamlandı",
  FULFILLED: "Tamamlandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal edildi",
  REFUNDED: "İade edildi",
  PARTIALLY_REFUNDED: "Kısmi iade",
  DISPUTED: "Anlaşmazlık",
};

export const SELLER_ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Ödeme bekleniyor",
  PAID: "Ödendi — hazırlanacak",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
  REFUNDED: "İade",
  PARTIALLY_REFUNDED: "Kısmi iade",
  DISPUTED: "Anlaşmazlık",
};

/** Flat shipping options used until carrier integration (Phase 8). */
export function estimateShopShipping(
  items: { shippingType: string; shippingPrice: number | null; quantity: number }[]
): { amount: number; label: string; eta: string } {
  if (!items.length) {
    return { amount: 0, label: "Kargo yok", eta: "—" };
  }
  if (items.every((i) => i.shippingType === "FREE")) {
    return { amount: 0, label: "Ücretsiz kargo", eta: "2–5 iş günü" };
  }
  if (items.every((i) => i.shippingType === "PICKUP")) {
    return { amount: 0, label: "Mağazadan teslim", eta: "Aynı gün" };
  }
  if (items.some((i) => i.shippingType === "QUOTE_REQUIRED")) {
    return { amount: 0, label: "Nakliye teklifi gerekli", eta: "—" };
  }

  const sellerDefined = items
    .filter((i) => i.shippingType === "SELLER_DEFINED")
    .map((i) => Number(i.shippingPrice ?? 0));
  if (sellerDefined.length === items.length) {
    const amount = Math.max(...sellerDefined, 0);
    return {
      amount,
      label: "Satıcı tanımlı kargo",
      eta: "2–5 iş günü",
    };
  }

  return { amount: 49.9, label: "Standart kargo", eta: "2–5 iş günü" };
}

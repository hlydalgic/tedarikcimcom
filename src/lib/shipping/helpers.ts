import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  geliverCreateSenderAddress,
  isGeliverEnabled,
} from "@/lib/shipping/geliver";
import type { ShippingAddress } from "@/lib/shipping/types";

type ShopRow = {
  id: string;
  name: string;
  company_name: string | null;
  geliver_sender_address_id: string | null;
};

function defaultSenderFromEnv(shopName: string) {
  return {
    name: process.env.GELIVER_SENDER_NAME?.trim() || shopName,
    email: process.env.GELIVER_SENDER_EMAIL?.trim() || "shipping@marketplace.local",
    phone: process.env.GELIVER_SENDER_PHONE?.trim() || "+905000000000",
    address1: process.env.GELIVER_SENDER_ADDRESS?.trim() || "Merkez Mah.",
    cityName: process.env.GELIVER_SENDER_CITY?.trim() || "İstanbul",
    cityCode: process.env.GELIVER_SENDER_CITY_CODE?.trim() || "34",
    districtName: process.env.GELIVER_SENDER_DISTRICT?.trim() || "Kadıköy",
    zip: process.env.GELIVER_SENDER_ZIP?.trim() || "34000",
  };
}

export async function ensureShopGeliverSenderAddress(
  shop: ShopRow
): Promise<string> {
  if (shop.geliver_sender_address_id) {
    return shop.geliver_sender_address_id;
  }
  if (!isGeliverEnabled()) {
    throw new Error("Geliver entegrasyonu kapalı.");
  }

  const sender = defaultSenderFromEnv(shop.company_name || shop.name);
  const created = await geliverCreateSenderAddress({
    ...sender,
    shortName: shop.name.slice(0, 40),
  });

  const addressId = String((created as { id?: string }).id ?? "");
  if (!addressId) {
    throw new Error("Geliver gönderici adresi oluşturulamadı.");
  }

  const admin = getSupabaseAdmin();
  await admin
    .from("shops")
    .update({ geliver_sender_address_id: addressId })
    .eq("id", shop.id);

  return addressId;
}

export function mapOrderAddressToShipping(
  addr: Record<string, unknown>,
  fallbackEmail?: string
): ShippingAddress {
  return {
    name: String(addr.full_name ?? addr.name ?? "Alıcı"),
    email: fallbackEmail,
    phone: String(addr.phone ?? "+905000000000"),
    address1: String(addr.address_line ?? addr.address1 ?? ""),
    cityName: String(addr.city ?? addr.cityName ?? ""),
    districtName: String(addr.district ?? addr.districtName ?? ""),
    countryCode: "TR",
    zip: addr.postal_code ? String(addr.postal_code) : undefined,
  };
}

export const DEFAULT_PARCEL = {
  length: 30,
  width: 20,
  height: 10,
  weight: 1,
  distanceUnit: "cm" as const,
  massUnit: "kg" as const,
};

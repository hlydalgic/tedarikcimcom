import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/cart/types";
import type { AddressRow } from "@/lib/orders/types";

export async function syncCartItemsFromDb(
  productIds: string[]
): Promise<CartItem[]> {
  if (!productIds.length) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, title, slug, price, currency, stock, shipping_type, shipping_price,
       seller_id, shop_id, brand_id, status, archived_at,
       brands(name),
       shops(id, name, slug),
       product_images(url, is_primary, sort_order)`
    )
    .in("id", productIds)
    .eq("status", "ACTIVE")
    .is("archived_at", null);

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => {
    const shop = Array.isArray(p.shops) ? p.shops[0] : p.shops;
    const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands;
    const images = (p.product_images as { url: string; is_primary: boolean; sort_order: number }[]) ?? [];
    const primary =
      images.find((i) => i.is_primary) ??
      [...images].sort((a, b) => a.sort_order - b.sort_order)[0];

    return {
      productId: p.id,
      slug: p.slug,
      title: p.title,
      imageUrl: primary?.url ?? null,
      unitPrice: Number(p.price),
      currency: p.currency ?? "TRY",
      quantity: 1,
      stock: p.stock,
      shopId: p.shop_id,
      shopName: shop?.name ?? "Mağaza",
      shopSlug: shop?.slug ?? "",
      sellerId: p.seller_id,
      brandName: brand?.name ?? null,
      shippingType: p.shipping_type,
      shippingPrice: p.shipping_price != null ? Number(p.shipping_price) : null,
    } satisfies CartItem;
  });
}

export async function listUserAddresses(): Promise<AddressRow[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("addresses")
    .select(
      `id, user_id, title, full_name, phone, city, district, address_line,
       postal_code, is_default_shipping, is_default_billing`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as AddressRow[];
}

import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CatalogProductListItem } from "@/lib/catalog/types";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function listUserFavorites(): Promise<CatalogProductListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("favourites")
    .select(
      `created_at,
       products!inner(
         id, title, slug, price, compare_at_price, currency, stock, shipping_type,
         brand_id, shop_id, published_at,
         brands(name, slug),
         shops(name, slug, rating_avg),
         product_images(url, is_primary, sort_order)
       )`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const p = row.products as unknown as {
      id: string;
      title: string;
      slug: string;
      price: number;
      compare_at_price: number | null;
      currency: string;
      stock: number;
      shipping_type: CatalogProductListItem["shipping_type"];
      brand_id: string | null;
      shop_id: string;
      published_at: string | null;
      brands: { name: string; slug: string } | { name: string; slug: string }[] | null;
      shops:
        | { name: string; slug: string; rating_avg: number | null }
        | { name: string; slug: string; rating_avg: number | null }[];
      product_images: { url: string; is_primary: boolean; sort_order: number }[];
    };

    const brand = unwrapRelation(p.brands);
    const shop = unwrapRelation(p.shops);
    const images = p.product_images ?? [];
    const primary =
      images.find((i) => i.is_primary) ??
      [...images].sort((a, b) => a.sort_order - b.sort_order)[0];

    return {
      id: String(p.id),
      title: String(p.title),
      slug: String(p.slug),
      price: Number(p.price),
      compare_at_price:
        p.compare_at_price != null ? Number(p.compare_at_price) : null,
      currency: String(p.currency ?? "TRY"),
      stock: Number(p.stock ?? 0),
      shipping_type: p.shipping_type,
      brand_id: p.brand_id ?? null,
      brand_name: brand?.name ?? null,
      brand_slug: brand?.slug ?? null,
      shop_id: String(p.shop_id),
      shop_name: shop?.name ?? "",
      shop_slug: shop?.slug ?? "",
      shop_rating_avg: shop?.rating_avg ?? null,
      primary_image_url: primary?.url ?? null,
      published_at: p.published_at ?? null,
    };
  });
}

export async function isProductFavorited(productId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("favourites")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  return Boolean(data);
}

export async function listUserFavoriteIds(): Promise<Set<string>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("favourites")
    .select("product_id")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((r) => r.product_id as string));
}

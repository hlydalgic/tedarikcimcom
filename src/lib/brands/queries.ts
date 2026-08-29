import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { BrandRow, BrandWithStats } from "@/lib/brands/types";

export async function listBrandsWithStats(): Promise<BrandWithStats[]> {
  const admin = getSupabaseAdmin();
  const { data: brands, error } = await admin
    .from("brands")
    .select(
      "id, name, slug, logo_url, status, created_at, updated_at, archived_at"
    )
    .is("archived_at", null)
    .neq("status", "archived")
    .order("name");

  if (error) throw new Error(error.message);

  const list = (brands ?? []) as BrandRow[];
  if (!list.length) return [];

  const ids = list.map((b) => b.id);

  const [{ data: bc }, { data: products }] = await Promise.all([
    admin.from("brand_categories").select("brand_id, category_id").in("brand_id", ids),
    admin
      .from("products")
      .select("brand_id")
      .in("brand_id", ids)
      .is("archived_at", null),
  ]);

  const catMap = new Map<string, string[]>();
  for (const row of bc ?? []) {
    const bid = row.brand_id as string;
    const arr = catMap.get(bid) ?? [];
    arr.push(row.category_id as string);
    catMap.set(bid, arr);
  }

  const prodCount = new Map<string, number>();
  for (const row of products ?? []) {
    const bid = row.brand_id as string;
    if (!bid) continue;
    prodCount.set(bid, (prodCount.get(bid) ?? 0) + 1);
  }

  return list.map((b) => {
    const category_ids = catMap.get(b.id) ?? [];
    return {
      ...b,
      category_ids,
      category_count: category_ids.length,
      product_count: prodCount.get(b.id) ?? 0,
    };
  });
}

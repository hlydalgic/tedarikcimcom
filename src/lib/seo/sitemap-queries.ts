import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { buildCategoryHref } from "@/lib/catalog/queries";

type CategoryRow = { id: string; parent_id: string | null; slug: string };

function buildAllCategoryPaths(categories: CategoryRow[]): string[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const paths: string[] = [];

  for (const cat of categories) {
    const slugs: string[] = [];
    let current: CategoryRow | undefined = cat;
    while (current) {
      slugs.unshift(current.slug);
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    paths.push(buildCategoryHref(slugs.map((slug) => ({ slug }))));
  }

  return paths;
}

export async function listSitemapEntries(): Promise<
  { path: string; updatedAt?: string }[]
> {
  const supabase = createPublicClient();
  if (!supabase) return [{ path: "/" }];

  const [categoriesRes, productsRes, shopsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, parent_id, slug, updated_at")
      .eq("status", "active")
      .is("archived_at", null),
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "ACTIVE")
      .is("archived_at", null),
    supabase
      .from("shops")
      .select("slug, updated_at")
      .eq("status", "active")
      .is("archived_at", null),
  ]);

  const entries: { path: string; updatedAt?: string }[] = [
    { path: "/" },
    { path: "/kategoriler" },
  ];

  const categories = (categoriesRes.data ?? []) as (CategoryRow & {
    updated_at?: string;
  })[];
  for (const path of buildAllCategoryPaths(categories)) {
    entries.push({ path });
  }

  for (const p of productsRes.data ?? []) {
    entries.push({
      path: `/urunler/${p.slug}`,
      updatedAt: p.updated_at ?? undefined,
    });
  }

  for (const s of shopsRes.data ?? []) {
    entries.push({
      path: `/magaza/${s.slug}`,
      updatedAt: s.updated_at ?? undefined,
    });
  }

  return entries;
}

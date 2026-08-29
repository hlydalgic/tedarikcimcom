import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildCategoryTree,
  type CategoryRow,
  type CategoryTreeNode,
} from "@/lib/categories/types";

const CATEGORY_SELECT = `
  id, parent_id, path, depth, name, slug, description, image_url, icon,
  status, sort_order, seo_title, seo_description, show_on_homepage,
  show_in_nav, commission_rate, created_at, updated_at, archived_at
`;

export async function listCategories(options?: {
  includeArchived?: boolean;
}): Promise<CategoryRow[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from("categories")
    .select(CATEGORY_SELECT)
    .order("sort_order", { ascending: true });

  if (!options?.includeArchived) {
    query = query.is("archived_at", null).neq("status", "archived");
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryRow[];
}

export async function getCategoryTree(options?: {
  includeArchived?: boolean;
}): Promise<CategoryTreeNode[]> {
  const rows = await listCategories(options);
  return buildCategoryTree(rows);
}

export async function getCategoryById(
  id: string
): Promise<CategoryRow | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as CategoryRow | null) ?? null;
}

export async function countActiveProductsInCategory(
  categoryId: string
): Promise<number> {
  const admin = getSupabaseAdmin();
  const { count, error } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .is("archived_at", null)
    .neq("status", "ARCHIVED");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

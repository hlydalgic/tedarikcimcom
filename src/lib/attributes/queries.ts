import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  AttributeOptionRow,
  AttributeRow,
  CategoryAttributeRow,
  CategoryFilterRow,
  UnitRow,
} from "@/lib/attributes/types";

export async function listUnits(): Promise<UnitRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("units")
    .select("id, name, symbol, category")
    .order("category")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as UnitRow[];
}

export async function listAttributes(): Promise<AttributeRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("attributes")
    .select(
      `id, name, slug, type, unit_id, required, filterable, searchable, comparable,
       is_variant_attribute, show_on_card, show_on_detail, show_in_specs,
       show_in_seller_form, sort_order, placeholder, help_text, default_value,
       validation_rules, status`
    )
    .neq("status", "archived")
    .is("archived_at", null)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as AttributeRow[];
}

export async function listAttributeOptions(): Promise<AttributeOptionRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("attribute_options")
    .select("id, attribute_id, label, value, sort_order, color_hex, status")
    .eq("status", "active")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as AttributeOptionRow[];
}

export async function listCategoryAttributes(): Promise<CategoryAttributeRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("category_attributes")
    .select(
      `id, category_id, attribute_id, inherited, inherited_from_category_id,
       override_required, override_sort_order, override_filterable,
       override_show_in_seller_form, is_active, filter_display_type`
    )
    .order("override_sort_order", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryAttributeRow[];
}

export async function listCategoryFilters(): Promise<CategoryFilterRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("category_filters")
    .select(
      `id, category_id, attribute_id, system_filter_key, display_type,
       sort_order, is_enabled, default_collapsed, label_override`
    )
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryFilterRow[];
}

import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { AttributeType } from "@/lib/attributes/types";
import type {
  ProductCondition,
  ShippingType,
} from "@/lib/categories/types";

export type SellerFormOption = {
  id: string;
  label: string;
  value: string;
  color_hex: string | null;
};

export type SellerFormField = {
  attributeId: string;
  name: string;
  slug: string;
  type: AttributeType;
  required: boolean;
  helpText: string | null;
  placeholder: string | null;
  unit: { id: string; name: string; symbol: string } | null;
  options: SellerFormOption[];
  validationRules: Record<string, unknown>;
  sortOrder: number;
  inherited: boolean;
  /** Parent / source category name for inherited fields; null = local */
  groupLabel: string | null;
};

export type SellerFormRules = {
  requiredImageCount: number;
  brandRequired: boolean;
  skuRequired: boolean;
  barcodeRequired: boolean;
  conditionAllowed: ProductCondition[];
  allowedShippingTypes: ShippingType[];
  minDescriptionLength: number;
  productApprovalRequired: boolean;
  maxImages: number;
};

export type SellerFormBrand = {
  id: string;
  name: string;
  slug: string;
};

export type SellerFormSchema = {
  categoryId: string;
  categoryName: string;
  rules: SellerFormRules;
  fields: SellerFormField[];
  brands: SellerFormBrand[];
};

type RpcAttrRow = {
  attribute_id: string;
  category_attribute_id: string;
  inherited: boolean;
  inherited_from_category_id: string | null;
  effective_required: boolean;
  effective_sort_order: number;
  effective_filterable: boolean;
  effective_show_in_seller_form: boolean;
  is_active: boolean;
  filter_display_type: string | null;
  depth_distance: number;
};

/**
 * Build the seller product form schema for a category from DB definitions only.
 * No category-name branching — new categories work without code changes.
 */
export async function getSellerFormSchema(
  categoryId: string
): Promise<SellerFormSchema> {
  const admin = getSupabaseAdmin();

  const { data: category, error: catError } = await admin
    .from("categories")
    .select(
      `id, name, path, required_image_count, brand_required, sku_required,
       barcode_required, condition_allowed, allowed_shipping_types,
       product_approval_required, min_description_length, status, archived_at`
    )
    .eq("id", categoryId)
    .maybeSingle();

  if (catError || !category || category.archived_at) {
    throw new Error("Kategori bulunamadı.");
  }

  const { data: rpcRows, error: rpcError } = await admin.rpc(
    "get_category_attributes",
    { p_category_id: categoryId }
  );

  if (rpcError) throw new Error(rpcError.message);

  const resolved = ((rpcRows ?? []) as RpcAttrRow[]).filter(
    (r) => r.is_active && r.effective_show_in_seller_form
  );

  const attrIds = resolved.map((r) => r.attribute_id);
  const sourceCatIds = Array.from(
    new Set(
      resolved
        .map((r) => r.inherited_from_category_id)
        .filter(Boolean) as string[]
    )
  );

  const [{ data: attrs }, { data: options }, { data: units }, { data: sourceCats }] =
    await Promise.all([
      attrIds.length
        ? admin
            .from("attributes")
            .select(
              `id, name, slug, type, unit_id, required, placeholder, help_text,
               validation_rules, sort_order, status`
            )
            .in("id", attrIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      attrIds.length
        ? admin
            .from("attribute_options")
            .select("id, attribute_id, label, value, color_hex, sort_order, status")
            .in("attribute_id", attrIds)
            .eq("status", "active")
            .order("sort_order")
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      admin.from("units").select("id, name, symbol"),
      sourceCatIds.length
        ? admin.from("categories").select("id, name").in("id", sourceCatIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);

  const attrById = new Map(
    ((attrs ?? []) as Array<Record<string, unknown>>).map((a) => [
      String(a.id),
      a,
    ])
  );
  const unitById = new Map(
    ((units ?? []) as Array<{ id: string; name: string; symbol: string }>).map(
      (u) => [u.id, u]
    )
  );
  const catNameById = new Map(
    ((sourceCats ?? []) as Array<{ id: string; name: string }>).map((c) => [
      c.id,
      c.name,
    ])
  );

  const optionsByAttr = new Map<string, SellerFormOption[]>();
  for (const opt of (options ?? []) as Array<{
    id: string;
    attribute_id: string;
    label: string;
    value: string;
    color_hex: string | null;
  }>) {
    const list = optionsByAttr.get(opt.attribute_id) ?? [];
    list.push({
      id: opt.id,
      label: opt.label,
      value: opt.value,
      color_hex: opt.color_hex,
    });
    optionsByAttr.set(opt.attribute_id, list);
  }

  const fields: SellerFormField[] = [];
  for (const row of resolved) {
    const attr = attrById.get(row.attribute_id);
    if (!attr) continue;

    const unitId = attr.unit_id as string | null;
    const inherited = row.depth_distance > 0 || row.inherited;
    const groupLabel =
      inherited && row.inherited_from_category_id
        ? catNameById.get(row.inherited_from_category_id) ?? "Üst kategori"
        : inherited
          ? "Üst kategori"
          : null;

    fields.push({
      attributeId: row.attribute_id,
      name: String(attr.name),
      slug: String(attr.slug),
      type: attr.type as AttributeType,
      required: row.effective_required,
      helpText: (attr.help_text as string | null) ?? null,
      placeholder: (attr.placeholder as string | null) ?? null,
      unit: unitId ? unitById.get(unitId) ?? null : null,
      options: optionsByAttr.get(row.attribute_id) ?? [],
      validationRules:
        (attr.validation_rules as Record<string, unknown>) ?? {},
      sortOrder: row.effective_sort_order ?? 0,
      inherited,
      groupLabel,
    });
  }

  fields.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr"));

  // Brands linked to this category or any ancestor (path prefix)
  const { data: ancestorCats } = await admin
    .from("categories")
    .select("id, path")
    .eq("status", "active")
    .is("archived_at", null);

  const catPath = String(category.path);
  const relevantCatIds = ((ancestorCats ?? []) as Array<{ id: string; path: string }>)
    .filter(
      (c) =>
        c.id === categoryId ||
        catPath === c.path ||
        catPath.startsWith(`${c.path}.`) ||
        c.path.startsWith(`${catPath}.`)
    )
    // Prefer category + ancestors only (not siblings/descendants of other branches)
    .filter(
      (c) =>
        c.id === categoryId ||
        catPath === c.path ||
        catPath.startsWith(`${c.path}.`)
    )
    .map((c) => c.id);

  const { data: brandLinks } = relevantCatIds.length
    ? await admin
        .from("brand_categories")
        .select("brand_id")
        .in("category_id", relevantCatIds)
    : { data: [] as { brand_id: string }[] };

  const brandIds = Array.from(
    new Set((brandLinks ?? []).map((b) => b.brand_id as string))
  );

  const { data: brands } = brandIds.length
    ? await admin
        .from("brands")
        .select("id, name, slug")
        .in("id", brandIds)
        .eq("status", "active")
        .is("archived_at", null)
        .order("name")
    : { data: [] as SellerFormBrand[] };

  return {
    categoryId: category.id,
    categoryName: category.name,
    rules: {
      requiredImageCount: category.required_image_count ?? 1,
      brandRequired: category.brand_required ?? false,
      skuRequired: category.sku_required ?? false,
      barcodeRequired: category.barcode_required ?? false,
      conditionAllowed: (category.condition_allowed ?? [
        "new",
        "refurbished",
        "used",
      ]) as ProductCondition[],
      allowedShippingTypes: (category.allowed_shipping_types ?? [
        "STANDARD",
        "FREE",
        "SELLER_DEFINED",
        "QUOTE_REQUIRED",
        "PICKUP",
      ]) as ShippingType[],
      minDescriptionLength: category.min_description_length ?? 0,
      productApprovalRequired: category.product_approval_required ?? false,
      maxImages: 8,
    },
    fields,
    brands: (brands ?? []) as SellerFormBrand[],
  };
}

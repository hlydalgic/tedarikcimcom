"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import { writeAdminLog } from "@/lib/admin/log";
import {
  ATTRIBUTE_TYPES,
  FILTER_DISPLAY_TYPES,
  slugifyAttributeName,
  type AttributeType,
  type FilterDisplayType,
  type SystemFilterKey,
} from "@/lib/attributes/types";

export type AttrActionState = {
  success?: boolean;
  error?: string;
  attributeId?: string;
};

function revalidate() {
  revalidatePath("/admin/kategoriler");
  revalidatePath("/admin/ozellikler");
}

const optionSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  color_hex: z.string().trim().optional().nullable(),
});

export async function createAttributeAndAssign(input: {
  categoryId: string;
  name: string;
  slug?: string;
  type: AttributeType;
  unitId?: string | null;
  required?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  comparable?: boolean;
  isVariantAttribute?: boolean;
  showOnCard?: boolean;
  showOnDetail?: boolean;
  showInSpecs?: boolean;
  showInSellerForm?: boolean;
  sortOrder?: number;
  placeholder?: string | null;
  helpText?: string | null;
  validationRules?: Record<string, unknown>;
  options?: { label: string; value: string; color_hex?: string | null }[];
  trueLabel?: string;
  falseLabel?: string;
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  if (!ATTRIBUTE_TYPES.includes(input.type)) {
    return { error: "Geçersiz attribute tipi." };
  }

  const name = input.name.trim();
  if (name.length < 2) return { error: "Attribute adı en az 2 karakter olmalı." };

  const slug = (input.slug?.trim() || slugifyAttributeName(name)).slice(0, 80);
  const validation_rules: Record<string, unknown> = {
    ...(input.validationRules ?? {}),
  };
  if (input.type === "BOOLEAN") {
    if (input.trueLabel) validation_rules.true_label = input.trueLabel;
    if (input.falseLabel) validation_rules.false_label = input.falseLabel;
  }

  const { data: attr, error: attrError } = await ctx.admin
    .from("attributes")
    .insert({
      name,
      slug,
      type: input.type,
      unit_id: input.unitId || null,
      required: input.required ?? false,
      filterable: input.filterable ?? false,
      searchable: input.searchable ?? false,
      comparable: input.comparable ?? false,
      is_variant_attribute: input.isVariantAttribute ?? false,
      show_on_card: input.showOnCard ?? false,
      show_on_detail: input.showOnDetail ?? true,
      show_in_specs: input.showInSpecs ?? true,
      show_in_seller_form: input.showInSellerForm ?? true,
      sort_order: input.sortOrder ?? 0,
      placeholder: input.placeholder ?? null,
      help_text: input.helpText ?? null,
      validation_rules,
      status: "active",
    })
    .select("*")
    .single();

  if (attrError) {
    if (attrError.message.includes("attributes_slug")) {
      return { error: "Bu slug zaten kullanılıyor." };
    }
    return { error: attrError.message };
  }

  if (
    (input.type === "SELECT" ||
      input.type === "MULTI_SELECT" ||
      input.type === "COLOR") &&
    input.options?.length
  ) {
    const rows = input.options.flatMap((o, i) => {
      const parsed = optionSchema.safeParse(o);
      if (!parsed.success) return [];
      return [
        {
          attribute_id: attr.id,
          label: parsed.data.label,
          value: parsed.data.value,
          color_hex: parsed.data.color_hex || null,
          sort_order: i,
          status: "active" as const,
        },
      ];
    });

    if (rows.length) {
      const { error: optError } = await ctx.admin
        .from("attribute_options")
        .insert(rows);
      if (optError) return { error: optError.message };
    }
  }

  const { data: assignment, error: assignError } = await ctx.admin
    .from("category_attributes")
    .insert({
      category_id: input.categoryId,
      attribute_id: attr.id,
      inherited: false,
      is_active: true,
      override_sort_order: input.sortOrder ?? attr.sort_order,
    })
    .select("*")
    .single();

  if (assignError) return { error: assignError.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "attribute.create",
    entityType: "attribute",
    entityId: attr.id,
    newData: attr as Record<string, unknown>,
    metadata: { category_id: input.categoryId, assignment_id: assignment.id },
  });

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "attribute.assign",
    entityType: "category_attribute",
    entityId: assignment.id,
    newData: assignment as Record<string, unknown>,
  });

  revalidate();
  return { success: true, attributeId: attr.id };
}

export async function assignExistingAttribute(input: {
  categoryId: string;
  attributeId: string;
  sortOrder?: number;
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data, error } = await ctx.admin
    .from("category_attributes")
    .upsert(
      {
        category_id: input.categoryId,
        attribute_id: input.attributeId,
        inherited: false,
        inherited_from_category_id: null,
        is_active: true,
        override_sort_order: input.sortOrder ?? null,
      },
      { onConflict: "category_id,attribute_id" }
    )
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "attribute.assign",
    entityType: "category_attribute",
    entityId: data.id,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, attributeId: input.attributeId };
}

export async function updateCategoryAttribute(input: {
  id: string;
  isActive?: boolean;
  overrideSortOrder?: number | null;
  overrideRequired?: boolean | null;
  overrideFilterable?: boolean | null;
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("category_attributes")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (!oldRow) return { error: "Kayıt bulunamadı." };

  const patch: Record<string, unknown> = {};
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.overrideSortOrder !== undefined) {
    patch.override_sort_order = input.overrideSortOrder;
  }
  if (input.overrideRequired !== undefined) {
    patch.override_required = input.overrideRequired;
  }
  if (input.overrideFilterable !== undefined) {
    patch.override_filterable = input.overrideFilterable;
  }

  const { data, error } = await ctx.admin
    .from("category_attributes")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  const action =
    input.isActive === false
      ? "attribute.deactivate"
      : "attribute.assign";

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action,
    entityType: "category_attribute",
    entityId: input.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true };
}

export async function updateAttributeDefinition(input: {
  attributeId: string;
  name?: string;
  required?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  comparable?: boolean;
  isVariantAttribute?: boolean;
  showOnCard?: boolean;
  showOnDetail?: boolean;
  showInSpecs?: boolean;
  showInSellerForm?: boolean;
  sortOrder?: number;
  placeholder?: string | null;
  helpText?: string | null;
  unitId?: string | null;
  validationRules?: Record<string, unknown>;
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("attributes")
    .select("*")
    .eq("id", input.attributeId)
    .maybeSingle();

  if (!oldRow) return { error: "Attribute bulunamadı." };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.required !== undefined) patch.required = input.required;
  if (input.filterable !== undefined) patch.filterable = input.filterable;
  if (input.searchable !== undefined) patch.searchable = input.searchable;
  if (input.comparable !== undefined) patch.comparable = input.comparable;
  if (input.isVariantAttribute !== undefined) {
    patch.is_variant_attribute = input.isVariantAttribute;
  }
  if (input.showOnCard !== undefined) patch.show_on_card = input.showOnCard;
  if (input.showOnDetail !== undefined) {
    patch.show_on_detail = input.showOnDetail;
  }
  if (input.showInSpecs !== undefined) patch.show_in_specs = input.showInSpecs;
  if (input.showInSellerForm !== undefined) {
    patch.show_in_seller_form = input.showInSellerForm;
  }
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.placeholder !== undefined) patch.placeholder = input.placeholder;
  if (input.helpText !== undefined) patch.help_text = input.helpText;
  if (input.unitId !== undefined) patch.unit_id = input.unitId;
  if (input.validationRules !== undefined) {
    patch.validation_rules = input.validationRules;
  }

  const { data, error } = await ctx.admin
    .from("attributes")
    .update(patch)
    .eq("id", input.attributeId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "attribute.update",
    entityType: "attribute",
    entityId: input.attributeId,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, attributeId: input.attributeId };
}

export async function removeCategoryAttribute(
  categoryAttributeId: string
): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("category_attributes")
    .select("*")
    .eq("id", categoryAttributeId)
    .maybeSingle();

  if (!oldRow) return { error: "Kayıt bulunamadı." };

  const { error } = await ctx.admin
    .from("category_attributes")
    .delete()
    .eq("id", categoryAttributeId);

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "attribute.deactivate",
    entityType: "category_attribute",
    entityId: categoryAttributeId,
    oldData: oldRow as Record<string, unknown>,
    metadata: { removed: true },
  });

  revalidate();
  return { success: true };
}

export async function reorderCategoryAttribute(input: {
  id: string;
  direction: "up" | "down";
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: current } = await ctx.admin
    .from("category_attributes")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (!current) return { error: "Kayıt bulunamadı." };

  const { data: siblings } = await ctx.admin
    .from("category_attributes")
    .select("id, override_sort_order, attribute_id")
    .eq("category_id", current.category_id)
    .order("override_sort_order", { ascending: true, nullsFirst: false });

  const list = siblings ?? [];
  const index = list.findIndex((s) => s.id === input.id);
  const swapIndex = input.direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= list.length) {
    return { success: true };
  }

  const orders = list.map((s, i) => s.override_sort_order ?? i * 10);
  const a = list[index]!;
  const b = list[swapIndex]!;
  const aOrder = orders[index]!;
  const bOrder = orders[swapIndex]!;

  await ctx.admin
    .from("category_attributes")
    .update({ override_sort_order: bOrder })
    .eq("id", a.id);
  await ctx.admin
    .from("category_attributes")
    .update({ override_sort_order: aOrder })
    .eq("id", b.id);

  revalidate();
  return { success: true };
}

export async function propagateAttribute(input: {
  categoryId: string;
  attributeId: string;
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: sourceCat } = await ctx.admin
    .from("categories")
    .select("id, path")
    .eq("id", input.categoryId)
    .maybeSingle();

  if (!sourceCat) return { error: "Kategori bulunamadı." };

  const { data: allCats, error: catsError } = await ctx.admin
    .from("categories")
    .select("id, path")
    .is("archived_at", null);

  if (catsError) return { error: catsError.message };

  const childIds = (allCats ?? [])
    .filter(
      (c) =>
        c.id !== input.categoryId &&
        typeof c.path === "string" &&
        c.path.startsWith(`${sourceCat.path}.`)
    )
    .map((c) => c.id);

  if (!childIds.length) {
    return { error: "Alt kategori bulunamadı." };
  }

  const rows = childIds.map((category_id) => ({
    category_id,
    attribute_id: input.attributeId,
    inherited: true,
    inherited_from_category_id: input.categoryId,
    is_active: true,
  }));

  // Upsert: only overwrite inherited rows
  for (const row of rows) {
    const { data: existing } = await ctx.admin
      .from("category_attributes")
      .select("id, inherited")
      .eq("category_id", row.category_id)
      .eq("attribute_id", row.attribute_id)
      .maybeSingle();

    if (existing && existing.inherited === false) continue;

    if (existing) {
      await ctx.admin
        .from("category_attributes")
        .update({
          inherited: true,
          inherited_from_category_id: input.categoryId,
          is_active: true,
        })
        .eq("id", existing.id);
    } else {
      await ctx.admin.from("category_attributes").insert(row);
    }
  }

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "attribute.propagate",
    entityType: "attribute",
    entityId: input.attributeId,
    metadata: {
      source_category_id: input.categoryId,
      descendant_count: childIds.length,
    },
  });

  revalidate();
  return { success: true, attributeId: input.attributeId };
}

export async function addCategoryFilter(input: {
  categoryId: string;
  attributeId?: string | null;
  systemFilterKey?: SystemFilterKey | null;
  displayType: FilterDisplayType;
  labelOverride?: string | null;
  defaultCollapsed?: boolean;
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  if (!FILTER_DISPLAY_TYPES.includes(input.displayType)) {
    return { error: "Geçersiz display type." };
  }

  const hasAttr = Boolean(input.attributeId);
  const hasSystem = Boolean(input.systemFilterKey);
  if (hasAttr === hasSystem) {
    return { error: "Attribute veya system filter'dan yalnızca biri seçilmeli." };
  }

  const { data: existing } = await ctx.admin
    .from("category_filters")
    .select("sort_order")
    .eq("category_id", input.categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 10;

  const { data, error } = await ctx.admin
    .from("category_filters")
    .insert({
      category_id: input.categoryId,
      attribute_id: input.attributeId ?? null,
      system_filter_key: input.systemFilterKey ?? null,
      display_type: input.displayType,
      sort_order: nextOrder,
      is_enabled: true,
      default_collapsed: input.defaultCollapsed ?? false,
      label_override: input.labelOverride || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("category_filters")) {
      return { error: "Bu filtre zaten ekli." };
    }
    return { error: error.message };
  }

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "filter.add",
    entityType: "category_filter",
    entityId: data.id,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true };
}

export async function updateCategoryFilter(input: {
  id: string;
  isEnabled?: boolean;
  defaultCollapsed?: boolean;
  displayType?: FilterDisplayType;
  labelOverride?: string | null;
  sortOrder?: number;
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("category_filters")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (!oldRow) return { error: "Filtre bulunamadı." };

  const patch: Record<string, unknown> = {};
  if (input.isEnabled !== undefined) patch.is_enabled = input.isEnabled;
  if (input.defaultCollapsed !== undefined) {
    patch.default_collapsed = input.defaultCollapsed;
  }
  if (input.displayType !== undefined) patch.display_type = input.displayType;
  if (input.labelOverride !== undefined) {
    patch.label_override = input.labelOverride;
  }
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await ctx.admin
    .from("category_filters")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "filter.update",
    entityType: "category_filter",
    entityId: input.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true };
}

export async function removeCategoryFilter(
  filterId: string
): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("category_filters")
    .select("*")
    .eq("id", filterId)
    .maybeSingle();

  const { error } = await ctx.admin
    .from("category_filters")
    .delete()
    .eq("id", filterId);

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "filter.update",
    entityType: "category_filter",
    entityId: filterId,
    oldData: oldRow as Record<string, unknown> | null,
    metadata: { removed: true },
  });

  revalidate();
  return { success: true };
}

export async function reorderCategoryFilter(input: {
  id: string;
  direction: "up" | "down";
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: current } = await ctx.admin
    .from("category_filters")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (!current) return { error: "Filtre bulunamadı." };

  const { data: siblings } = await ctx.admin
    .from("category_filters")
    .select("id, sort_order")
    .eq("category_id", current.category_id)
    .order("sort_order", { ascending: true });

  const list = siblings ?? [];
  const index = list.findIndex((s) => s.id === input.id);
  const swapIndex = input.direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= list.length) {
    return { success: true };
  }

  const a = list[index]!;
  const b = list[swapIndex]!;

  await ctx.admin
    .from("category_filters")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id);
  await ctx.admin
    .from("category_filters")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id);

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "filter.reorder",
    entityType: "category_filter",
    entityId: input.id,
    metadata: { direction: input.direction, swapped_with: b.id },
  });

  revalidate();
  return { success: true };
}

export async function createGlobalAttribute(input: {
  name: string;
  slug?: string;
  type: AttributeType;
  unitId?: string | null;
  required?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  comparable?: boolean;
  isVariantAttribute?: boolean;
  showOnCard?: boolean;
  showOnDetail?: boolean;
  showInSpecs?: boolean;
  showInSellerForm?: boolean;
  sortOrder?: number;
  placeholder?: string | null;
  helpText?: string | null;
  validationRules?: Record<string, unknown>;
  options?: { label: string; value: string; color_hex?: string | null }[];
  trueLabel?: string;
  falseLabel?: string;
}): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  if (!ATTRIBUTE_TYPES.includes(input.type)) {
    return { error: "Geçersiz attribute tipi." };
  }

  const name = input.name.trim();
  if (name.length < 2) return { error: "Attribute adı en az 2 karakter olmalı." };

  const slug = (input.slug?.trim() || slugifyAttributeName(name)).slice(0, 80);
  const validation_rules: Record<string, unknown> = {
    ...(input.validationRules ?? {}),
  };
  if (input.type === "BOOLEAN") {
    if (input.trueLabel) validation_rules.true_label = input.trueLabel;
    if (input.falseLabel) validation_rules.false_label = input.falseLabel;
  }

  const { data: attr, error: attrError } = await ctx.admin
    .from("attributes")
    .insert({
      name,
      slug,
      type: input.type,
      unit_id: input.unitId || null,
      required: input.required ?? false,
      filterable: input.filterable ?? false,
      searchable: input.searchable ?? false,
      comparable: input.comparable ?? false,
      is_variant_attribute: input.isVariantAttribute ?? false,
      show_on_card: input.showOnCard ?? false,
      show_on_detail: input.showOnDetail ?? true,
      show_in_specs: input.showInSpecs ?? true,
      show_in_seller_form: input.showInSellerForm ?? true,
      sort_order: input.sortOrder ?? 0,
      placeholder: input.placeholder ?? null,
      help_text: input.helpText ?? null,
      validation_rules,
      status: "active",
    })
    .select("*")
    .single();

  if (attrError) {
    if (attrError.message.includes("attributes_slug")) {
      return { error: "Bu slug zaten kullanılıyor." };
    }
    return { error: attrError.message };
  }

  if (
    (input.type === "SELECT" ||
      input.type === "MULTI_SELECT" ||
      input.type === "COLOR") &&
    input.options?.length
  ) {
    const rows = input.options.flatMap((o, i) => {
      const parsed = optionSchema.safeParse(o);
      if (!parsed.success) return [];
      return [
        {
          attribute_id: attr.id,
          label: parsed.data.label,
          value: parsed.data.value,
          color_hex: parsed.data.color_hex || null,
          sort_order: i,
          status: "active" as const,
        },
      ];
    });
    if (rows.length) {
      const { error: optError } = await ctx.admin
        .from("attribute_options")
        .insert(rows);
      if (optError) return { error: optError.message };
    }
  }

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "attribute.create",
    entityType: "attribute",
    entityId: attr.id,
    newData: attr as Record<string, unknown>,
  });

  revalidate();
  return { success: true, attributeId: attr.id };
}

export async function archiveAttribute(
  attributeId: string
): Promise<AttrActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("attributes")
    .select("*")
    .eq("id", attributeId)
    .maybeSingle();

  if (!oldRow) return { error: "Attribute bulunamadı." };

  const { data, error } = await ctx.admin
    .from("attributes")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", attributeId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "attribute.archive",
    entityType: "attribute",
    entityId: attributeId,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, attributeId };
}

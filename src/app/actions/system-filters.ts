"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import { writeAdminLog } from "@/lib/admin/log";
import {
  FILTER_DISPLAY_TYPES,
  slugifyAttributeName,
  type FilterDisplayType,
} from "@/lib/attributes/types";

export type SystemFilterActionState = {
  success?: boolean;
  error?: string;
  id?: string;
};

function revalidate() {
  revalidatePath("/admin/filtreler");
  revalidatePath("/admin/kategoriler");
}

function slugifySystemFilterKey(input: string): string {
  return slugifyAttributeName(input).replace(/-/g, "_");
}

function isValidKey(key: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(key);
}

export async function createSystemFilterDefinition(input: {
  name: string;
  key?: string;
  description?: string | null;
  displayType: FilterDisplayType;
  isActive?: boolean;
}): Promise<SystemFilterActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const name = input.name.trim();
  if (name.length < 2) return { error: "Ad en az 2 karakter olmalı." };

  const key = slugifySystemFilterKey(input.key?.trim() || name);
  if (!isValidKey(key)) {
    return { error: "Geçersiz key. Küçük harf, rakam ve alt çizgi kullanın." };
  }

  if (!FILTER_DISPLAY_TYPES.includes(input.displayType)) {
    return { error: "Geçersiz display type." };
  }

  const { data: maxRow } = await ctx.admin
    .from("category_system_filters")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (maxRow?.[0]?.sort_order ?? 0) + 10;

  const { data, error } = await ctx.admin
    .from("category_system_filters")
    .insert({
      key,
      name,
      description: input.description?.trim() || null,
      display_type: input.displayType,
      sort_order: nextOrder,
      is_active: input.isActive ?? true,
      is_builtin: false,
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("category_system_filters_key_unique")) {
      return { error: "Bu key zaten kullanılıyor." };
    }
    return { error: error.message };
  }

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "system_filter.create",
    entityType: "category_system_filter",
    entityId: data.id,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, id: data.id };
}

export async function updateSystemFilterDefinition(input: {
  id: string;
  name?: string;
  description?: string | null;
  displayType?: FilterDisplayType;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<SystemFilterActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("category_system_filters")
    .select("*")
    .eq("id", input.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!oldRow) return { error: "System filtre bulunamadı." };

  const patch: Record<string, unknown> = {};

  if (oldRow.is_builtin) {
    if (input.displayType === undefined) {
      return { error: "Built-in filtrelerde yalnızca display type düzenlenebilir." };
    }
    if (!FILTER_DISPLAY_TYPES.includes(input.displayType)) {
      return { error: "Geçersiz display type." };
    }
    patch.display_type = input.displayType;
  } else {
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length < 2) return { error: "Ad en az 2 karakter olmalı." };
      patch.name = name;
    }
    if (input.description !== undefined) {
      patch.description = input.description?.trim() || null;
    }
    if (input.displayType !== undefined) {
      if (!FILTER_DISPLAY_TYPES.includes(input.displayType)) {
        return { error: "Geçersiz display type." };
      }
      patch.display_type = input.displayType;
    }
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  }

  if (Object.keys(patch).length === 0) {
    return { error: "Güncellenecek alan yok." };
  }

  const { data, error } = await ctx.admin
    .from("category_system_filters")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "system_filter.update",
    entityType: "category_system_filter",
    entityId: data.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, id: data.id };
}

export async function archiveSystemFilterDefinition(
  id: string
): Promise<SystemFilterActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("category_system_filters")
    .select("*")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (!oldRow) return { error: "System filtre bulunamadı." };

  const { count } = await ctx.admin
    .from("category_filters")
    .select("id", { count: "exact", head: true })
    .eq("system_filter_key", oldRow.key as string);

  if ((count ?? 0) > 0) {
    return {
      error: "Bu filtre kategorilere atanmış. Önce kategori filtrelerinden kaldırın.",
    };
  }

  const { data, error } = await ctx.admin
    .from("category_system_filters")
    .update({
      is_active: false,
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "system_filter.archive",
    entityType: "category_system_filter",
    entityId: data.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, id: data.id };
}

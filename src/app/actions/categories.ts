"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import { writeAdminLog } from "@/lib/admin/log";
import { countActiveProductsInCategory } from "@/lib/categories/queries";
import { slugifyCategoryName } from "@/lib/categories/types";

export type CategoryActionState = {
  success?: boolean;
  error?: string;
  categoryId?: string;
};

const generalSchema = z.object({
  id: z.string().uuid().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2, "Kategori adı en az 2 karakter olmalı."),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir."),
  description: z.string().trim().optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  icon: z.string().trim().optional().nullable(),
  status: z.enum(["active", "inactive", "draft"]),
  sort_order: z.coerce.number().int().min(0).default(0),
  commission_rate: z
    .union([z.coerce.number().min(0).max(100), z.nan(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === "" || v === null || v === undefined || Number.isNaN(v)) return null;
      return Number(v);
    }),
  show_on_homepage: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "on" || v === "true"),
  show_in_nav: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "on" || v === "true"),
  seo_title: z.string().trim().optional().nullable(),
  seo_description: z.string().trim().optional().nullable(),
});

function revalidateCategories(id?: string) {
  revalidatePath("/admin/kategoriler");
  if (id) revalidatePath(`/admin/kategoriler?id=${id}`);
}

function mapDbError(message: string): string {
  if (message.toLowerCase().includes("circular")) {
    return "Döngüsel üst kategori seçilemez.";
  }
  if (message.includes("categories_sibling_slug") || message.includes("categories_root_slug")) {
    return "Bu slug aynı seviyede zaten kullanılıyor.";
  }
  if (message.includes("categories_no_self_parent")) {
    return "Kategori kendi üst kategorisi olamaz.";
  }
  return message;
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const parentRaw = String(formData.get("parent_id") ?? "").trim();
  const name = String(formData.get("name") ?? "");
  const slugInput = String(formData.get("slug") ?? "").trim();

  const parsed = generalSchema.safeParse({
    parent_id: parentRaw ? parentRaw : null,
    name,
    slug: slugInput || slugifyCategoryName(name),
    description: String(formData.get("description") ?? "") || null,
    image_url: String(formData.get("image_url") ?? "") || null,
    icon: String(formData.get("icon") ?? "") || null,
    status: String(formData.get("status") ?? "active"),
    sort_order: formData.get("sort_order") ?? 0,
    commission_rate: formData.get("commission_rate"),
    show_on_homepage: formData.get("show_on_homepage") ?? false,
    show_in_nav: formData.get("show_in_nav") ?? true,
    seo_title: String(formData.get("seo_title") ?? "") || null,
    seo_description: String(formData.get("seo_description") ?? "") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form." };
  }

  const payload = {
    parent_id: parsed.data.parent_id ?? null,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    image_url: parsed.data.image_url || null,
    icon: parsed.data.icon,
    status: parsed.data.status,
    sort_order: parsed.data.sort_order,
    commission_rate: parsed.data.commission_rate,
    show_on_homepage: parsed.data.show_on_homepage ?? false,
    show_in_nav: parsed.data.show_in_nav ?? true,
    seo_title: parsed.data.seo_title,
    seo_description: parsed.data.seo_description,
    // path/depth set by DB trigger — provide placeholder for NOT NULL
    path: "pending",
    depth: 0,
  };

  // Trigger needs real id first — insert with default uuid, path overwritten in BEFORE trigger
  const { data, error } = await ctx.admin
    .from("categories")
    .insert({
      parent_id: payload.parent_id,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      image_url: payload.image_url,
      icon: payload.icon,
      status: payload.status,
      sort_order: payload.sort_order,
      commission_rate: payload.commission_rate,
      show_on_homepage: payload.show_on_homepage,
      show_in_nav: payload.show_in_nav,
      seo_title: payload.seo_title,
      seo_description: payload.seo_description,
      path: "temp",
      depth: 0,
    })
    .select("id, name, slug, parent_id, path, depth, status")
    .single();

  if (error) {
    return { error: mapDbError(error.message) };
  }

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "category.create",
    entityType: "category",
    entityId: data.id,
    newData: data as Record<string, unknown>,
  });

  revalidateCategories(data.id);
  return { success: true, categoryId: data.id };
}

export async function updateCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const id = String(formData.get("id") ?? "");
  const parsed = generalSchema.safeParse({
    id,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: String(formData.get("description") ?? "") || null,
    image_url: String(formData.get("image_url") ?? "") || null,
    icon: String(formData.get("icon") ?? "") || null,
    status: String(formData.get("status") ?? "active"),
    sort_order: formData.get("sort_order") ?? 0,
    commission_rate: formData.get("commission_rate"),
    show_on_homepage: formData.get("show_on_homepage") ?? false,
    show_in_nav: formData.get("show_in_nav") ?? true,
    seo_title: String(formData.get("seo_title") ?? "") || null,
    seo_description: String(formData.get("seo_description") ?? "") || null,
  });

  if (!parsed.success || !parsed.data.id) {
    return { error: parsed.error?.issues[0]?.message ?? "Geçersiz form." };
  }

  const { data: oldRow } = await ctx.admin
    .from("categories")
    .select("*")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!oldRow) return { error: "Kategori bulunamadı." };

  const { data, error } = await ctx.admin
    .from("categories")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      image_url: parsed.data.image_url || null,
      icon: parsed.data.icon,
      status: parsed.data.status,
      sort_order: parsed.data.sort_order,
      commission_rate: parsed.data.commission_rate,
      show_on_homepage: parsed.data.show_on_homepage ?? false,
      show_in_nav: parsed.data.show_in_nav ?? true,
      seo_title: parsed.data.seo_title,
      seo_description: parsed.data.seo_description,
    })
    .eq("id", parsed.data.id)
    .select("*")
    .single();

  if (error) return { error: mapDbError(error.message) };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "category.update",
    entityType: "category",
    entityId: parsed.data.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateCategories(parsed.data.id);
  return { success: true, categoryId: parsed.data.id };
}

export async function moveCategory(input: {
  id: string;
  newParentId: string | null;
}): Promise<CategoryActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("categories")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (!oldRow) return { error: "Kategori bulunamadı." };

  if (input.newParentId === input.id) {
    return { error: "Kategori kendi üst kategorisi olamaz." };
  }

  const { data, error } = await ctx.admin
    .from("categories")
    .update({ parent_id: input.newParentId })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) return { error: mapDbError(error.message) };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "category.move",
    entityType: "category",
    entityId: input.id,
    oldData: { parent_id: oldRow.parent_id, path: oldRow.path },
    newData: { parent_id: data.parent_id, path: data.path },
  });

  revalidateCategories(input.id);
  return { success: true, categoryId: input.id };
}

export async function reorderCategory(input: {
  id: string;
  direction: "up" | "down";
}): Promise<CategoryActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: current } = await ctx.admin
    .from("categories")
    .select("id, parent_id, sort_order, name")
    .eq("id", input.id)
    .maybeSingle();

  if (!current) return { error: "Kategori bulunamadı." };

  let siblingsQuery = ctx.admin
    .from("categories")
    .select("id, sort_order")
    .is("archived_at", null)
    .neq("status", "archived")
    .order("sort_order", { ascending: true });

  siblingsQuery = current.parent_id
    ? siblingsQuery.eq("parent_id", current.parent_id)
    : siblingsQuery.is("parent_id", null);

  const { data: siblings, error: listError } = await siblingsQuery;
  if (listError) return { error: listError.message };

  const list = siblings ?? [];
  const index = list.findIndex((s) => s.id === input.id);
  if (index < 0) return { error: "Kardeş kategoriler bulunamadı." };

  const swapIndex = input.direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) {
    return { success: true, categoryId: input.id };
  }

  const a = list[index]!;
  const b = list[swapIndex]!;

  const { error: e1 } = await ctx.admin
    .from("categories")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id);
  const { error: e2 } = await ctx.admin
    .from("categories")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id);

  if (e1 || e2) return { error: (e1 || e2)!.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "category.update",
    entityType: "category",
    entityId: input.id,
    metadata: { reorder: input.direction, swapped_with: b.id },
  });

  revalidateCategories(input.id);
  return { success: true, categoryId: input.id };
}

export async function archiveCategory(
  categoryId: string
): Promise<CategoryActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const productCount = await countActiveProductsInCategory(categoryId);
  if (productCount > 0) {
    return {
      error: `Bu kategoride ${productCount} aktif ürün var. Önce ürünleri taşıyın veya arşivleyin.`,
    };
  }

  const { data: oldRow } = await ctx.admin
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();

  if (!oldRow) return { error: "Kategori bulunamadı." };

  // Check children that are not archived
  const { count: childCount } = await ctx.admin
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", categoryId)
    .is("archived_at", null)
    .neq("status", "archived");

  if ((childCount ?? 0) > 0) {
    return {
      error: "Alt kategorileri olan bir kategori arşivlenemez. Önce alt kategorileri arşivleyin.",
    };
  }

  const { data, error } = await ctx.admin
    .from("categories")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .select("*")
    .single();

  if (error) return { error: mapDbError(error.message) };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "category.archive",
    entityType: "category",
    entityId: categoryId,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateCategories();
  return { success: true };
}

export async function uploadCategoryImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Dosya seçilmedi." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Dosya 5MB’dan büyük olamaz." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await ctx.admin.storage
    .from("category-images")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) return { error: error.message };

  const { data } = ctx.admin.storage.from("category-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

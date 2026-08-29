"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import { writeAdminLog } from "@/lib/admin/log";
import { slugifyBrandName } from "@/lib/brands/types";

export type BrandActionState = {
  success?: boolean;
  error?: string;
  brandId?: string;
};

function revalidate() {
  revalidatePath("/admin/markalar");
}

export async function createBrand(input: {
  name: string;
  slug?: string;
  logoUrl?: string | null;
  status?: "active" | "inactive";
  categoryIds?: string[];
}): Promise<BrandActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const name = input.name.trim();
  if (name.length < 2) return { error: "Marka adı en az 2 karakter olmalı." };
  const slug = (input.slug?.trim() || slugifyBrandName(name)).slice(0, 80);

  const { data, error } = await ctx.admin
    .from("brands")
    .insert({
      name,
      slug,
      logo_url: input.logoUrl || null,
      status: input.status ?? "active",
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("brands_slug")) {
      return { error: "Bu slug zaten kullanılıyor." };
    }
    return { error: error.message };
  }

  if (input.categoryIds?.length) {
    await ctx.admin.from("brand_categories").insert(
      input.categoryIds.map((category_id) => ({
        brand_id: data.id,
        category_id,
      }))
    );
  }

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "brand.create",
    entityType: "brand",
    entityId: data.id,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, brandId: data.id };
}

export async function updateBrand(input: {
  id: string;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  status?: "active" | "inactive";
  categoryIds?: string[];
}): Promise<BrandActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("brands")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (!oldRow) return { error: "Marka bulunamadı." };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.slug !== undefined) patch.slug = input.slug.trim();
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await ctx.admin
    .from("brands")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  if (input.categoryIds !== undefined) {
    await ctx.admin.from("brand_categories").delete().eq("brand_id", input.id);
    if (input.categoryIds.length) {
      await ctx.admin.from("brand_categories").insert(
        input.categoryIds.map((category_id) => ({
          brand_id: input.id,
          category_id,
        }))
      );
    }
  }

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "brand.update",
    entityType: "brand",
    entityId: input.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, brandId: input.id };
}

export async function uploadBrandLogo(
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

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await ctx.admin.storage.from("brand-logos").upload(path, buffer, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (error) return { error: error.message };

  const { data } = ctx.admin.storage.from("brand-logos").getPublicUrl(path);
  return { url: data.publicUrl };
}

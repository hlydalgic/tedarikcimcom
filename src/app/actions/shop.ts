"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSeller } from "@/lib/auth/require-seller";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ShopActionState = {
  error?: string;
  success?: string;
};

const shopSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  iban: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .refine((v) => v === "" || /^TR\d{24}$/.test(v), "Geçersiz IBAN"),
  tax_number: z.string().trim().optional().nullable(),
  tax_office: z.string().trim().optional().nullable(),
  company_name: z.string().trim().optional().nullable(),
  logo_url: z.string().url().nullable().optional().or(z.literal("")),
  banner_url: z.string().url().nullable().optional().or(z.literal("")),
});

export async function updateShopSettings(
  _prev: ShopActionState,
  formData: FormData
): Promise<ShopActionState> {
  const ctx = await requireSeller("/panel/magaza");
  const parsed = shopSchema.safeParse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? "") || null,
    iban: formData.get("iban") ?? "",
    tax_number: String(formData.get("tax_number") ?? "") || null,
    tax_office: String(formData.get("tax_office") ?? "") || null,
    company_name: String(formData.get("company_name") ?? "") || null,
    logo_url: String(formData.get("logo_url") ?? "") || null,
    banner_url: String(formData.get("banner_url") ?? "") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form." };
  }

  const d = parsed.data;
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("shops")
    .update({
      name: d.name,
      description: d.description,
      iban: d.iban || null,
      tax_number: d.tax_number,
      tax_office: d.tax_office,
      company_name: d.company_name,
      logo_url: d.logo_url || null,
      banner_url: d.banner_url || null,
    })
    .eq("id", ctx.shop.id)
    .eq("owner_id", ctx.userId);

  if (error) return { error: error.message };

  revalidatePath("/panel/magaza");
  revalidatePath("/panel");
  return { success: "Mağaza ayarları kaydedildi." };
}

export async function uploadShopAsset(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const ctx = await requireSeller("/panel/magaza");
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Dosya seçilmedi." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Dosya 5MB’dan büyük olamaz." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${ctx.shop.id}/${kind}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = getSupabaseAdmin();

  const { error } = await admin.storage.from("shop-assets").upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return { error: error.message };

  const { data } = admin.storage.from("shop-assets").getPublicUrl(path);
  return { url: data.publicUrl };
}

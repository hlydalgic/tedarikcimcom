"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import { writeAdminLog } from "@/lib/admin/log";

export type SettingsActionState = {
  success?: boolean;
  error?: string;
};

function revalidateSite() {
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/ayarlar");
  revalidatePath("/sitemap.xml");
}

export async function updateMarketplaceSettings(input: {
  marketplaceName: string;
  shortName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  companyName?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  siteUrl?: string | null;
  socialLinks: Record<string, string>;
}): Promise<SettingsActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const hex = /^#[0-9A-Fa-f]{6}$/;
  if (
    !hex.test(input.primaryColor) ||
    !hex.test(input.secondaryColor) ||
    !hex.test(input.accentColor)
  ) {
    return { error: "Renkler #RRGGBB formatında olmalı." };
  }

  const name = input.marketplaceName.trim();
  const shortName = input.shortName.trim();
  if (name.length < 2 || shortName.length < 1) {
    return { error: "Marka adı ve kısa ad gerekli." };
  }

  const { data: oldRow } = await ctx.admin
    .from("marketplace_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!oldRow) return { error: "Marketplace settings satırı bulunamadı." };

  const social: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.socialLinks)) {
    const key = k.trim();
    const val = v.trim();
    if (key && val) social[key] = val;
  }

  const patch = {
    marketplace_name: name,
    short_name: shortName,
    tagline: input.tagline?.trim() || null,
    logo_url: input.logoUrl ?? oldRow.logo_url,
    favicon_url: input.faviconUrl ?? oldRow.favicon_url,
    primary_color: input.primaryColor,
    secondary_color: input.secondaryColor,
    accent_color: input.accentColor,
    support_email: input.supportEmail?.trim() || null,
    support_phone: input.supportPhone?.trim() || null,
    company_name: input.companyName?.trim() || null,
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
    site_url: input.siteUrl?.trim().replace(/\/$/, "") || null,
    social_links: social,
  };

  const { data, error } = await ctx.admin
    .from("marketplace_settings")
    .update(patch)
    .eq("id", oldRow.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "settings.update",
    entityType: "marketplace_settings",
    entityId: oldRow.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateSite();
  return { success: true };
}

export async function updateMarketplaceFeatures(input: {
  reviews_enabled: boolean;
  favorites_enabled: boolean;
  quotes_enabled: boolean;
  special_shipping_enabled: boolean;
  product_variants_enabled: boolean;
  seller_chat_enabled: boolean;
  b2b_pricing_enabled: boolean;
  compare_products_enabled: boolean;
  coupons_enabled: boolean;
}): Promise<SettingsActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("marketplace_features")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!oldRow) return { error: "Marketplace features satırı bulunamadı." };

  const { data, error } = await ctx.admin
    .from("marketplace_features")
    .update(input)
    .eq("id", oldRow.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "features.update",
    entityType: "marketplace_features",
    entityId: oldRow.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateSite();
  return { success: true };
}

export async function uploadMarketplaceAsset(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Dosya seçilmedi." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Dosya 5MB’dan büyük olamaz." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${kind}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await ctx.admin.storage
    .from("marketplace-assets")
    .upload(path, buffer, {
      contentType: file.type || "image/png",
      upsert: false,
    });

  if (error) return { error: error.message };

  const { data } = ctx.admin.storage
    .from("marketplace-assets")
    .getPublicUrl(path);
  return { url: data.publicUrl };
}

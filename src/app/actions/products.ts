"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSeller } from "@/lib/auth/require-seller";
import { writeAdminLog } from "@/lib/admin/log";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSellerFormSchema } from "@/lib/seller/form-schema";
import { slugifyProductTitle } from "@/lib/seller/queries";
import type { AttributeType } from "@/lib/attributes/types";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import {
  sendProductApprovedEmail,
  sendProductRejectedEmail,
} from "@/lib/email/send";

export type ProductActionState = {
  error?: string;
  success?: string;
  productId?: string;
  status?: string;
};

export async function fetchSellerFormSchema(categoryId: string) {
  await requireSeller("/panel/urunler/ekle");
  return getSellerFormSchema(categoryId);
}

function revalidateSeller(productId?: string) {
  revalidatePath("/panel");
  revalidatePath("/panel/urunler");
  revalidatePath("/panel/urunler/ekle");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/urunler/bekleyen");
  if (productId) revalidatePath(`/panel/urunler/${productId}`);
}

type AttrValueInput = {
  attributeId: string;
  type: AttributeType;
  value: unknown;
};

function mapAttributeValue(input: AttrValueInput) {
  const base = { product_id: "", attribute_id: input.attributeId };
  switch (input.type) {
    case "BOOLEAN":
      return {
        ...base,
        value_boolean: Boolean(input.value),
        value_text: null,
        value_number: null,
        value_option_id: null,
        value_json: {},
      };
    case "NUMBER":
    case "NUMBER_WITH_UNIT":
    case "YEAR":
      return {
        ...base,
        value_number:
          input.value === "" || input.value == null
            ? null
            : Number(input.value),
        value_text: null,
        value_boolean: null,
        value_option_id: null,
        value_json: {},
      };
    case "RANGE": {
      const v = input.value as { min?: number; max?: number } | null;
      return {
        ...base,
        value_json: v ?? {},
        value_text: null,
        value_number: null,
        value_boolean: null,
        value_option_id: null,
      };
    }
    case "SELECT":
    case "COLOR":
      return {
        ...base,
        value_option_id: input.value ? String(input.value) : null,
        value_text: null,
        value_number: null,
        value_boolean: null,
        value_json: {},
      };
    case "MULTI_SELECT":
      return {
        ...base,
        value_json: Array.isArray(input.value) ? input.value : [],
        value_text: null,
        value_number: null,
        value_boolean: null,
        value_option_id: null,
      };
    default:
      return {
        ...base,
        value_text:
          input.value == null || input.value === ""
            ? null
            : String(input.value),
        value_number: null,
        value_boolean: null,
        value_option_id: null,
        value_json: {},
      };
  }
}

const coreSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalı."),
  description: z.string().trim(),
  brandId: z.string().uuid().nullable().optional(),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().trim().nullable().optional(),
  barcode: z.string().trim().nullable().optional(),
  condition: z.enum(["new", "refurbished", "used"]),
  shippingType: z.enum([
    "STANDARD",
    "FREE",
    "SELLER_DEFINED",
    "QUOTE_REQUIRED",
    "PICKUP",
  ]),
  imageUrls: z.array(z.string().url()).max(8),
  attributeValues: z.array(
    z.object({
      attributeId: z.string().uuid(),
      type: z.string(),
      value: z.unknown(),
    })
  ),
  submitForReview: z.boolean().default(false),
});

export async function createProduct(
  input: z.infer<typeof coreSchema>
): Promise<ProductActionState> {
  const ctx = await requireSeller("/panel/urunler/ekle");
  const parsed = coreSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form." };
  }

  const data = parsed.data;
  let schema;
  try {
    schema = await getSellerFormSchema(data.categoryId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Şema yüklenemedi." };
  }

  if (data.description.length < schema.rules.minDescriptionLength) {
    return {
      error: `Açıklama en az ${schema.rules.minDescriptionLength} karakter olmalı.`,
    };
  }
  if (data.imageUrls.length < schema.rules.requiredImageCount) {
    return {
      error: `En az ${schema.rules.requiredImageCount} görsel gerekli.`,
    };
  }
  if (schema.rules.brandRequired && !data.brandId) {
    return { error: "Bu kategoride marka zorunlu." };
  }
  if (schema.rules.skuRequired && !data.sku) {
    return { error: "SKU zorunlu." };
  }
  if (schema.rules.barcodeRequired && !data.barcode) {
    return { error: "Barkod zorunlu." };
  }
  if (!schema.rules.conditionAllowed.includes(data.condition)) {
    return { error: "Seçilen ürün durumu bu kategoride izinli değil." };
  }
  if (!schema.rules.allowedShippingTypes.includes(data.shippingType)) {
    return { error: "Seçilen kargo tipi bu kategoride izinli değil." };
  }

  for (const field of schema.fields) {
    if (!field.required) continue;
    const entry = data.attributeValues.find(
      (a) => a.attributeId === field.attributeId
    );
    const empty =
      !entry ||
      entry.value === null ||
      entry.value === undefined ||
      entry.value === "" ||
      (Array.isArray(entry.value) && entry.value.length === 0);
    if (empty) {
      return { error: `"${field.name}" zorunlu.` };
    }
  }

  const admin = getSupabaseAdmin();
  const baseSlug = slugifyProductTitle(data.title) || "urun";
  let slug = baseSlug;
  for (let i = 0; i < 10; i++) {
    const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
    const { data: clash } = await admin
      .from("products")
      .select("id")
      .eq("shop_id", ctx.shop.id)
      .eq("slug", candidate)
      .maybeSingle();
    if (!clash) {
      slug = candidate;
      break;
    }
    slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
  }

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      seller_id: ctx.userId,
      shop_id: ctx.shop.id,
      category_id: data.categoryId,
      brand_id: data.brandId || null,
      title: data.title,
      slug,
      description: data.description,
      condition: data.condition,
      status: "DRAFT",
      price: data.price,
      compare_at_price: data.compareAtPrice || null,
      stock: data.stock,
      sku: data.sku || null,
      barcode: data.barcode || null,
      shipping_type: data.shippingType,
    })
    .select("*")
    .single();

  if (productError) return { error: productError.message };

  const attrRows = data.attributeValues
    .map((a) =>
      mapAttributeValue({
        attributeId: a.attributeId,
        type: a.type as AttributeType,
        value: a.value,
      })
    )
    .map((row) => ({ ...row, product_id: product.id }));

  if (attrRows.length) {
    const { error: attrError } = await admin
      .from("product_attribute_values")
      .insert(attrRows);
    if (attrError) return { error: attrError.message };
  }

  if (data.imageUrls.length) {
    const images = data.imageUrls.map((url, i) => ({
      product_id: product.id,
      url,
      sort_order: i,
      is_primary: i === 0,
    }));
    const { error: imgError } = await admin
      .from("product_images")
      .insert(images);
    if (imgError) return { error: imgError.message };
  }

  let status = "DRAFT";
  if (data.submitForReview) {
    const supabase = createClient();
    const { data: newStatus, error: submitError } = await supabase.rpc(
      "submit_product_for_review",
      { p_product_id: product.id }
    );
    if (submitError) return { error: submitError.message };
    status = String(newStatus);

    await writeAdminLog({
      admin,
      adminUserId: ctx.userId,
      action: "product.submit_for_review",
      entityType: "product",
      entityId: product.id,
      newData: { status, product_id: product.id },
    });
  }

  revalidateSeller(product.id);
  return {
    success: data.submitForReview
      ? status === "ACTIVE"
        ? "Ürün yayınlandı."
        : "Ürün incelemeye gönderildi."
      : "Taslak kaydedildi.",
    productId: product.id,
    status,
  };
}

export async function uploadProductImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const ctx = await requireSeller("/panel/urunler/ekle");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Dosya seçilmedi." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Dosya 10MB’dan büyük olamaz." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${ctx.shop.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = getSupabaseAdmin();

  const { error } = await admin.storage.from("product-images").upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return { error: error.message };

  const { data } = admin.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function archiveSellerProduct(
  productId: string
): Promise<ProductActionState> {
  const ctx = await requireSeller("/panel/urunler");
  const admin = getSupabaseAdmin();

  const { data: product } = await admin
    .from("products")
    .select("id, seller_id, shop_id, status")
    .eq("id", productId)
    .maybeSingle();

  if (!product || product.seller_id !== ctx.userId) {
    return { error: "Ürün bulunamadı." };
  }

  const { error } = await admin
    .from("products")
    .update({
      status: "ARCHIVED",
      archived_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidateSeller(productId);
  return { success: "Ürün arşivlendi." };
}

export async function approveProduct(
  productId: string
): Promise<ProductActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("products")
    .select("*, users:seller_id ( email, full_name )")
    .eq("id", productId)
    .maybeSingle();

  if (!oldRow) return { error: "Ürün bulunamadı." };
  if (oldRow.status !== "PENDING_REVIEW") {
    return { error: "Ürün inceleme bekleyen durumda değil." };
  }

  const { data, error } = await ctx.admin
    .from("products")
    .update({
      status: "ACTIVE",
      reviewed_at: new Date().toISOString(),
      reviewed_by: ctx.userId,
      published_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "product.approve",
    entityType: "product",
    entityId: productId,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  const users = oldRow.users as
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null;
  const seller = Array.isArray(users) ? users[0] : users;
  if (seller?.email) {
    await sendProductApprovedEmail({
      to: seller.email,
      productTitle: oldRow.title,
    });
  }

  revalidateSeller(productId);
  return { success: "Ürün onaylandı." };
}

export async function rejectProduct(input: {
  productId: string;
  reason: string;
}): Promise<ProductActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const reason = input.reason.trim();
  if (reason.length < 5) {
    return { error: "Gerekçe en az 5 karakter olmalı." };
  }

  const { data: oldRow } = await ctx.admin
    .from("products")
    .select("*, users:seller_id ( email, full_name )")
    .eq("id", input.productId)
    .maybeSingle();

  if (!oldRow) return { error: "Ürün bulunamadı." };
  if (oldRow.status !== "PENDING_REVIEW") {
    return { error: "Ürün inceleme bekleyen durumda değil." };
  }

  const { data, error } = await ctx.admin
    .from("products")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: ctx.userId,
      rejection_reason: reason,
    })
    .eq("id", input.productId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "product.reject",
    entityType: "product",
    entityId: input.productId,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  const users = oldRow.users as
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null;
  const seller = Array.isArray(users) ? users[0] : users;
  if (seller?.email) {
    await sendProductRejectedEmail({
      to: seller.email,
      productTitle: oldRow.title,
      reason,
    });
  }

  revalidateSeller(input.productId);
  return { success: "Ürün reddedildi." };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import { writeAdminLog } from "@/lib/admin/log";
import { requireUser, slugifyShopName } from "@/lib/auth/require-user";
import {
  sendSellerApplicationAdminNotice,
  sendSellerApplicationReceived,
  sendSellerApproved,
  sendSellerRejected,
} from "@/lib/email/send";
import { enforceFormRateLimit } from "@/lib/security/request";
import { trackEvent } from "@/lib/analytics/events";
import {
  sellerApplicationFullSchema,
  SELLER_DOC_MAX_BYTES,
  SELLER_DOC_MIME_TYPES,
} from "@/lib/validation/seller-application";

export type SellerAppActionState = {
  error?: string;
  success?: string;
};

function parseBooleanField(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "on";
}

async function uploadApplicationDocument(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  file: File,
  kind: "tax_certificate" | "signature_circular"
): Promise<{ path?: string; error?: string }> {
  if (!SELLER_DOC_MIME_TYPES.includes(file.type as (typeof SELLER_DOC_MIME_TYPES)[number])) {
    return { error: "Yalnızca PDF, JPG veya PNG yükleyebilirsiniz." };
  }
  if (file.size > SELLER_DOC_MAX_BYTES) {
    return { error: "Dosya boyutu en fazla 10 MB olabilir." };
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : "jpg";
  const path = `${userId}/${kind}_${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("seller-applications")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) return { error: error.message };
  return { path };
}

function parseApplicationFormData(formData: FormData) {
  const categoryIds = formData
    .getAll("category_ids")
    .map((v) => String(v))
    .filter(Boolean);

  const billingSame = parseBooleanField(formData.get("billing_same_as_activity"));

  return {
    company_type: formData.get("company_type"),
    company_name: formData.get("company_name"),
    tax_number: String(formData.get("tax_number") ?? "").replace(/\s/g, ""),
    tax_office: formData.get("tax_office"),
    activity_city: formData.get("activity_city"),
    activity_district: formData.get("activity_district"),
    activity_address: formData.get("activity_address"),
    shop_name: formData.get("shop_name"),
    category_ids: categoryIds,
    phone: formData.get("phone"),
    billing_same_as_activity: billingSame,
    billing_city: billingSame
      ? formData.get("activity_city")
      : formData.get("billing_city"),
    billing_district: billingSame
      ? formData.get("activity_district")
      : formData.get("billing_district"),
    billing_address: billingSame
      ? formData.get("activity_address")
      : formData.get("billing_address"),
    return_city: formData.get("return_city"),
    return_district: formData.get("return_district"),
    return_address: formData.get("return_address"),
    iban: formData.get("iban"),
    bank_name: formData.get("bank_name"),
    e_invoice_declared: parseBooleanField(formData.get("e_invoice_declared")),
    e_invoice_confirmed: parseBooleanField(formData.get("e_invoice_confirmed")),
    seller_contract_accepted: parseBooleanField(
      formData.get("seller_contract_accepted")
    ),
    kvkk_accepted: parseBooleanField(formData.get("kvkk_accepted")),
  };
}

export async function submitSellerApplication(
  _prev: SellerAppActionState,
  formData: FormData
): Promise<SellerAppActionState> {
  const rate = enforceFormRateLimit("seller.apply", 3, 60 * 60 * 1000);
  if (!rate.allowed) return { error: rate.message };

  const user = await requireUser("/satici-ol");

  const taxCertificate = formData.get("tax_certificate");
  const signatureCircular = formData.get("signature_circular");

  if (!(taxCertificate instanceof File) || taxCertificate.size === 0) {
    return { error: "Vergi levhası yükleyin." };
  }
  if (!(signatureCircular instanceof File) || signatureCircular.size === 0) {
    return { error: "İmza sirküleri yükleyin." };
  }

  const parsed = sellerApplicationFullSchema.safeParse(
    parseApplicationFormData(formData)
  );

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form." };
  }

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("seller_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "Zaten bekleyen bir başvurunuz var." };
  }

  const taxUpload = await uploadApplicationDocument(
    supabase,
    user.id,
    taxCertificate,
    "tax_certificate"
  );
  if (taxUpload.error || !taxUpload.path) {
    return { error: taxUpload.error ?? "Vergi levhası yüklenemedi." };
  }

  const signatureUpload = await uploadApplicationDocument(
    supabase,
    user.id,
    signatureCircular,
    "signature_circular"
  );
  if (signatureUpload.error || !signatureUpload.path) {
    return { error: signatureUpload.error ?? "İmza sirküleri yüklenemedi." };
  }

  const d = parsed.data;
  const { error } = await supabase.from("seller_applications").insert({
    user_id: user.id,
    company_type: d.company_type,
    company_name: d.company_name,
    shop_name: d.shop_name,
    tax_number: d.tax_number,
    tax_office: d.tax_office,
    activity_city: d.activity_city,
    activity_district: d.activity_district,
    activity_address: d.activity_address,
    billing_same_as_activity: d.billing_same_as_activity,
    billing_city: String(d.billing_city ?? d.activity_city),
    billing_district: String(d.billing_district ?? d.activity_district),
    billing_address: String(d.billing_address ?? d.activity_address),
    return_city: d.return_city,
    return_district: d.return_district,
    return_address: d.return_address,
    iban: d.iban,
    bank_name: d.bank_name,
    phone: d.phone,
    category_ids: d.category_ids,
    tax_certificate_path: taxUpload.path,
    signature_circular_path: signatureUpload.path,
    e_invoice_declared: true,
    seller_contract_accepted: true,
    kvkk_accepted: true,
    status: "pending",
  });

  if (error) return { error: error.message };

  await sendSellerApplicationReceived({
    to: user.email,
    companyName: d.shop_name,
  });
  await sendSellerApplicationAdminNotice({
    companyName: d.shop_name,
    applicantEmail: user.email,
  });

  revalidatePath("/satici-ol");
  revalidatePath("/admin/saticilar/basvurular");

  void trackEvent({
    eventName: "seller_signup_completed",
    sessionId: `user:${user.id}`,
    userId: user.id,
    properties: { company_name: d.company_name, shop_name: d.shop_name },
  });

  return { success: "submitted" };
}

export async function getSellerApplicationDocumentUrl(
  applicationId: string,
  kind: "tax_certificate" | "signature_circular"
): Promise<{ url?: string; error?: string }> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: app, error } = await ctx.admin
    .from("seller_applications")
    .select("tax_certificate_path, signature_circular_path")
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !app) return { error: "Başvuru bulunamadı." };

  const path =
    kind === "tax_certificate"
      ? app.tax_certificate_path
      : app.signature_circular_path;

  if (!path) return { error: "Belge bulunamadı." };

  const { data: signed, error: signError } = await ctx.admin.storage
    .from("seller-applications")
    .createSignedUrl(path, 60 * 5);

  if (signError || !signed?.signedUrl) {
    return { error: signError?.message ?? "Belge açılamadı." };
  }

  return { url: signed.signedUrl };
}

export async function approveSellerApplication(
  applicationId: string
): Promise<SellerAppActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: app, error: fetchError } = await ctx.admin
    .from("seller_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !app) return { error: "Başvuru bulunamadı." };
  if (app.status !== "pending") {
    return { error: "Bu başvuru zaten işlenmiş." };
  }

  const { data: userRow } = await ctx.admin
    .from("users")
    .select("id, email, roles, full_name")
    .eq("id", app.user_id)
    .maybeSingle();

  if (!userRow) return { error: "Kullanıcı bulunamadı." };

  const shopDisplayName =
    (app.shop_name as string | null)?.trim() || app.company_name;
  const baseSlug = slugifyShopName(shopDisplayName) || "magaza";
  let slug = baseSlug;
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
    const { data: clash } = await ctx.admin
      .from("shops")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!clash) {
      slug = candidate;
      break;
    }
    slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
  }

  const { data: shop, error: shopError } = await ctx.admin
    .from("shops")
    .insert({
      owner_id: app.user_id,
      slug,
      name: shopDisplayName,
      company_name: app.company_name,
      tax_number: app.tax_number,
      tax_office: app.tax_office,
      iban: app.iban,
      status: "active",
      moderation_mode: "MANUAL",
      onboarding_step: "approved",
    })
    .select("*")
    .single();

  if (shopError) return { error: shopError.message };

  const roles = Array.from(
    new Set([...(userRow.roles ?? ["buyer"]), "seller"])
  );

  await ctx.admin
    .from("users")
    .update({
      roles,
      phone: app.phone ?? undefined,
    })
    .eq("id", app.user_id);

  const { data: updated, error: updateError } = await ctx.admin
    .from("seller_applications")
    .update({
      status: "active",
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", applicationId)
    .select("*")
    .single();

  if (updateError) return { error: updateError.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "seller.approve",
    entityType: "seller_application",
    entityId: applicationId,
    oldData: app as Record<string, unknown>,
    newData: {
      ...(updated as Record<string, unknown>),
      shop_id: shop.id,
    },
  });

  if (userRow.email) {
    await sendSellerApproved({
      to: userRow.email,
      companyName: app.company_name,
      shopName: shop.name,
    });
  }

  revalidatePath("/admin/saticilar/basvurular");
  revalidatePath("/admin/saticilar");
  return { success: "Başvuru onaylandı, mağaza oluşturuldu." };
}

export async function rejectSellerApplication(input: {
  applicationId: string;
  reason: string;
}): Promise<SellerAppActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const reason = input.reason.trim();
  if (reason.length < 5) {
    return { error: "Red gerekçesi en az 5 karakter olmalı." };
  }

  const { data: app } = await ctx.admin
    .from("seller_applications")
    .select("*")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (!app) return { error: "Başvuru bulunamadı." };
  if (app.status !== "pending") {
    return { error: "Bu başvuru zaten işlenmiş." };
  }

  const { data: updated, error } = await ctx.admin
    .from("seller_applications")
    .update({
      status: "rejected",
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", input.applicationId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  const { data: userRow } = await ctx.admin
    .from("users")
    .select("email")
    .eq("id", app.user_id)
    .maybeSingle();

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "seller.reject",
    entityType: "seller_application",
    entityId: input.applicationId,
    oldData: app as Record<string, unknown>,
    newData: updated as Record<string, unknown>,
  });

  if (userRow?.email) {
    await sendSellerRejected({
      to: userRow.email,
      companyName: app.company_name,
      reason,
    });
  }

  revalidatePath("/admin/saticilar/basvurular");
  return { success: "Başvuru reddedildi." };
}

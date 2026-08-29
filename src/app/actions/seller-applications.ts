"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

export type SellerAppActionState = {
  error?: string;
  success?: string;
};

const applicationSchema = z.object({
  company_name: z.string().trim().min(2, "Şirket adı gerekli."),
  tax_number: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, "Vergi no 10 veya 11 haneli olmalı."),
  tax_office: z.string().trim().min(2, "Vergi dairesi gerekli."),
  iban: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .refine(
      (v) => /^TR\d{24}$/.test(v),
      "Geçerli bir TR IBAN girin (26 karakter)."
    ),
  phone: z.string().trim().min(10, "Telefon gerekli.").max(30),
  category_ids: z
    .array(z.string().uuid())
    .min(1, "En az bir kategori seçin."),
  e_invoice_declared: z
    .boolean()
    .refine((v) => v === true, {
      message: "e-Fatura / e-Arşiv beyanı zorunludur.",
    }),
  kvkk_accepted: z.boolean().refine((v) => v === true, {
    message: "KVKK onayı zorunludur.",
  }),
  note: z.string().trim().max(2000).optional().nullable(),
});

export async function submitSellerApplication(
  _prev: SellerAppActionState,
  formData: FormData
): Promise<SellerAppActionState> {
  const rate = enforceFormRateLimit("seller.apply", 3, 60 * 60 * 1000);
  if (!rate.allowed) return { error: rate.message };

  const user = await requireUser("/satici-ol");

  const categoryIds = formData
    .getAll("category_ids")
    .map((v) => String(v))
    .filter(Boolean);

  const parsed = applicationSchema.safeParse({
    company_name: formData.get("company_name"),
    tax_number: String(formData.get("tax_number") ?? "").replace(/\s/g, ""),
    tax_office: formData.get("tax_office"),
    iban: formData.get("iban"),
    phone: formData.get("phone"),
    category_ids: categoryIds,
    e_invoice_declared: formData.get("e_invoice_declared") === "on",
    kvkk_accepted: formData.get("kvkk_accepted") === "on",
    note: String(formData.get("note") ?? "") || null,
  });

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

  const d = parsed.data;
  const { error } = await supabase.from("seller_applications").insert({
    user_id: user.id,
    company_name: d.company_name,
    tax_number: d.tax_number,
    tax_office: d.tax_office,
    iban: d.iban,
    phone: d.phone,
    category_ids: d.category_ids,
    e_invoice_declared: true,
    kvkk_accepted: true,
    note: d.note,
    status: "pending",
  });

  if (error) return { error: error.message };

  await sendSellerApplicationReceived({
    to: user.email,
    companyName: d.company_name,
  });
  await sendSellerApplicationAdminNotice({
    companyName: d.company_name,
    applicantEmail: user.email,
  });

  revalidatePath("/satici-ol");
  revalidatePath("/admin/saticilar/basvurular");

  void trackEvent({
    eventName: "seller_signup_completed",
    sessionId: `user:${user.id}`,
    userId: user.id,
    properties: { company_name: d.company_name },
  });

  return { success: "Başvurunuz alındı. E-posta ile bilgilendirileceksiniz." };
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

  const baseSlug = slugifyShopName(app.company_name) || "magaza";
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
      name: app.company_name,
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
      company_name: app.company_name,
      tax_number: app.tax_number,
      tax_office: app.tax_office,
      account_type: "corporate",
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

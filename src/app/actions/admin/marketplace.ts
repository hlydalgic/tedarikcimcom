"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import { writeAdminLog } from "@/lib/admin/log";
import type { PlatformOpsSettings } from "@/lib/admin/types";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/saticilar");
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/hakedisler");
  revalidatePath("/admin/iadeler");
  revalidatePath("/admin/kullanicilar");
  revalidatePath("/admin/ayarlar");
  revalidatePath("/admin/loglar");
  revalidatePath("/admin/raporlar");
}

export async function suspendSellerShop(shopId: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .maybeSingle();
  if (!old) return { ok: false, error: "Mağaza bulunamadı." };

  const { data, error } = await ctx.admin
    .from("shops")
    .update({ status: "inactive" })
    .eq("id", shopId)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "seller.suspend",
    entityType: "shop",
    entityId: shopId,
    oldData: old as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function activateSellerShop(shopId: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .maybeSingle();
  if (!old) return { ok: false, error: "Mağaza bulunamadı." };

  const { data, error } = await ctx.admin
    .from("shops")
    .update({ status: "active" })
    .eq("id", shopId)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "seller.activate",
    entityType: "shop",
    entityId: shopId,
    oldData: old as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function setShopModerationMode(
  shopId: string,
  mode: "MANUAL" | "AUTO"
) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .maybeSingle();
  if (!old) return { ok: false, error: "Mağaza bulunamadı." };

  const { data, error } = await ctx.admin
    .from("shops")
    .update({ moderation_mode: mode })
    .eq("id", shopId)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "seller.set_moderation_mode",
    entityType: "shop",
    entityId: shopId,
    oldData: old as Record<string, unknown>,
    newData: data as Record<string, unknown>,
    metadata: { mode },
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function adminCancelOrder(orderId: string, reason?: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  const { error } = await ctx.admin.rpc("cancel_order", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "order.cancel_manual",
    entityType: "order",
    entityId: orderId,
    oldData: old as Record<string, unknown>,
    newData: { status: "CANCELLED" },
    metadata: { reason: reason ?? null },
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function releaseSettlement(settlementId: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("seller_settlements")
    .select("*")
    .eq("id", settlementId)
    .maybeSingle();

  const { error } = await ctx.admin.rpc("admin_release_settlement", {
    p_settlement_id: settlementId,
  });
  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "settlement.release",
    entityType: "seller_settlement",
    entityId: settlementId,
    oldData: old as Record<string, unknown>,
    newData: { settlement_status: "ELIGIBLE" },
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function holdSettlement(settlementId: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("seller_settlements")
    .select("*")
    .eq("id", settlementId)
    .maybeSingle();

  const { error } = await ctx.admin.rpc("admin_hold_settlement", {
    p_settlement_id: settlementId,
  });
  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "settlement.hold",
    entityType: "seller_settlement",
    entityId: settlementId,
    oldData: old as Record<string, unknown>,
    newData: { settlement_status: "PENDING" },
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function approveReturn(returnId: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("return_requests")
    .select("*")
    .eq("id", returnId)
    .maybeSingle();
  if (!old) return { ok: false, error: "İade bulunamadı." };

  const { data, error } = await ctx.admin
    .from("return_requests")
    .update({
      status: "approved",
      resolved_at: new Date().toISOString(),
      resolved_by: ctx.userId,
    })
    .eq("id", returnId)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "refund.approve",
    entityType: "return_request",
    entityId: returnId,
    oldData: old as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function rejectReturn(returnId: string, adminNote: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("return_requests")
    .select("*")
    .eq("id", returnId)
    .maybeSingle();
  if (!old) return { ok: false, error: "İade bulunamadı." };

  const { data, error } = await ctx.admin
    .from("return_requests")
    .update({
      status: "rejected",
      admin_note: adminNote.trim(),
      resolved_at: new Date().toISOString(),
      resolved_by: ctx.userId,
    })
    .eq("id", returnId)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "refund.reject",
    entityType: "return_request",
    entityId: returnId,
    oldData: old as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function suspendUser(userId: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!old) return { ok: false, error: "Kullanıcı bulunamadı." };

  const { data, error } = await ctx.admin
    .from("users")
    .update({ status: "inactive" })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "user.suspend",
    entityType: "user",
    entityId: userId,
    oldData: old as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function activateUser(userId: string) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const { data: old } = await ctx.admin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!old) return { ok: false, error: "Kullanıcı bulunamadı." };

  const { data, error } = await ctx.admin
    .from("users")
    .update({ status: "active" })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "user.activate",
    entityType: "user",
    entityId: userId,
    oldData: old as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidateAdmin();
  return { ok: true as const };
}

export async function updatePlatformOpsSettings(input: PlatformOpsSettings) {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { ok: false as const, error: ctx.error };

  const entries: { key: string; value: unknown }[] = [
    { key: "shipping_business_days", value: input.shipping_business_days },
    { key: "order_delay_warning_days", value: input.order_delay_warning_days },
    { key: "settlement_period", value: input.settlement_period },
    { key: "default_commission_rate", value: input.default_commission_rate },
    {
      key: "default_settlement_delay_days",
      value: input.default_settlement_delay_days,
    },
    { key: "payout_hold_days", value: input.payout_hold_days },
  ];

  const { data: oldRows } = await ctx.admin
    .from("platform_settings")
    .select("*")
    .in(
      "key",
      entries.map((e) => e.key)
    );

  for (const entry of entries) {
    await ctx.admin
      .from("platform_settings")
      .update({
        value: entry.value,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      })
      .eq("key", entry.key);
  }

  const { data: newRows } = await ctx.admin
    .from("platform_settings")
    .select("*")
    .in(
      "key",
      entries.map((e) => e.key)
    );

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "settings.update",
    entityType: "platform_settings",
    oldData: { rows: oldRows },
    newData: { rows: newRows, patch: input },
  });

  revalidateAdmin();
  return { ok: true as const };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  sendBuyerOrderConfirmation,
  sendSellerNewOrderNotification,
} from "@/lib/email/send";
import type { CheckoutPayload } from "@/lib/orders/types";
import { createSignedInvoiceUrl } from "@/lib/orders/queries";
import { trackEvent } from "@/lib/analytics/events";

export type CheckoutResult =
  | { ok: true; orderNumber: string; grandTotal: number }
  | { ok: false; error: string };

export async function placeOrder(
  payload: CheckoutPayload
): Promise<CheckoutResult> {
  const user = await requireUser("/odeme");

  if (!payload.items?.length) {
    return { ok: false, error: "Sepetiniz boş." };
  }
  if (!payload.shipping_address?.full_name || !payload.billing_address?.full_name) {
    return { ok: false, error: "Teslimat ve fatura adresi zorunludur." };
  }

  const supabase = createClient();
  const mockPaymentId = `mock_${Date.now()}_${user.id.slice(0, 8)}`;

  const { data, error } = await supabase.rpc("create_order_from_checkout", {
    p_buyer_id: user.id,
    p_payload: {
      ...payload,
      mock_payment: true,
      mock_payment_id: mockPaymentId,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.order_number) {
    return { ok: false, error: "Sipariş oluşturulamadı." };
  }

  const orderNumber = String(row.order_number);
  const grandTotal = Number(row.grand_total);

  // Emails (best-effort)
  try {
    const admin = getSupabaseAdmin();
    const { data: buyer } = await admin
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (buyer?.email) {
      await sendBuyerOrderConfirmation({
        to: buyer.email,
        fullName: buyer.full_name,
        orderNumber,
        grandTotal,
        currency: payload.currency || "TRY",
      });
    }

    const { data: sellerOrders } = await admin
      .from("seller_orders")
      .select("id, suborder_number, seller_id, shops(name)")
      .eq("order_id", row.order_id);

    for (const so of sellerOrders ?? []) {
      const { data: seller } = await admin
        .from("users")
        .select("email, full_name")
        .eq("id", so.seller_id)
        .maybeSingle();
      const shop = Array.isArray(so.shops) ? so.shops[0] : so.shops;
      if (seller?.email) {
        await sendSellerNewOrderNotification({
          to: seller.email,
          sellerName: seller.full_name,
          shopName: shop?.name ?? "Mağazanız",
          orderNumber,
          suborderNumber: so.suborder_number,
        });
      }
    }
  } catch {
    /* email failures should not block checkout */
  }

  revalidatePath("/hesabim/siparisler");
  revalidatePath("/panel/siparisler");

  void trackEvent({
    eventName: "purchase",
    sessionId: `user:${user.id}`,
    userId: user.id,
    properties: {
      order_number: orderNumber,
      grand_total: grandTotal,
    },
  });

  return { ok: true, orderNumber, grandTotal };
}

export async function cancelBuyerOrder(
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUser("/hesabim/siparisler");
  const supabase = createClient();
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/hesabim/siparisler");
  revalidatePath(`/hesabim/siparisler/${orderId}`);
  return { ok: true };
}

export async function shipSellerOrder(input: {
  sellerOrderId: string;
  carrierCode?: string;
  trackingCode: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser("/panel/siparisler");
  const supabase = createClient();

  const tracking = input.trackingCode.trim();
  if (!tracking) return { ok: false, error: "Kargo takip kodu gerekli." };

  const { data: so, error: soErr } = await supabase
    .from("seller_orders")
    .select("id, seller_id, status")
    .eq("id", input.sellerOrderId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (soErr || !so) return { ok: false, error: "Sipariş bulunamadı." };
  if (!["PAID", "PROCESSING"].includes(so.status)) {
    return { ok: false, error: "Bu sipariş kargolanamaz." };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id")
    .eq("seller_order_id", so.id);

  if (!items?.length) return { ok: false, error: "Kalem bulunamadı." };

  const rows = items.map((it) => ({
    order_item_id: it.id,
    seller_order_id: so.id,
    carrier_code: input.carrierCode?.trim() || "OTHER",
    tracking_code: tracking,
    status: "IN_TRANSIT" as const,
    shipped_at: new Date().toISOString(),
  }));

  const admin = getSupabaseAdmin();
  const { error: shipErr } = await admin.from("shipments").insert(rows);
  if (shipErr) return { ok: false, error: shipErr.message };

  await supabase
    .from("seller_orders")
    .update({
      status: "SHIPPED",
      fulfillment_status: "FULFILLED",
      shipment_status: "IN_TRANSIT",
    })
    .eq("id", so.id);

  await supabase
    .from("order_items")
    .update({ status: "SHIPPED" })
    .eq("seller_order_id", so.id);

  revalidatePath("/panel/siparisler");
  revalidatePath(`/panel/siparisler/${so.id}`);
  return { ok: true };
}

export async function uploadSellerInvoice(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await requireUser("/panel/siparisler");
  const sellerOrderId = String(formData.get("sellerOrderId") ?? "");
  const file = formData.get("file");

  if (!sellerOrderId) return { ok: false, error: "Sipariş gerekli." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "PDF dosyası seçin." };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, error: "Yalnızca PDF yüklenebilir." };
  }

  const supabase = createClient();
  const { data: so } = await supabase
    .from("seller_orders")
    .select("id, shop_id, seller_id, order_id, seller_net_amount")
    .eq("id", sellerOrderId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!so) return { ok: false, error: "Sipariş bulunamadı." };

  const { data: order } = await supabase
    .from("orders")
    .select("buyer_id, currency")
    .eq("id", so.order_id)
    .maybeSingle();

  if (!order) return { ok: false, error: "Ana sipariş bulunamadı." };

  const admin = getSupabaseAdmin();
  const invoiceId = crypto.randomUUID();
  const path = `${so.shop_id}/${invoiceId}.pdf`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from("invoices")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (upErr) return { ok: false, error: upErr.message };

  const { error: invErr } = await admin.from("invoices").insert({
    id: invoiceId,
    order_id: so.order_id,
    seller_order_id: so.id,
    seller_id: so.seller_id,
    buyer_id: order.buyer_id,
    invoice_number: `INV-${so.id.slice(0, 8).toUpperCase()}`,
    invoice_type: "SALES",
    invoice_date: new Date().toISOString().slice(0, 10),
    document_path: path,
    status: "ISSUED",
    total_amount: so.seller_net_amount,
    currency: order.currency,
  });

  if (invErr) return { ok: false, error: invErr.message };

  revalidatePath(`/panel/siparisler/${so.id}`);
  revalidatePath("/hesabim/siparisler");
  return { ok: true };
}

export async function getInvoiceDownloadUrl(
  invoiceId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await requireUser();
  const supabase = createClient();

  const { data: inv } = await supabase
    .from("invoices")
    .select("id, document_path, buyer_id, seller_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!inv?.document_path) return { ok: false, error: "Fatura bulunamadı." };
  if (inv.buyer_id !== user.id && inv.seller_id !== user.id) {
    return { ok: false, error: "Yetkisiz." };
  }

  try {
    const url = await createSignedInvoiceUrl(inv.document_path);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "URL alınamadı" };
  }
}

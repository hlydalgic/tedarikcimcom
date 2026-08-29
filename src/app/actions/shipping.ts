"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getShippingProvider,
  isShippingIntegrationEnabled,
} from "@/lib/shipping";
import {
  DEFAULT_PARCEL,
  ensureShopGeliverSenderAddress,
  mapOrderAddressToShipping,
} from "@/lib/shipping/helpers";
import { syncSellerOrderShipment } from "@/lib/shipping/sync";
import { sendBuyerShipmentTrackingEmail } from "@/lib/email/send";
import type { CarrierOption } from "@/lib/shipping/types";

export async function listShippingCarriers(): Promise<CarrierOption[]> {
  if (!isShippingIntegrationEnabled()) return [];
  const provider = getShippingProvider();
  return provider.listCarriers();
}

export async function createGeliverShipmentLabel(input: {
  sellerOrderId: string;
  providerServiceCode: string;
}): Promise<
  | {
      ok: true;
      trackingNumber: string | null;
      trackingUrl: string | null;
      labelUrl: string | null;
    }
  | { ok: false; error: string }
> {
  const user = await requireUser("/panel/siparisler");
  if (!isShippingIntegrationEnabled()) {
    return { ok: false, error: "Geliver entegrasyonu kapalı." };
  }

  const code = input.providerServiceCode.trim();
  if (!code) return { ok: false, error: "Kargo firması seçin." };

  const supabase = createClient();
  const { data: so, error: soErr } = await supabase
    .from("seller_orders")
    .select(
      `id, seller_id, shop_id, status, suborder_number, subtotal, shipping_amount,
       order_id, shops(id, name, company_name, geliver_sender_address_id),
       orders(order_number, shipping_address, buyer_id, currency)`
    )
    .eq("id", input.sellerOrderId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (soErr || !so) return { ok: false, error: "Sipariş bulunamadı." };
  if (!["PAID", "PROCESSING"].includes(so.status)) {
    return { ok: false, error: "Bu sipariş kargolanamaz." };
  }

  const { data: existing } = await supabase
    .from("shipments")
    .select("id")
    .eq("seller_order_id", so.id)
    .not("tracking_code", "is", null)
    .limit(1);

  if (existing?.length) {
    return { ok: false, error: "Bu sipariş için zaten kargo etiketi var." };
  }

  const shopRaw = Array.isArray(so.shops) ? so.shops[0] : so.shops;
  const orderRaw = Array.isArray(so.orders) ? so.orders[0] : so.orders;
  if (!shopRaw || !orderRaw) {
    return { ok: false, error: "Mağaza veya sipariş bilgisi eksik." };
  }

  const shop = shopRaw as {
    id: string;
    name: string;
    company_name: string | null;
    geliver_sender_address_id: string | null;
  };
  const order = orderRaw as {
    order_number: string;
    shipping_address: Record<string, unknown>;
    buyer_id: string;
    currency: string;
  };

  const { data: items } = await supabase
    .from("order_items")
    .select("id")
    .eq("seller_order_id", so.id);

  if (!items?.length) return { ok: false, error: "Kalem bulunamadı." };

  let senderAddressId: string;
  try {
    senderAddressId = await ensureShopGeliverSenderAddress(shop);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gönderici adresi oluşturulamadı.",
    };
  }

  const admin = getSupabaseAdmin();
  const { data: buyer } = await admin
    .from("users")
    .select("email")
    .eq("id", order.buyer_id)
    .maybeSingle();

  const recipient = mapOrderAddressToShipping(
    order.shipping_address,
    buyer?.email ?? undefined
  );

  const provider = getShippingProvider();
  let result;
  try {
    result = await provider.createShipment({
      senderAddressId,
      recipient,
      providerServiceCode: code,
      parcel: DEFAULT_PARCEL,
      orderNumber: order.order_number,
      orderTotal: Number(so.subtotal) + Number(so.shipping_amount),
      currency: order.currency,
      sourceIdentifier: so.suborder_number,
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Etiket oluşturulamadı.",
    };
  }

  const now = new Date().toISOString();
  const rows = items.map((it) => ({
    order_item_id: it.id,
    seller_order_id: so.id,
    carrier_code: result.carrierCode,
    tracking_code: result.trackingNumber,
    geliver_shipment_id: result.shipmentId,
    geliver_transaction_id: result.transactionId ?? null,
    label_url: result.labelUrl,
    tracking_url: result.trackingUrl,
    status: "LABEL_CREATED" as const,
    shipped_at: now,
    raw_payload: result.raw ?? null,
  }));

  const { error: shipErr } = await admin.from("shipments").insert(rows);
  if (shipErr) return { ok: false, error: shipErr.message };

  await admin
    .from("seller_orders")
    .update({
      status: "SHIPPED",
      fulfillment_status: "FULFILLED",
      shipment_status: "LABEL_CREATED",
      updated_at: now,
    })
    .eq("id", so.id);

  await admin
    .from("order_items")
    .update({ status: "SHIPPED", updated_at: now })
    .eq("seller_order_id", so.id);

  if (buyer?.email && result.trackingNumber) {
    try {
      await sendBuyerShipmentTrackingEmail({
        to: buyer.email,
        orderNumber: order.order_number,
        suborderNumber: so.suborder_number,
        shopName: shop.name,
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
        carrierName: result.carrierName,
      });
    } catch {
      /* email best-effort */
    }
  }

  revalidatePath("/panel/siparisler");
  revalidatePath(`/panel/siparisler/${so.id}`);
  revalidatePath("/hesabim/siparisler");
  revalidatePath(`/hesabim/siparisler/${order.order_number}`);

  return {
    ok: true,
    trackingNumber: result.trackingNumber,
    trackingUrl: result.trackingUrl,
    labelUrl: result.labelUrl,
  };
}

export async function refreshOrderTracking(
  sellerOrderId: string
): Promise<
  | { ok: true; statusCode: string; isDelivered: boolean }
  | { ok: false; error: string }
> {
  const user = await requireUser();
  if (!isShippingIntegrationEnabled()) {
    return { ok: false, error: "Kargo takibi yapılandırılmamış." };
  }

  const supabase = createClient();
  const { data: sellerOrder, error: soErr } = await supabase
    .from("seller_orders")
    .select("id, seller_id, orders(buyer_id)")
    .eq("id", sellerOrderId)
    .maybeSingle();

  if (soErr || !sellerOrder) {
    return { ok: false, error: "Sipariş bulunamadı." };
  }

  const order = Array.isArray(sellerOrder.orders)
    ? sellerOrder.orders[0]
    : sellerOrder.orders;
  const isBuyer = order?.buyer_id === user.id;
  const isSeller = sellerOrder.seller_id === user.id;

  if (!isBuyer && !isSeller) {
    return { ok: false, error: "Bu siparişi görüntüleme yetkiniz yok." };
  }

  try {
    const result = await syncSellerOrderShipment(sellerOrderId);
    if (!result) {
      return { ok: false, error: "Geliver gönderisi bulunamadı." };
    }
    revalidatePath("/hesabim/siparisler");
    return {
      ok: true,
      statusCode: result.tracking.statusCode,
      isDelivered: result.tracking.isDelivered,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Takip güncellenemedi.",
    };
  }
}

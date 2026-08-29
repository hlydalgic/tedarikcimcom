"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getMarketplaceFeatures,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { listUserAddresses } from "@/lib/cart/queries";
import type { AddressSnapshot } from "@/lib/orders/types";
import { formatPrice } from "@/lib/format";
import {
  sendBuyerOrderConfirmation,
  sendBuyerQuoteReadyEmail,
  sendQuoteRequestReceivedEmail,
  sendSellerNewQuoteRequestEmail,
} from "@/lib/email/send";
import { trackEvent } from "@/lib/analytics/events";

async function ensureQuotesEnabled() {
  const features = await getMarketplaceFeatures();
  if (!isFeatureEnabled(features, "quotes_enabled")) {
    throw new Error("Teklif sistemi kapalı.");
  }
}

function addressToSnapshot(addr: {
  full_name: string;
  phone: string;
  city: string;
  district: string;
  address_line: string;
  postal_code: string | null;
}): AddressSnapshot {
  return {
    full_name: addr.full_name,
    phone: addr.phone,
    city: addr.city,
    district: addr.district,
    address_line: addr.address_line,
    postal_code: addr.postal_code ?? undefined,
  };
}

export async function createQuoteRequest(input: {
  productId: string;
  quantity: number;
  addressId: string;
  note?: string;
}): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  try {
    await ensureQuotesEnabled();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kapalı" };
  }

  const user = await requireUser();
  const qty = Math.max(1, Math.floor(input.quantity));
  if (!input.addressId) {
    return { ok: false, error: "Teslimat adresi seçin." };
  }

  const supabase = createClient();
  await supabase.rpc("expire_old_quotes");

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, title, shipping_type, status, seller_id, shop_id")
    .eq("id", input.productId)
    .maybeSingle();

  if (pErr || !product) return { ok: false, error: "Ürün bulunamadı." };
  if (product.shipping_type !== "QUOTE_REQUIRED") {
    return { ok: false, error: "Bu ürün nakliye teklifi gerektirmiyor." };
  }
  if (product.status !== "ACTIVE") {
    return { ok: false, error: "Ürün satışta değil." };
  }

  const { data: addr } = await supabase
    .from("addresses")
    .select("full_name, phone, city, district, address_line, postal_code")
    .eq("id", input.addressId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!addr) return { ok: false, error: "Adres bulunamadı." };

  const { data: row, error } = await supabase
    .from("quote_requests")
    .insert({
      customer_id: user.id,
      product_id: product.id,
      quantity: qty,
      delivery_address: addressToSnapshot(addr),
      note: input.note?.trim() || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  try {
    const admin = getSupabaseAdmin();
    const { data: buyer } = await admin
      .from("users")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    if (buyer?.email) {
      await sendQuoteRequestReceivedEmail({
        to: buyer.email,
        productTitle: product.title,
      });
    }

    const { data: seller } = await admin
      .from("users")
      .select("email")
      .eq("id", product.seller_id)
      .maybeSingle();

    if (seller?.email) {
      await sendSellerNewQuoteRequestEmail({
        to: seller.email,
        productTitle: product.title,
        quantity: qty,
        requestId: row.id,
      });
    }
  } catch {
    /* email best-effort */
  }

  revalidatePath("/hesabim/teklifler");
  revalidatePath("/panel/teklifler");
  revalidatePath(`/urunler/${product.id}`);

  void trackEvent({
    eventName: "quote_request_submitted",
    sessionId: `user:${user.id}`,
    userId: user.id,
    properties: { product_id: product.id, request_id: row.id },
  });

  return { ok: true, requestId: row.id };
}

export async function submitSellerQuote(input: {
  quoteRequestId: string;
  price: number;
  estimatedDays?: number;
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser("/panel/teklifler");
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Geçerli bir fiyat girin." };
  }

  const supabase = createClient();

  const { data: req } = await supabase
    .from("quote_requests")
    .select("id, status, product_id, products(seller_id, shop_id)")
    .eq("id", input.quoteRequestId)
    .maybeSingle();

  if (!req) return { ok: false, error: "Talep bulunamadı." };
  if (!["open", "quoted"].includes(req.status)) {
    return { ok: false, error: "Bu talep artık teklif almıyor." };
  }

  const product = Array.isArray(req.products) ? req.products[0] : req.products;
  if (!product || product.seller_id !== user.id) {
    return { ok: false, error: "Yetkisiz." };
  }

  const { data: existing } = await supabase
    .from("seller_quotes")
    .select("id, status")
    .eq("quote_request_id", input.quoteRequestId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (existing && existing.status === "accepted") {
    return { ok: false, error: "Kabul edilmiş teklif güncellenemez." };
  }

  const payload = {
    quote_request_id: input.quoteRequestId,
    seller_id: user.id,
    shop_id: product.shop_id,
    price,
    estimated_days: input.estimatedDays ?? null,
    note: input.note?.trim() || null,
    status: "quoted" as const,
  };

  const { error } = existing
    ? await supabase
        .from("seller_quotes")
        .update({
          price: payload.price,
          estimated_days: payload.estimated_days,
          note: payload.note,
          status: "quoted",
        })
        .eq("id", existing.id)
    : await supabase.from("seller_quotes").insert(payload);

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("quote_requests")
    .update({ status: "quoted" })
    .eq("id", input.quoteRequestId)
    .in("status", ["open", "quoted"]);

  try {
    const admin = getSupabaseAdmin();
    const { data: full } = await admin
      .from("quote_requests")
      .select("customer_id, product_id")
      .eq("id", input.quoteRequestId)
      .maybeSingle();

    const { data: prod } = full
      ? await admin.from("products").select("title").eq("id", full.product_id).maybeSingle()
      : { data: null };

    const { data: shop } = await admin
      .from("shops")
      .select("name")
      .eq("id", product.shop_id)
      .maybeSingle();

    const { data: buyer } = full
      ? await admin.from("users").select("email").eq("id", full.customer_id).maybeSingle()
      : { data: null };

    if (buyer?.email && prod?.title && shop?.name) {
      await sendBuyerQuoteReadyEmail({
        to: buyer.email,
        productTitle: prod.title,
        shopName: shop.name,
        price: formatPrice(price),
        requestId: input.quoteRequestId,
      });
    }
  } catch {
    /* email best-effort */
  }

  revalidatePath("/panel/teklifler");
  revalidatePath(`/panel/teklifler/${input.quoteRequestId}`);
  revalidatePath("/hesabim/teklifler");
  revalidatePath(`/hesabim/teklifler/${input.quoteRequestId}`);

  return { ok: true };
}

export async function acceptSellerQuote(
  sellerQuoteId: string
): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
  await requireUser("/hesabim/teklifler");
  const supabase = createClient();

  const { error } = await supabase.rpc("accept_seller_quote", {
    p_seller_quote_id: sellerQuoteId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/hesabim/teklifler");
  return {
    ok: true,
    checkoutUrl: `/odeme/teklif/${sellerQuoteId}`,
  };
}

export async function rejectSellerQuote(
  sellerQuoteId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUser("/hesabim/teklifler");
  const supabase = createClient();

  const { data: sq } = await supabase
    .from("seller_quotes")
    .select("id, quote_request_id, status, quote_requests(customer_id, status)")
    .eq("id", sellerQuoteId)
    .maybeSingle();

  if (!sq) return { ok: false, error: "Teklif bulunamadı." };

  const qr = Array.isArray(sq.quote_requests)
    ? sq.quote_requests[0]
    : sq.quote_requests;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || qr?.customer_id !== user.id) {
    return { ok: false, error: "Yetkisiz." };
  }

  if (!["open", "quoted"].includes(sq.status)) {
    return { ok: false, error: "Bu teklif reddedilemez." };
  }

  const { error } = await supabase
    .from("seller_quotes")
    .update({ status: "rejected" })
    .eq("id", sellerQuoteId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/hesabim/teklifler");
  revalidatePath(`/hesabim/teklifler/${sq.quote_request_id}`);
  return { ok: true };
}

export async function cancelQuoteRequest(
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUser("/hesabim/teklifler");
  const supabase = createClient();

  const { data: req } = await supabase
    .from("quote_requests")
    .select("id, status, customer_id")
    .eq("id", requestId)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!req || req.customer_id !== user?.id) {
    return { ok: false, error: "Talep bulunamadı." };
  }

  if (!["open", "quoted"].includes(req.status)) {
    return { ok: false, error: "Bu talep iptal edilemez." };
  }

  await supabase
    .from("seller_quotes")
    .update({ status: "cancelled" })
    .eq("quote_request_id", requestId)
    .in("status", ["open", "quoted"]);

  const { error } = await supabase
    .from("quote_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/hesabim/teklifler");
  revalidatePath("/panel/teklifler");
  return { ok: true };
}

export type QuoteCheckoutResult =
  | { ok: true; orderNumber: string; grandTotal: number }
  | { ok: false; error: string };

export async function placeQuoteOrder(input: {
  sellerQuoteId: string;
  billingAddress: AddressSnapshot;
  billingType: "individual" | "corporate";
  notes?: string;
}): Promise<QuoteCheckoutResult> {
  const user = await requireUser();
  const supabase = createClient();
  const mockPaymentId = `mock_quote_${Date.now()}_${user.id.slice(0, 8)}`;

  const { data, error } = await supabase.rpc("create_order_from_quote", {
    p_buyer_id: user.id,
    p_seller_quote_id: input.sellerQuoteId,
    p_payload: {
      billing_address: input.billingAddress,
      billing_type: input.billingType,
      notes: input.notes ?? null,
      mock_payment: true,
      mock_payment_id: mockPaymentId,
    },
  });

  if (error) return { ok: false, error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.order_number) {
    return { ok: false, error: "Sipariş oluşturulamadı." };
  }

  const orderNumber = String(row.order_number);
  const grandTotal = Number(row.grand_total);

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
        currency: "TRY",
      });
    }
  } catch {
    /* email best-effort */
  }

  revalidatePath("/hesabim/siparisler");
  revalidatePath("/hesabim/teklifler");
  return { ok: true, orderNumber, grandTotal };
}

export async function getQuoteRequestAddresses() {
  await requireUser();
  return listUserAddresses();
}

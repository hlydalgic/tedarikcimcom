import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isShippingIntegrationEnabled } from "@/lib/shipping";
import { syncSellerOrderShipment } from "@/lib/shipping/sync";

export type BuyerOrderListItem = {
  id: string;
  order_number: string;
  status: string;
  grand_total: number;
  currency: string;
  created_at: string;
  seller_order_count: number;
};

export type OrderItemDetail = {
  id: string;
  title_snapshot: string;
  sku_snapshot: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  shipping_type: string;
  status: string;
  product_id: string;
};

export type OrderShipmentInfo = {
  tracking_code: string | null;
  tracking_url: string | null;
  label_url: string | null;
  carrier_code: string | null;
  status: string;
  geliver_shipment_id: string | null;
};

export type SellerOrderDetail = {
  id: string;
  suborder_number: string;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  seller_id: string;
  status: string;
  fulfillment_status: string;
  shipment_status: string;
  subtotal: number;
  shipping_amount: number;
  commission_amount: number;
  seller_net_amount: number;
  items: OrderItemDetail[];
  tracking_code: string | null;
  shipment: OrderShipmentInfo | null;
  invoice: {
    id: string;
    invoice_number: string | null;
    document_path: string | null;
    status: string;
  } | null;
};

export type BuyerOrderDetail = {
  id: string;
  order_number: string;
  status: string;
  currency: string;
  subtotal: number;
  shipping_total: number;
  discount_total: number;
  grand_total: number;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  billing_type: string | null;
  created_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  seller_orders: SellerOrderDetail[];
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

type ShipmentRow = {
  tracking_code: string | null;
  tracking_url: string | null;
  label_url: string | null;
  carrier_code: string | null;
  status: string;
  geliver_shipment_id: string | null;
};

function mapShipmentRow(row: ShipmentRow | null | undefined): OrderShipmentInfo | null {
  if (!row) return null;
  return {
    tracking_code: row.tracking_code,
    tracking_url: row.tracking_url,
    label_url: row.label_url,
    carrier_code: row.carrier_code,
    status: row.status,
    geliver_shipment_id: row.geliver_shipment_id,
  };
}

async function loadSellerOrderShipment(
  sellerOrderId: string,
  syncLive: boolean
): Promise<OrderShipmentInfo | null> {
  if (syncLive && isShippingIntegrationEnabled()) {
    try {
      await syncSellerOrderShipment(sellerOrderId);
    } catch {
      /* live sync best-effort */
    }
  }

  const supabase = createClient();
  const { data: shipments } = await supabase
    .from("shipments")
    .select(
      "tracking_code, tracking_url, label_url, carrier_code, status, geliver_shipment_id"
    )
    .eq("seller_order_id", sellerOrderId)
    .order("created_at", { ascending: false })
    .limit(1);

  return mapShipmentRow(shipments?.[0] as ShipmentRow | undefined);
}

export async function listBuyerOrders(): Promise<BuyerOrderListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, grand_total, currency, created_at, seller_orders(id)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    grand_total: Number(o.grand_total),
    currency: o.currency,
    created_at: o.created_at,
    seller_order_count: Array.isArray(o.seller_orders) ? o.seller_orders.length : 0,
  }));
}

export async function getBuyerOrderByNumber(
  orderNumber: string
): Promise<BuyerOrderDetail | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, currency, subtotal, shipping_total, discount_total,
       grand_total, shipping_address, billing_address, billing_type,
       created_at, paid_at, cancelled_at, buyer_id`
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order || order.buyer_id !== user.id) return null;

  return hydrateOrderDetail(order);
}

export async function getOrderByNumberPublicForBuyer(
  orderNumber: string,
  buyerId: string
): Promise<BuyerOrderDetail | null> {
  const supabase = createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, currency, subtotal, shipping_total, discount_total,
       grand_total, shipping_address, billing_address, billing_type,
       created_at, paid_at, cancelled_at, buyer_id`
    )
    .eq("order_number", orderNumber)
    .eq("buyer_id", buyerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) return null;
  return hydrateOrderDetail(order);
}

async function hydrateOrderDetail(
  order: Record<string, unknown>
): Promise<BuyerOrderDetail> {
  const supabase = createClient();
  const orderId = String(order.id);

  const { data: sellerOrders, error } = await supabase
    .from("seller_orders")
    .select(
      `id, suborder_number, shop_id, seller_id, status, fulfillment_status,
       shipment_status, subtotal, shipping_amount, commission_amount, seller_net_amount,
       shops(name, slug)`
    )
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);

  const details: SellerOrderDetail[] = [];

  for (const so of sellerOrders ?? []) {
    const shop = unwrapOne(so.shops as { name: string; slug: string } | { name: string; slug: string }[]);

    const { data: items } = await supabase
      .from("order_items")
      .select(
        `id, title_snapshot, sku_snapshot, unit_price, quantity, line_total,
         shipping_type, status, product_id`
      )
      .eq("seller_order_id", so.id);

    const shipment = await loadSellerOrderShipment(String(so.id), true);

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, document_path, status")
      .eq("seller_order_id", so.id)
      .order("created_at", { ascending: false })
      .limit(1);

    details.push({
      id: so.id,
      suborder_number: so.suborder_number,
      shop_id: so.shop_id,
      shop_name: shop?.name ?? "Mağaza",
      shop_slug: shop?.slug ?? "",
      seller_id: so.seller_id,
      status: so.status,
      fulfillment_status: so.fulfillment_status,
      shipment_status: so.shipment_status,
      subtotal: Number(so.subtotal),
      shipping_amount: Number(so.shipping_amount),
      commission_amount: Number(so.commission_amount),
      seller_net_amount: Number(so.seller_net_amount),
      items: (items ?? []).map((it) => ({
        id: it.id,
        title_snapshot: it.title_snapshot,
        sku_snapshot: it.sku_snapshot,
        unit_price: Number(it.unit_price),
        quantity: it.quantity,
        line_total: Number(it.line_total),
        shipping_type: it.shipping_type,
        status: it.status,
        product_id: it.product_id,
      })),
      tracking_code: shipment?.tracking_code ?? null,
      shipment,
      invoice: invoices?.[0]
        ? {
            id: invoices[0].id,
            invoice_number: invoices[0].invoice_number,
            document_path: invoices[0].document_path,
            status: invoices[0].status,
          }
        : null,
    });
  }

  return {
    id: orderId,
    order_number: String(order.order_number),
    status: String(order.status),
    currency: String(order.currency),
    subtotal: Number(order.subtotal),
    shipping_total: Number(order.shipping_total),
    discount_total: Number(order.discount_total),
    grand_total: Number(order.grand_total),
    shipping_address: (order.shipping_address as Record<string, unknown>) ?? {},
    billing_address: (order.billing_address as Record<string, unknown>) ?? {},
    billing_type: (order.billing_type as string | null) ?? null,
    created_at: String(order.created_at),
    paid_at: (order.paid_at as string | null) ?? null,
    cancelled_at: (order.cancelled_at as string | null) ?? null,
    seller_orders: details,
  };
}

export type SellerOrderListItem = {
  id: string;
  suborder_number: string;
  status: string;
  fulfillment_status: string;
  shipment_status: string;
  subtotal: number;
  shipping_amount: number;
  seller_net_amount: number;
  created_at: string;
  order_number: string;
  buyer_name: string | null;
};

export async function listSellerOrders(status?: string): Promise<SellerOrderListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("seller_orders")
    .select(
      `id, suborder_number, status, fulfillment_status, shipment_status,
       subtotal, shipping_amount, seller_net_amount, created_at,
       orders(order_number, buyer_id)`
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const order = unwrapOne(
      row.orders as { order_number: string; buyer_id: string } | { order_number: string; buyer_id: string }[]
    );
    return {
      id: row.id,
      suborder_number: row.suborder_number,
      status: row.status,
      fulfillment_status: row.fulfillment_status,
      shipment_status: row.shipment_status,
      subtotal: Number(row.subtotal),
      shipping_amount: Number(row.shipping_amount),
      seller_net_amount: Number(row.seller_net_amount),
      created_at: row.created_at,
      order_number: order?.order_number ?? "",
      buyer_name: null,
    };
  });
}

export async function getSellerOrderDetail(
  sellerOrderId: string
): Promise<(SellerOrderDetail & { order_number: string; shipping_address: Record<string, unknown> }) | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: so, error } = await supabase
    .from("seller_orders")
    .select(
      `id, suborder_number, shop_id, seller_id, status, fulfillment_status,
       shipment_status, subtotal, shipping_amount, commission_amount, seller_net_amount,
       order_id, shops(name, slug),
       orders(order_number, shipping_address)`
    )
    .eq("id", sellerOrderId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!so) return null;

  const shop = unwrapOne(so.shops as { name: string; slug: string } | { name: string; slug: string }[]);
  const order = unwrapOne(
    so.orders as
      | { order_number: string; shipping_address: Record<string, unknown> }
      | { order_number: string; shipping_address: Record<string, unknown> }[]
  );

  const { data: items } = await supabase
    .from("order_items")
    .select(
      `id, title_snapshot, sku_snapshot, unit_price, quantity, line_total,
       shipping_type, status, product_id`
    )
    .eq("seller_order_id", so.id);

  const shipment = await loadSellerOrderShipment(so.id, false);

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, document_path, status")
    .eq("seller_order_id", so.id)
    .order("created_at", { ascending: false })
    .limit(1);

  return {
    id: so.id,
    suborder_number: so.suborder_number,
    shop_id: so.shop_id,
    shop_name: shop?.name ?? "Mağaza",
    shop_slug: shop?.slug ?? "",
    seller_id: so.seller_id,
    status: so.status,
    fulfillment_status: so.fulfillment_status,
    shipment_status: so.shipment_status,
    subtotal: Number(so.subtotal),
    shipping_amount: Number(so.shipping_amount),
    commission_amount: Number(so.commission_amount),
    seller_net_amount: Number(so.seller_net_amount),
    items: (items ?? []).map((it) => ({
      id: it.id,
      title_snapshot: it.title_snapshot,
      sku_snapshot: it.sku_snapshot,
      unit_price: Number(it.unit_price),
      quantity: it.quantity,
      line_total: Number(it.line_total),
      shipping_type: it.shipping_type,
      status: it.status,
      product_id: it.product_id,
    })),
    tracking_code: shipment?.tracking_code ?? null,
    shipment,
    invoice: invoices?.[0]
      ? {
          id: invoices[0].id,
          invoice_number: invoices[0].invoice_number,
          document_path: invoices[0].document_path,
          status: invoices[0].status,
        }
      : null,
    order_number: order?.order_number ?? "",
    shipping_address: order?.shipping_address ?? {},
  };
}

export async function createSignedInvoiceUrl(documentPath: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from("invoices")
    .createSignedUrl(documentPath, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

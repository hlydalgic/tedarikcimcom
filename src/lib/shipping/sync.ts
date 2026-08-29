import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getShippingProvider } from "@/lib/shipping";
import type { TrackingResult } from "@/lib/shipping/types";

export function mapGeliverStatusToShipmentStatus(code: string): string {
  const u = code.toUpperCase();
  if (u === "DELIVERED") return "DELIVERED";
  if (u.includes("RETURN")) return "RETURNED";
  if (u.includes("FAIL") || u.includes("EXCEPTION") || u.includes("CANCEL")) {
    return "FAILED";
  }
  if (
    u.includes("TRANSIT") ||
    u === "OUT_FOR_DELIVERY" ||
    u === "PICKED_UP" ||
    u === "IN_TRANSIT"
  ) {
    return "IN_TRANSIT";
  }
  if (u.includes("LABEL") || u === "PRE_TRANSIT" || u === "CREATED") {
    return "LABEL_CREATED";
  }
  return "IN_TRANSIT";
}

export type ShipmentSyncResult = {
  sellerOrderId: string;
  tracking: TrackingResult;
  shipmentStatus: string;
  markedDelivered: boolean;
};

export async function syncShipmentByGeliverId(
  geliverShipmentId: string,
  opts?: { deliveredAt?: string }
): Promise<ShipmentSyncResult | null> {
  const admin = getSupabaseAdmin();
  const { data: shipment } = await admin
    .from("shipments")
    .select("id, seller_order_id, status")
    .eq("geliver_shipment_id", geliverShipmentId)
    .limit(1)
    .maybeSingle();

  if (!shipment?.seller_order_id) return null;

  return syncSellerOrderShipment(String(shipment.seller_order_id), opts);
}

export async function syncSellerOrderShipment(
  sellerOrderId: string,
  opts?: { deliveredAt?: string }
): Promise<ShipmentSyncResult | null> {
  const admin = getSupabaseAdmin();
  const { data: shipment } = await admin
    .from("shipments")
    .select("id, geliver_shipment_id, seller_order_id, status")
    .eq("seller_order_id", sellerOrderId)
    .not("geliver_shipment_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!shipment?.geliver_shipment_id) return null;

  const provider = getShippingProvider();
  const tracking = await provider.getTracking(String(shipment.geliver_shipment_id));
  const shipmentStatus = mapGeliverStatusToShipmentStatus(tracking.statusCode);

  const shipmentPatch: Record<string, unknown> = {
    status: shipmentStatus,
    tracking_code: tracking.trackingNumber,
    tracking_url: tracking.trackingUrl,
    updated_at: new Date().toISOString(),
  };
  if (tracking.isDelivered) {
    shipmentPatch.delivered_at = opts?.deliveredAt ?? new Date().toISOString();
  }

  await admin.from("shipments").update(shipmentPatch).eq("id", shipment.id);

  const soPatch: Record<string, unknown> = {
    shipment_status: shipmentStatus,
    updated_at: new Date().toISOString(),
  };
  if (shipmentStatus === "IN_TRANSIT" || shipmentStatus === "DELIVERED") {
    soPatch.status = shipmentStatus === "DELIVERED" ? "DELIVERED" : "SHIPPED";
  }

  await admin.from("seller_orders").update(soPatch).eq("id", sellerOrderId);

  let markedDelivered = false;
  if (tracking.isDelivered) {
    const { error } = await admin.rpc("mark_seller_order_delivered", {
      p_seller_order_id: sellerOrderId,
      p_delivered_at: opts?.deliveredAt ?? new Date().toISOString(),
    });
    if (!error) markedDelivered = true;
  }

  return {
    sellerOrderId,
    tracking,
    shipmentStatus,
    markedDelivered,
  };
}

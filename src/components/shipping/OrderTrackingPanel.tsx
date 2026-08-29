import Link from "next/link";
import {
  SHIPMENT_STATUS_LABELS,
  SELLER_ORDER_STATUS_LABELS,
} from "@/lib/orders/types";
import type { OrderShipmentInfo } from "@/lib/orders/queries";

type Props = {
  sellerOrderId: string;
  suborderNumber: string;
  shipmentStatus: string;
  orderStatus: string;
  shipment: OrderShipmentInfo | null;
};

export function OrderTrackingPanel({
  suborderNumber,
  shipmentStatus,
  orderStatus,
  shipment,
}: Props) {
  if (!shipment?.tracking_code && !shipment?.geliver_shipment_id) {
    return null;
  }

  const statusLabel =
    SHIPMENT_STATUS_LABELS[shipment?.status ?? shipmentStatus] ??
    SHIPMENT_STATUS_LABELS[shipmentStatus] ??
    SELLER_ORDER_STATUS_LABELS[orderStatus] ??
    shipmentStatus;

  return (
    <div className="mt-3 rounded-xl border border-border bg-background p-3 text-sm">
      <p className="font-semibold text-ink">Kargo takibi</p>
      <p className="mt-1 text-xs text-ink-muted">
        {suborderNumber} · {statusLabel}
      </p>
      {shipment?.tracking_code ? (
        <p className="mt-2 text-ink-muted">
          Takip no:{" "}
          <span className="font-semibold text-ink">{shipment.tracking_code}</span>
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
        {shipment?.tracking_url ? (
          <Link
            href={shipment.tracking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover"
          >
            Kargo firmasında takip et →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

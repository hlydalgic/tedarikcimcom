import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSellerOrderDetail } from "@/lib/orders/queries";
import { formatPrice } from "@/lib/format";
import { SELLER_ORDER_STATUS_LABELS } from "@/lib/orders/types";
import {
  InvoiceUploadForm,
  ShipOrderForm,
} from "@/components/seller/SellerOrderActions";
import { InvoiceDownloadButton } from "@/components/orders/BuyerOrderActions";

type PageProps = { params: { id: string } };

export const metadata: Metadata = {
  title: "Sipariş detayı | Satıcı paneli",
};

export default async function PanelSiparisDetailPage({ params }: PageProps) {
  const order = await getSellerOrderDetail(params.id);
  if (!order) notFound();

  const addr = order.shipping_address as {
    full_name?: string;
    phone?: string;
    address_line?: string;
    district?: string;
    city?: string;
  };

  const canShip = order.status === "PAID" || order.status === "PROCESSING";

  return (
    <div>
      <Link
        href="/panel/siparisler"
        className="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        ← Siparişler
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">
        {order.suborder_number}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {order.order_number} ·{" "}
        {SELLER_ORDER_STATUS_LABELS[order.status] ?? order.status}
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold">Teslimat</p>
        <p className="mt-1 text-ink-muted">
          {addr.full_name} · {addr.phone}
          <br />
          {addr.address_line}, {addr.district}/{addr.city}
        </p>
      </div>

      <ul className="mt-4 space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between gap-3">
            <span>
              {it.title_snapshot} × {it.quantity}
            </span>
            <span className="font-semibold">{formatPrice(it.line_total)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-border pt-2 text-ink-muted">
          <span>Kargo</span>
          <span>{formatPrice(order.shipping_amount)}</span>
        </li>
        <li className="flex justify-between font-bold">
          <span>Net hakediş</span>
          <span>{formatPrice(order.seller_net_amount)}</span>
        </li>
      </ul>

      {order.tracking_code ? (
        <p className="mt-4 text-sm text-ink-muted">
          Takip kodu:{" "}
          <span className="font-semibold text-ink">{order.tracking_code}</span>
        </p>
      ) : null}

      {canShip && !order.tracking_code ? (
        <ShipOrderForm sellerOrderId={order.id} />
      ) : null}

      {order.invoice?.document_path ? (
        <div className="mt-4">
          <InvoiceDownloadButton invoiceId={order.invoice.id} />
        </div>
      ) : (
        <InvoiceUploadForm sellerOrderId={order.id} />
      )}
    </div>
  );
}

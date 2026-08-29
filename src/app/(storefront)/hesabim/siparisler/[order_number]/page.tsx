import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getBuyerOrderByNumber } from "@/lib/orders/queries";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  SELLER_ORDER_STATUS_LABELS,
} from "@/lib/orders/types";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import {
  CancelOrderButton,
  InvoiceDownloadButton,
} from "@/components/orders/BuyerOrderActions";
import { OrderTrackingPanel } from "@/components/shipping/OrderTrackingPanel";

type PageProps = { params: { order_number: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return {
    title: `Sipariş ${params.order_number} | ${settings.marketplace_name}`,
  };
}

export default async function BuyerOrderDetailPage({ params }: PageProps) {
  await requireUser(`/hesabim/siparisler/${params.order_number}`);
  const order = await getBuyerOrderByNumber(params.order_number);
  if (!order) notFound();

  const canCancel =
    order.status === "PENDING_PAYMENT" || order.status === "PAID";

  const shipping = order.shipping_address as {
    full_name?: string;
    phone?: string;
    address_line?: string;
    district?: string;
    city?: string;
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { name: "Siparişlerim", href: "/hesabim/siparisler" },
          { name: order.order_number },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {order.order_number}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {ORDER_STATUS_LABELS[order.status] ?? order.status} ·{" "}
            {new Date(order.created_at).toLocaleString("tr-TR")}
          </p>
        </div>
        {canCancel ? <CancelOrderButton orderId={order.id} /> : null}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold text-ink">Teslimat adresi</p>
        <p className="mt-1 text-ink-muted">
          {shipping.full_name} · {shipping.phone}
          <br />
          {shipping.address_line}, {shipping.district}/{shipping.city}
        </p>
        <p className="mt-3 font-semibold text-ink">
          Toplam: {formatPrice(order.grand_total, order.currency)}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {order.seller_orders.map((so) => (
          <article
            key={so.id}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/magaza/${so.shop_slug}`}
                  className="font-semibold text-ink hover:text-primary"
                >
                  {so.shop_name}
                </Link>
                <p className="text-xs text-ink-muted">
                  {so.suborder_number} ·{" "}
                  {SELLER_ORDER_STATUS_LABELS[so.status] ?? so.status}
                </p>
              </div>
              <p className="text-sm font-bold">
                {formatPrice(so.subtotal + so.shipping_amount, order.currency)}
              </p>
            </div>
            <ul className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
              {so.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span className="text-ink">
                    {it.title_snapshot} × {it.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(it.line_total, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
            {so.shipment?.tracking_code || so.shipment?.geliver_shipment_id ? (
              <OrderTrackingPanel
                sellerOrderId={so.id}
                suborderNumber={so.suborder_number}
                shipmentStatus={so.shipment_status}
                orderStatus={so.status}
                shipment={so.shipment}
              />
            ) : null}
            {so.invoice?.document_path ? (
              <div className="mt-3">
                <InvoiceDownloadButton invoiceId={so.invoice.id} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrderDetail } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders/types";
import { AdminOrderCancelButton } from "@/components/admin/marketplace/AdminOrderCancelButton";

type PageProps = { params: { id: string } };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const order = await getAdminOrderDetail(params.id);
  if (!order) notFound();

  const canCancel = ["PENDING_PAYMENT", "PAID", "PROCESSING"].includes(
    String(order.status)
  );

  return (
    <div>
      <Link
        href="/admin/siparisler"
        className="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        ← Siparişler
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {order.order_number}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {ORDER_STATUS_LABELS[String(order.status)] ?? order.status} ·{" "}
            {new Date(String(order.created_at)).toLocaleString("tr-TR")}
          </p>
        </div>
        {canCancel ? <AdminOrderCancelButton orderId={String(order.id)} /> : null}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold">Toplam: {formatPrice(Number(order.grand_total), String(order.currency))}</p>
        <p className="mt-1 text-ink-muted">
          Alıcı:{" "}
          {Array.isArray(order.users)
            ? order.users[0]?.full_name
            : (order.users as { full_name?: string })?.full_name}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {(Array.isArray(order.seller_orders) ? order.seller_orders : []).map(
          (so: { id: string; suborder_number: string; status: string; seller_net_amount: number; shops?: { name: string } | { name: string }[] }) => {
            const shop = Array.isArray(so.shops) ? so.shops[0] : so.shops;
            return (
              <div
                key={so.id}
                className="rounded-xl border border-border bg-background p-3 text-sm"
              >
                <p className="font-semibold">{so.suborder_number}</p>
                <p className="text-ink-muted">
                  {shop?.name} · {formatPrice(Number(so.seller_net_amount))}
                </p>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

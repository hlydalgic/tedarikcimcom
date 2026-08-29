import Link from "next/link";
import { listAdminOrders } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders/types";

type PageProps = { searchParams: { durum?: string } };

const FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "PAID", label: "Ödendi" },
  { value: "PROCESSING", label: "Hazırlanıyor" },
  { value: "FULFILLED", label: "Tamamlandı" },
  { value: "CANCELLED", label: "İptal" },
];

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const status = searchParams.durum ?? "all";
  const orders = await listAdminOrders(status);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Siparişler</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "all"
                ? "/admin/siparisler"
                : `/admin/siparisler?durum=${f.value}`
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              status === f.value
                ? "bg-primary text-white"
                : "bg-background text-ink-muted hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/siparisler/${o.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4 hover:border-primary/30"
          >
            <div>
              <p className="font-semibold text-ink">{o.order_number}</p>
              <p className="text-xs text-ink-muted">
                {o.buyer_name ?? "Alıcı"} · {o.seller_order_count} satıcı ·{" "}
                {new Date(o.created_at).toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatPrice(o.grand_total, o.currency)}</p>
              <p className="text-xs text-ink-muted">
                {ORDER_STATUS_LABELS[o.status] ?? o.status}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

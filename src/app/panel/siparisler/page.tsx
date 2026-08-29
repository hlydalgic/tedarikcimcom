import type { Metadata } from "next";
import Link from "next/link";
import { listSellerOrders } from "@/lib/orders/queries";
import { formatPrice } from "@/lib/format";
import { SELLER_ORDER_STATUS_LABELS } from "@/lib/orders/types";

type PageProps = {
  searchParams: { durum?: string };
};

export const metadata: Metadata = {
  title: "Siparişler | Satıcı paneli",
};

const FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "PAID", label: "Ödendi" },
  { value: "PROCESSING", label: "Hazırlanıyor" },
  { value: "SHIPPED", label: "Kargoda" },
  { value: "DELIVERED", label: "Teslim" },
  { value: "CANCELLED", label: "İptal" },
];

export default async function PanelSiparislerPage({ searchParams }: PageProps) {
  const status = searchParams.durum ?? "all";
  const orders = await listSellerOrders(status === "all" ? undefined : status);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Siparişler</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/panel/siparisler" : `/panel/siparisler?durum=${f.value}`}
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

      <div className="mt-6 space-y-3">
        {orders.length ? (
          orders.map((o) => (
            <Link
              key={o.id}
              href={`/panel/siparisler/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4 hover:border-primary/30"
            >
              <div>
                <p className="font-semibold text-ink">{o.suborder_number}</p>
                <p className="text-xs text-ink-muted">
                  {o.order_number} ·{" "}
                  {new Date(o.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {formatPrice(o.seller_net_amount)}
                </p>
                <p className="text-xs text-ink-muted">
                  {SELLER_ORDER_STATUS_LABELS[o.status] ?? o.status}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-muted">
            Bu filtrede sipariş yok.
          </p>
        )}
      </div>
    </div>
  );
}

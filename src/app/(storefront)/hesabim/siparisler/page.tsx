import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { listBuyerOrders } from "@/lib/orders/queries";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders/types";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return { title: `Siparişlerim | ${settings.marketplace_name}` };
}

export default async function BuyerOrdersPage() {
  await requireUser("/hesabim/siparisler");
  const orders = await listBuyerOrders();

  return (
    <div>
      <Breadcrumb items={[{ name: "Siparişlerim" }]} />
      <h1 className="font-display text-2xl font-bold text-ink">Siparişlerim</h1>
      <div className="mt-6 space-y-3">
        {orders.length ? (
          orders.map((o) => (
            <Link
              key={o.id}
              href={`/hesabim/siparisler/${o.order_number}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4 transition hover:border-primary/30"
            >
              <div>
                <p className="font-semibold text-ink">{o.order_number}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {new Date(o.created_at).toLocaleString("tr-TR")} ·{" "}
                  {o.seller_order_count} satıcı
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-ink">
                  {formatPrice(o.grand_total, o.currency)}
                </p>
                <p className="text-xs text-ink-muted">
                  {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-muted">
            Henüz siparişiniz yok.
          </div>
        )}
      </div>
    </div>
  );
}

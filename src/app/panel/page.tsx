import Link from "next/link";
import { requireSeller } from "@/lib/auth/require-seller";
import {
  getSellerDashboardStats,
} from "@/lib/seller/queries";
import { formatMoneyTry } from "@/lib/format/money";

export default async function SellerDashboardPage() {
  const ctx = await requireSeller("/panel");
  const stats = await getSellerDashboardStats(ctx.shop.id, ctx.userId);

  const cards = [
    { label: "Bugün", value: formatMoneyTry(stats.salesToday) },
    { label: "Bu hafta", value: formatMoneyTry(stats.salesWeek) },
    { label: "Bu ay", value: formatMoneyTry(stats.salesMonth) },
    { label: "Bekleyen sipariş", value: String(stats.pendingOrders) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">{ctx.shop.name}</p>
      </div>

      {stats.performanceWarning ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {stats.performanceWarning}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {c.label}
            </p>
            <p className="mt-2 font-display text-xl font-bold text-ink">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold">
            Bekleyen hakediş
          </h2>
          <p className="mt-3 font-display text-2xl font-bold text-primary">
            {formatMoneyTry(stats.pendingSettlement)}
          </p>
          <Link
            href="/panel/hakedis"
            className="mt-3 inline-block text-sm font-medium text-primary"
          >
            Hakediş detayı →
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">
              Son siparişler
            </h2>
            <Link href="/panel/siparisler" className="text-xs font-semibold text-primary">
              Tümü
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-ink-muted">Henüz sipariş yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink">{o.suborder_number}</p>
                    <p className="text-xs text-ink-muted">{o.status}</p>
                  </div>
                  <p className="font-semibold">
                    {formatMoneyTry(o.seller_net_amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

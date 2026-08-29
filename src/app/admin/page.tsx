import Link from "next/link";
import {
  getAdminDashboardStats,
  getAdminGmvTrend,
} from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders/types";
import {
  GmvTrendChart,
  StatCard,
} from "@/components/admin/dashboard/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const [stats, trend] = await Promise.all([
    getAdminDashboardStats(),
    getAdminGmvTrend(30),
  ]);

  const orderTotal = Object.values(stats.order_counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Platform özeti — gerçek zamanlı veritabanı metrikleri.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="GMV bugün" value={formatPrice(stats.gmv_today)} />
        <StatCard label="GMV bu hafta" value={formatPrice(stats.gmv_week)} />
        <StatCard label="GMV bu ay" value={formatPrice(stats.gmv_month)} />
        <StatCard
          label="Toplam sipariş"
          value={String(orderTotal)}
          hint={`${stats.delayed_orders} gecikmiş`}
          alert={stats.delayed_orders > 0}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Aktif satıcı"
          value={String(stats.active_sellers)}
        />
        <StatCard
          label="Yeni üye (30g)"
          value={String(stats.new_users_30d)}
        />
        <StatCard
          label="Bekleyen başvuru"
          value={String(stats.pending_seller_applications)}
          hint={
            stats.pending_seller_applications > 0 ? (
              <Link href="/admin/saticilar/basvurular" className="text-primary">
                Başvurulara git →
              </Link>
            ) : undefined
          }
        />
        <StatCard
          label="Ürün onayı bekleyen"
          value={String(stats.pending_product_approvals)}
          hint={
            stats.pending_product_approvals > 0 ? (
              <Link href="/admin/urunler/bekleyen" className="text-primary">
                Kuyruğa git →
              </Link>
            ) : undefined
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Açık teklif talebi"
          value={String(stats.open_quote_requests)}
        />
        <StatCard
          label="Gecikmiş sipariş"
          value={String(stats.delayed_orders)}
          alert={stats.delayed_orders > 0}
        />
        <StatCard
          label="Bekleyen iade"
          value={String(stats.pending_returns)}
        />
      </div>

      <GmvTrendChart rows={trend} />

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-semibold text-ink">Sipariş statü dağılımı</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {Object.entries(stats.order_counts).map(([status, count]) => (
            <li key={status} className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">
                {ORDER_STATUS_LABELS[status] ?? status}
              </span>
              <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import Link from "next/link";
import { listAdminSellers } from "@/lib/admin/queries";

type PageProps = { searchParams: { durum?: string } };

const FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Askıda" },
  { value: "pending", label: "Bekleyen" },
];

export default async function AdminSellersPage({ searchParams }: PageProps) {
  const status = searchParams.durum ?? "all";
  const sellers = await listAdminSellers(status);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Satıcılar</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Mağaza listesi ve moderasyon yönetimi.
          </p>
        </div>
        <Link
          href="/admin/saticilar/basvurular"
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          Başvurular →
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "all"
                ? "/admin/saticilar"
                : `/admin/saticilar?durum=${f.value}`
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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-muted">
              <th className="px-4 py-3">Mağaza</th>
              <th className="px-4 py-3">Satıcı</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Moderasyon</th>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Sipariş</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/saticilar/${s.id}`}
                    className="font-semibold text-primary hover:text-primary-hover"
                  >
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {s.seller_name ?? s.seller_email}
                </td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3">{s.moderation_mode}</td>
                <td className="px-4 py-3">{s.product_count}</td>
                <td className="px-4 py-3">{s.order_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

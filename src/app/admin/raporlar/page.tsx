import Link from "next/link";
import {
  getFinancialReport,
  getSellerSettlementReport,
} from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";

type PageProps = {
  searchParams: { from?: string; to?: string };
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const to = searchParams.to ?? new Date().toISOString().slice(0, 10);
  const from =
    searchParams.from ??
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [daily, sellers] = await Promise.all([
    getFinancialReport(`${from}T00:00:00Z`, `${to}T23:59:59Z`),
    getSellerSettlementReport(`${from}T00:00:00Z`, `${to}T23:59:59Z`),
  ]);

  const totalGmv = daily.reduce((s, r) => s + r.gmv, 0);
  const totalCommission = daily.reduce((s, r) => s + r.commission, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Finansal raporlar
      </h1>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm">
        <label>
          <span className="mb-1 block text-xs text-ink-muted">Başlangıç</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="h-10 rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-ink-muted">Bitiş</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="h-10 rounded-lg border border-border bg-background px-3"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-xs font-semibold text-white"
        >
          Filtrele
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-ink-muted">Toplam GMV</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(totalGmv)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-ink-muted">Komisyon geliri</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(totalCommission)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/api/admin/export?type=gmv&from=${from}&to=${to}`}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-background"
        >
          GMV Excel
        </a>
        <a
          href={`/api/admin/export?type=settlements&from=${from}&to=${to}`}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-background"
        >
          Hakediş Excel
        </a>
        <a
          href="/api/admin/export?type=orders"
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-background"
        >
          Siparişler Excel
        </a>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-semibold">Günlük GMV</h2>
          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
            {daily.map((r) => (
              <li key={r.label} className="flex justify-between">
                <span>{r.label}</span>
                <span>{formatPrice(r.gmv)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-semibold">Satıcı bazında hakediş</h2>
          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
            {sellers.map((s) => (
              <li key={s.shop_name} className="flex justify-between gap-2">
                <span className="truncate">{s.shop_name}</span>
                <span>{formatPrice(s.total_net)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

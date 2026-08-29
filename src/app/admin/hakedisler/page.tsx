import Link from "next/link";
import { listAdminSettlements } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";
import { SettlementAdminActions } from "@/components/admin/marketplace/SettlementAdminActions";

type PageProps = { searchParams: { durum?: string } };

const STATUSES = [
  "all",
  "PENDING",
  "WAITING_DELIVERY",
  "ELIGIBLE",
  "SETTLED",
  "FAILED",
];

export default async function AdminSettlementsPage({ searchParams }: PageProps) {
  const status = searchParams.durum ?? "all";
  const rows = await listAdminSettlements(status);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Hakedişler</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={
              s === "all"
                ? "/admin/hakedisler"
                : `/admin/hakedisler?durum=${s}`
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              status === s
                ? "bg-primary text-white"
                : "bg-background text-ink-muted hover:text-ink"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-muted">
              <th className="px-4 py-3">Sipariş</th>
              <th className="px-4 py-3">Mağaza</th>
              <th className="px-4 py-3">Brüt</th>
              <th className="px-4 py-3">Komisyon</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div>{r.order_number}</div>
                  <div className="text-xs text-ink-muted">{r.suborder_number}</div>
                </td>
                <td className="px-4 py-3">{r.shop_name}</td>
                <td className="px-4 py-3">{formatPrice(r.gross_amount, r.currency)}</td>
                <td className="px-4 py-3">{formatPrice(r.platform_commission, r.currency)}</td>
                <td className="px-4 py-3">{formatPrice(r.seller_net_amount, r.currency)}</td>
                <td className="px-4 py-3">{r.settlement_status}</td>
                <td className="px-4 py-3">
                  <SettlementAdminActions
                    settlementId={r.id}
                    status={r.settlement_status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

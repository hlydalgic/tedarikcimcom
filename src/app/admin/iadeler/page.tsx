import Link from "next/link";
import { listAdminReturns } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";

type PageProps = { searchParams: { durum?: string } };

export default async function AdminReturnsPage({ searchParams }: PageProps) {
  const status = searchParams.durum ?? "all";
  const rows = await listAdminReturns(status);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">İade yönetimi</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {["all", "pending", "approved", "rejected", "refunded"].map((s) => (
          <Link
            key={s}
            href={
              s === "all" ? "/admin/iadeler" : `/admin/iadeler?durum=${s}`
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

      <div className="mt-6 space-y-2">
        {rows.length ? (
          rows.map((r) => (
            <Link
              key={r.id}
              href={`/admin/iadeler/${r.id}`}
              className="block rounded-2xl border border-border bg-surface px-4 py-4 hover:border-primary/30"
            >
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold">
                    {r.order_number} · {r.suborder_number}
                  </p>
                  <p className="text-ink-muted">
                    {r.buyer_name} · {r.shop_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{r.status}</p>
                  {r.refund_amount != null ? (
                    <p>{formatPrice(r.refund_amount, r.currency)}</p>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{r.reason}</p>
            </Link>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-muted">
            İade talebi yok.
          </p>
        )}
      </div>
    </div>
  );
}

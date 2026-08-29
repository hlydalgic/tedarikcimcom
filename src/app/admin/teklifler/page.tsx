import type { Metadata } from "next";
import Link from "next/link";
import { listAdminQuoteRequests } from "@/lib/quotes/queries";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/types";

type PageProps = {
  searchParams: { durum?: string };
};

export const metadata: Metadata = {
  title: "Teklif yönetimi | Admin",
};

const FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "open", label: "Açık" },
  { value: "expired", label: "Süresi dolmuş" },
];

export default async function AdminTekliflerPage({ searchParams }: PageProps) {
  const filter = (searchParams.durum ?? "all") as "all" | "open" | "expired";
  const requests = await listAdminQuoteRequests(
    filter === "all" ? undefined : filter
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Nakliye teklifleri
      </h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "all"
                ? "/admin/teklifler"
                : `/admin/teklifler?durum=${f.value}`
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              filter === f.value
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
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Alıcı</th>
              <th className="px-4 py-3">Adet</th>
              <th className="px-4 py-3">Teklif</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {requests.length ? (
              requests.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {r.product_title}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {r.customer_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{r.quantity}</td>
                  <td className="px-4 py-3">{r.quote_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.is_expired ? "text-amber-700" : "text-ink-muted"
                      }
                    >
                      {QUOTE_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {new Date(r.created_at).toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-ink-muted"
                >
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

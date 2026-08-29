import type { Metadata } from "next";
import Link from "next/link";
import { listOpenSellerQuoteRequests } from "@/lib/quotes/queries";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/types";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Nakliye teklifleri | Satıcı paneli",
};

export default async function PanelTekliflerPage() {
  const requests = await listOpenSellerQuoteRequests();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Nakliye teklif talepleri
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        QUOTE_REQUIRED ürünleriniz için gelen nakliye talepleri.
      </p>

      <div className="mt-6 space-y-3">
        {requests.length ? (
          requests.map((r) => (
            <Link
              key={r.id}
              href={`/panel/teklifler/${r.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4 hover:border-primary/30"
            >
              <div>
                <p className="font-semibold text-ink">{r.product_title}</p>
                <p className="text-xs text-ink-muted">
                  {r.quantity} adet · {r.customer_name ?? "Alıcı"} ·{" "}
                  {new Date(r.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold text-ink-muted">
                  {QUOTE_STATUS_LABELS[r.status] ?? r.status}
                </p>
                {r.my_quote_price != null ? (
                  <p className="mt-0.5 font-bold text-ink">
                    Teklifiniz: {formatPrice(r.my_quote_price)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-amber-700">Teklif bekleniyor</p>
                )}
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-muted">
            Açık teklif talebi yok.
          </p>
        )}
      </div>
    </div>
  );
}

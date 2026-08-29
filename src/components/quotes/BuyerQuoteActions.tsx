"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  acceptSellerQuote,
  cancelQuoteRequest,
  rejectSellerQuote,
} from "@/app/actions/quotes";
import { formatPrice } from "@/lib/format";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/types";
import type { QuoteRequestDetail } from "@/lib/quotes/types";

export function BuyerQuoteActions({ request }: { request: QuoteRequestDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const canManage = ["open", "quoted"].includes(request.status);

  return (
    <div className="space-y-4">
      {request.seller_quotes.length ? (
        <ul className="space-y-3">
          {request.seller_quotes.map((q) => (
            <li
              key={q.id}
              className="rounded-xl border border-border bg-background p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{q.shop_name}</p>
                  <p className="text-xs text-ink-muted">
                    {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                    {q.estimated_days != null
                      ? ` · ~${q.estimated_days} gün`
                      : ""}
                  </p>
                </div>
                <p className="font-display text-lg font-bold text-ink">
                  {formatPrice(q.price, q.currency)}
                </p>
              </div>
              {q.note ? (
                <p className="mt-2 text-ink-muted">{q.note}</p>
              ) : null}
              {canManage && q.status === "quoted" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                    onClick={() =>
                      start(async () => {
                        const result = await acceptSellerQuote(q.id);
                        if (!result.ok) alert(result.error);
                        else router.push(result.checkoutUrl);
                      })
                    }
                  >
                    Teklifi kabul et
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="h-9 rounded-lg border border-border px-4 text-xs font-semibold hover:bg-surface disabled:opacity-60"
                    onClick={() =>
                      start(async () => {
                        const result = await rejectSellerQuote(q.id);
                        if (!result.ok) alert(result.error);
                        else router.refresh();
                      })
                    }
                  >
                    Reddet
                  </button>
                </div>
              ) : null}
              {q.status === "accepted" ? (
                <a
                  href={`/odeme/teklif/${q.id}`}
                  className="mt-3 inline-flex text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  Ödemeye git →
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-ink-muted">
          Henüz teklif gelmedi. Satıcı yanıtladığında burada görünecek.
        </p>
      )}

      {canManage ? (
        <button
          type="button"
          disabled={pending}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
          onClick={() =>
            start(async () => {
              if (!confirm("Talebi iptal etmek istediğinize emin misiniz?")) return;
              const result = await cancelQuoteRequest(request.id);
              if (!result.ok) alert(result.error);
              else router.refresh();
            })
          }
        >
          Talebi iptal et
        </button>
      ) : null}
    </div>
  );
}

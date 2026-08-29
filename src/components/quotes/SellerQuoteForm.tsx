"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { submitSellerQuote } from "@/app/actions/quotes";
import { formatPrice } from "@/lib/format";
import type { SellerQuoteRequestDetail } from "@/lib/quotes/types";

export function SellerQuoteForm({
  request,
}: {
  request: SellerQuoteRequestDetail;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const canQuote = ["open", "quoted"].includes(request.status);
  const existing = request.my_quote;

  if (!canQuote && !existing) {
    return (
      <p className="text-sm text-ink-muted">Bu talep artık teklif almıyor.</p>
    );
  }

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const result = await submitSellerQuote({
            quoteRequestId: request.id,
            price: Number(fd.get("price")),
            estimatedDays: fd.get("estimatedDays")
              ? Number(fd.get("estimatedDays"))
              : undefined,
            note: String(fd.get("note") || ""),
          });
          if (!result.ok) alert(result.error);
          else router.refresh();
        });
      }}
    >
      <p className="text-sm font-semibold text-ink">
        {existing ? "Teklifi güncelle" : "Teklif ver"}
      </p>
      {existing ? (
        <p className="text-xs text-ink-muted">
          Mevcut teklif: {formatPrice(existing.price, existing.currency)}
        </p>
      ) : null}
      <input
        name="price"
        type="number"
        min={0}
        step="0.01"
        required
        defaultValue={existing?.price ?? ""}
        placeholder="Nakliye fiyatı (TRY)"
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
      />
      <input
        name="estimatedDays"
        type="number"
        min={0}
        defaultValue={existing?.estimated_days ?? ""}
        placeholder="Tahmini teslimat (gün)"
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
      />
      <textarea
        name="note"
        rows={3}
        defaultValue={existing?.note ?? ""}
        placeholder="Not (opsiyonel)"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending || !canQuote}
        className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : existing ? "Güncelle" : "Teklif gönder"}
      </button>
    </form>
  );
}

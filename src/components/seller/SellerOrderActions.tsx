"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { shipSellerOrder, uploadSellerInvoice } from "@/app/actions/orders";

export function ShipOrderForm({ sellerOrderId }: { sellerOrderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const result = await shipSellerOrder({
            sellerOrderId,
            carrierCode: String(fd.get("carrier") || ""),
            trackingCode: String(fd.get("tracking") || ""),
          });
          if (!result.ok) alert(result.error);
          else router.refresh();
        });
      }}
    >
      <p className="text-sm font-semibold text-ink">Kargoya ver</p>
      <input
        name="carrier"
        placeholder="Kargo firması (örn. Yurtiçi)"
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
      />
      <input
        name="tracking"
        required
        placeholder="Takip kodu"
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Kargo kaydet"}
      </button>
    </form>
  );
}

export function InvoiceUploadForm({ sellerOrderId }: { sellerOrderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("sellerOrderId", sellerOrderId);
        start(async () => {
          const result = await uploadSellerInvoice(fd);
          if (!result.ok) alert(result.error);
          else router.refresh();
        });
      }}
    >
      <p className="text-sm font-semibold text-ink">Fatura yükle (PDF)</p>
      <input
        type="file"
        name="file"
        accept="application/pdf"
        required
        className="block w-full text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface disabled:opacity-60"
      >
        {pending ? "Yükleniyor…" : "Yükle"}
      </button>
    </form>
  );
}

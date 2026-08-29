"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBuyerOrder, getInvoiceDownloadUrl } from "@/app/actions/orders";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      onClick={() => {
        if (!confirm("Siparişi iptal etmek istediğinize emin misiniz?")) return;
        start(async () => {
          const result = await cancelBuyerOrder(orderId);
          if (result.ok) router.refresh();
          else alert(result.error);
        });
      }}
    >
      {pending ? "İptal ediliyor…" : "Siparişi iptal et"}
    </button>
  );
}

export function InvoiceDownloadButton({ invoiceId }: { invoiceId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm font-semibold text-primary hover:text-primary-hover disabled:opacity-60"
      onClick={() => {
        start(async () => {
          const result = await getInvoiceDownloadUrl(invoiceId);
          if (result.ok) window.open(result.url, "_blank");
          else alert(result.error);
        });
      }}
    >
      {pending ? "Hazırlanıyor…" : "Faturayı indir"}
    </button>
  );
}

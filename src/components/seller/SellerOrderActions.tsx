"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { shipSellerOrder, uploadSellerInvoice } from "@/app/actions/orders";
import { createGeliverShipmentLabel } from "@/app/actions/shipping";
import type { CarrierOption } from "@/lib/shipping/types";

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
      <p className="text-sm font-semibold text-ink">Kargoya ver (manuel)</p>
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

export function GeliverShipForm({
  sellerOrderId,
  carriers,
}: {
  sellerOrderId: string;
  carriers: CarrierOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const providerServiceCode = String(fd.get("carrier") || "");
        start(async () => {
          const result = await createGeliverShipmentLabel({
            sellerOrderId,
            providerServiceCode,
          });
          if (!result.ok) alert(result.error);
          else router.refresh();
        });
      }}
    >
      <p className="text-sm font-semibold text-ink">Kargoya ver (Geliver)</p>
      <p className="text-xs text-ink-muted">
        Kargo firmasını seçin; etiket otomatik oluşturulur ve alıcıya takip
        numarası e-postalanır.
      </p>
      <select
        name="carrier"
        required
        defaultValue=""
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
      >
        <option value="" disabled>
          Kargo firması seçin
        </option>
        {carriers.map((c) => (
          <option
            key={c.providerServiceCode ?? c.code}
            value={c.providerServiceCode ?? c.code}
          >
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || carriers.length === 0}
        className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Etiket oluşturuluyor…" : "Etiket oluştur"}
      </button>
      {carriers.length === 0 ? (
        <p className="text-xs text-amber-700">
          Geliver üzerinden kargo firması listesi alınamadı. API anahtarınızı
          kontrol edin.
        </p>
      ) : null}
    </form>
  );
}

export function ShipmentInfoLinks({
  shipment,
}: {
  shipment: {
    tracking_code: string | null;
    tracking_url: string | null;
    label_url: string | null;
    carrier_code: string | null;
  } | null;
}) {
  if (!shipment?.tracking_code) return null;

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-4 text-sm">
      <p className="font-semibold text-ink">Kargo bilgisi</p>
      <p className="text-ink-muted">
        {shipment.carrier_code ? `${shipment.carrier_code} · ` : ""}
        Takip:{" "}
        <span className="font-semibold text-ink">{shipment.tracking_code}</span>
      </p>
      <div className="flex flex-wrap gap-3 text-xs font-semibold">
        {shipment.label_url ? (
          <a
            href={shipment.label_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover"
          >
            Etiketi indir
          </a>
        ) : null}
        {shipment.tracking_url ? (
          <a
            href={shipment.tracking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover"
          >
            Takip sayfası
          </a>
        ) : null}
      </div>
    </div>
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

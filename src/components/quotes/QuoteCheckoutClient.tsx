"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeQuoteOrder } from "@/app/actions/quotes";
import { formatPrice } from "@/lib/format";
import type { QuoteCheckoutDetail } from "@/lib/quotes/types";
import type { AddressRow } from "@/lib/orders/types";

type Props = {
  detail: QuoteCheckoutDetail;
  addresses: AddressRow[];
};

export function QuoteCheckoutClient({ detail, addresses }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [billingSame, setBillingSame] = useState(true);
  const subtotal = detail.unit_price * detail.quantity;
  const grandTotal = subtotal + detail.shipping_price;

  const deliverySnapshot = {
    full_name: detail.delivery_address.full_name,
    phone: detail.delivery_address.phone,
    city: detail.delivery_address.city,
    district: detail.delivery_address.district,
    address_line: detail.delivery_address.address_line,
    postal_code: detail.delivery_address.postal_code,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold text-ink">{detail.product_title}</p>
        <p className="mt-1 text-ink-muted">
          {detail.shop_name} · {detail.quantity} adet
        </p>
        <div className="mt-3 space-y-1 border-t border-border pt-3">
          <div className="flex justify-between">
            <span>Ürün</span>
            <span>{formatPrice(subtotal, detail.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Nakliye (teklif)</span>
            <span>{formatPrice(detail.shipping_price, detail.currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-ink">
            <span>Toplam</span>
            <span>{formatPrice(grandTotal, detail.currency)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold text-ink">Teslimat adresi</p>
        <p className="mt-2 text-ink-muted">
          {deliverySnapshot.full_name} · {deliverySnapshot.phone}
          <br />
          {deliverySnapshot.address_line}, {deliverySnapshot.district}/
          {deliverySnapshot.city}
        </p>
      </div>

      <form
        className="rounded-2xl border border-border bg-surface p-4 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const billingId = billingSame
            ? null
            : String(fd.get("billingId") || "");
          const billing = billingSame
            ? deliverySnapshot
            : (() => {
                const a = addresses.find((x) => x.id === billingId);
                if (!a) return deliverySnapshot;
                return {
                  full_name: a.full_name,
                  phone: a.phone,
                  city: a.city,
                  district: a.district,
                  address_line: a.address_line,
                  postal_code: a.postal_code ?? undefined,
                };
              })();

          start(async () => {
            const result = await placeQuoteOrder({
              sellerQuoteId: detail.quote_id,
              billingAddress: billing,
              billingType:
                (fd.get("billingType") as "individual" | "corporate") ||
                "individual",
              notes: String(fd.get("notes") || ""),
            });
            if (!result.ok) alert(result.error);
            else router.push(`/hesabim/siparisler/${result.orderNumber}`);
          });
        }}
      >
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={billingSame}
            onChange={(e) => setBillingSame(e.target.checked)}
          />
          Fatura adresi teslimat ile aynı
        </label>

        {!billingSame && addresses.length ? (
          <select
            name="billingId"
            className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3"
            defaultValue={addresses[0]?.id}
          >
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}, {a.district}/{a.city}
              </option>
            ))}
          </select>
        ) : null}

        <select
          name="billingType"
          className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3"
          defaultValue="individual"
        >
          <option value="individual">Bireysel fatura</option>
          <option value="corporate">Kurumsal fatura</option>
        </select>

        <textarea
          name="notes"
          rows={2}
          placeholder="Sipariş notu (opsiyonel)"
          className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2"
        />

        <button
          type="submit"
          disabled={pending}
          className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Ödeme alınıyor…" : "Mock ödeme ile siparişi tamamla"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeQuoteOrder } from "@/app/actions/quotes";
import { formatPrice } from "@/lib/format";
import type { QuoteCheckoutDetail } from "@/lib/quotes/types";
import type { AddressSnapshot } from "@/lib/orders/types";
import {
  BillingDetailsSection,
  buildBillingSnapshot,
  emptyBillingForm,
  validateBillingInput,
} from "@/components/checkout/BillingDetailsSection";

type Props = {
  detail: QuoteCheckoutDetail;
};

export function QuoteCheckoutClient({ detail }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [billingSame, setBillingSame] = useState(true);
  const [billingType, setBillingType] = useState<"individual" | "corporate">(
    "individual"
  );
  const [billingForm, setBillingForm] = useState(emptyBillingForm());
  const [notes, setNotes] = useState("");

  const subtotal = detail.unit_price * detail.quantity;
  const grandTotal = subtotal + detail.shipping_price;

  const deliverySnapshot: AddressSnapshot = {
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

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <BillingDetailsSection
          billingSame={billingSame}
          onBillingSameChange={setBillingSame}
          billingType={billingType}
          onBillingTypeChange={setBillingType}
          billingForm={billingForm}
          onBillingFormChange={(patch) =>
            setBillingForm((prev) => ({ ...prev, ...patch }))
          }
        />

        <textarea
          rows={2}
          placeholder="Sipariş notu (opsiyonel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2"
        />

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const billingError = validateBillingInput(
              billingSame,
              billingType,
              billingForm
            );
            if (billingError) {
              setError(billingError);
              return;
            }
            const billing = buildBillingSnapshot(
              billingSame,
              billingType,
              deliverySnapshot,
              billingForm
            );
            setError(null);
            start(async () => {
              const result = await placeQuoteOrder({
                sellerQuoteId: detail.quote_id,
                billingAddress: billing.billing_address,
                billingType: billing.billing_type,
                notes: notes.trim() || undefined,
              });
              if (!result.ok) setError(result.error);
              else router.push(`/hesabim/siparisler/${result.orderNumber}`);
            });
          }}
          className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Ödeme alınıyor…" : "Mock ödeme ile siparişi tamamla"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import {
  useCartStore,
  groupCartByShop,
  cartCheckoutItems,
  cartSubtotal,
} from "@/lib/cart/store";
import { estimateShopShipping, type AddressSnapshot } from "@/lib/orders/types";
import type { AddressRow } from "@/lib/orders/types";
import { TR_CITIES } from "@/lib/orders/tr-cities";
import { createAddress } from "@/app/actions/addresses";
import { placeOrder } from "@/app/actions/orders";

type CheckoutClientProps = {
  addresses: AddressRow[];
};

function addressToSnapshot(a: AddressRow): AddressSnapshot {
  return {
    title: a.title ?? undefined,
    full_name: a.full_name,
    phone: a.phone,
    city: a.city,
    district: a.district,
    address_line: a.address_line,
    postal_code: a.postal_code ?? undefined,
  };
}

export function CheckoutClient({ addresses }: CheckoutClientProps) {
  const router = useRouter();
  const clear = useCartStore((s) => s.clear);
  const allItems = useCartStore((s) => s.items);
  const items = cartCheckoutItems(allItems);
  const groups = groupCartByShop(items);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [shippingId, setShippingId] = useState(
    addresses.find((a) => a.is_default_shipping)?.id ?? addresses[0]?.id ?? ""
  );
  const [billingSame, setBillingSame] = useState(true);
  const [billingId, setBillingId] = useState(
    addresses.find((a) => a.is_default_billing)?.id ?? addresses[0]?.id ?? ""
  );
  const [billingType, setBillingType] = useState<"individual" | "corporate">(
    "individual"
  );
  const [showNewAddress, setShowNewAddress] = useState(!addresses.length);
  const [city, setCity] = useState(TR_CITIES[0]?.city ?? "");
  const districts = useMemo(
    () => TR_CITIES.find((c) => c.city === city)?.districts ?? [],
    [city]
  );

  const shopShipping = useMemo(() => {
    const map: Record<string, { amount: number; label: string; eta: string }> = {};
    for (const g of groups) {
      map[g.shopId] = estimateShopShipping(g.items);
    }
    return map;
  }, [groups]);

  const shippingTotal = Object.values(shopShipping).reduce(
    (s, x) => s + x.amount,
    0
  );
  const subtotal = cartSubtotal(items);
  const grand = subtotal + shippingTotal;

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-sm text-ink-muted">Checkout için sepetinizde ürün yok.</p>
        <Link href="/sepet" className="mt-4 inline-block text-sm font-semibold text-primary">
          Sepete dön
        </Link>
      </div>
    );
  }

  function selectedShipping(): AddressSnapshot | null {
    const a = addresses.find((x) => x.id === shippingId);
    return a ? addressToSnapshot(a) : null;
  }

  function selectedBilling(): AddressSnapshot | null {
    if (billingSame) return selectedShipping();
    const a = addresses.find((x) => x.id === billingId);
    return a ? addressToSnapshot(a) : null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <ol className="flex gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {[
            [1, "Adres"],
            [2, "Kargo"],
            [3, "Ödeme"],
          ].map(([n, label]) => (
            <li
              key={n}
              className={`rounded-lg px-3 py-1.5 ${
                step === n ? "bg-primary text-white" : "bg-background"
              }`}
            >
              {n}. {label}
            </li>
          ))}
        </ol>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {step === 1 ? (
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-ink">Teslimat adresi</h2>

            {addresses.length ? (
              <div className="mt-4 space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${
                      shippingId === a.id
                        ? "border-primary bg-primary-soft"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingId === a.id}
                      onChange={() => setShippingId(a.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold text-ink">
                        {a.title || a.full_name}
                      </span>
                      <span className="mt-0.5 block text-ink-muted">
                        {a.full_name} · {a.phone}
                        <br />
                        {a.address_line}, {a.district}/{a.city}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowNewAddress((v) => !v)}
              className="mt-4 text-sm font-semibold text-primary"
            >
              {showNewAddress ? "Formu gizle" : "+ Yeni adres ekle"}
            </button>

            {showNewAddress ? (
              <form
                className="mt-4 grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  setError(null);
                  startTransition(async () => {
                    const result = await createAddress({
                      title: String(fd.get("title") || ""),
                      full_name: String(fd.get("full_name") || ""),
                      phone: String(fd.get("phone") || ""),
                      city: String(fd.get("city") || ""),
                      district: String(fd.get("district") || ""),
                      address_line: String(fd.get("address_line") || ""),
                      postal_code: String(fd.get("postal_code") || ""),
                      is_default_shipping: true,
                    });
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setShippingId(result.id);
                    setShowNewAddress(false);
                    router.refresh();
                  });
                }}
              >
                <input name="title" placeholder="Adres başlığı" className="input-field h-10 rounded-lg border border-border bg-background px-3 text-sm sm:col-span-2" />
                <input name="full_name" required placeholder="Ad Soyad" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                <input name="phone" required placeholder="Telefon" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                <select
                  name="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {TR_CITIES.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
                <select
                  name="district"
                  required
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <textarea
                  name="address_line"
                  required
                  placeholder="Açık adres"
                  rows={2}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                />
                <input name="postal_code" placeholder="Posta kodu" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                <button
                  type="submit"
                  disabled={pending}
                  className="h-10 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                >
                  Kaydet
                </button>
              </form>
            ) : null}

            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-ink">Fatura tipi</h3>
              <div className="mt-2 flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={billingType === "individual"}
                    onChange={() => setBillingType("individual")}
                  />
                  Bireysel
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={billingType === "corporate"}
                    onChange={() => setBillingType("corporate")}
                  />
                  Kurumsal
                </label>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={(e) => setBillingSame(e.target.checked)}
                />
                Fatura adresi teslimat ile aynı
              </label>
              {!billingSame && addresses.length ? (
                <div className="mt-3 space-y-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${
                        billingId === a.id
                          ? "border-primary bg-primary-soft"
                          : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={billingId === a.id}
                        onChange={() => setBillingId(a.id)}
                      />
                      <span>
                        {a.full_name} — {a.district}/{a.city}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
              onClick={() => {
                if (!selectedShipping()) {
                  setError("Teslimat adresi seçin veya ekleyin.");
                  return;
                }
                if (!selectedBilling()) {
                  setError("Fatura adresi seçin.");
                  return;
                }
                setError(null);
                setStep(2);
              }}
            >
              Kargoya devam
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-ink">Kargo</h2>
            <div className="mt-4 space-y-4">
              {groups.map((g) => {
                const ship = shopShipping[g.shopId];
                return (
                  <div key={g.shopId} className="rounded-xl border border-border p-4">
                    <p className="font-semibold text-ink">{g.shopName}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {ship.label} · Tahmini: {ship.eta}
                    </p>
                    <p className="mt-2 text-sm font-bold text-ink">
                      {formatPrice(ship.amount)}
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-ink-muted">
                      {g.items.map((i) => (
                        <li key={i.productId}>
                          {i.title} × {i.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 rounded-xl border border-border px-5 text-sm font-semibold"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Ödemeye devam
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-ink">Ödeme</h2>
            <p className="mt-2 text-sm text-ink-muted">
              iyzico entegrasyonu Phase 8’de bağlanacak. Şimdilik mock ödeme ile
              sipariş oluşturulur.
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-border bg-background p-4 text-sm text-ink-muted">
              <p className="font-medium text-ink">iyzico ödeme formu (placeholder)</p>
              <p className="mt-1">Kart bilgileri bu aşamada toplanmaz.</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-11 rounded-xl border border-border px-5 text-sm font-semibold"
              >
                Geri
              </button>
              <button
                type="button"
                disabled={pending}
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                onClick={() => {
                  const shipping = selectedShipping();
                  const billing = selectedBilling();
                  if (!shipping || !billing) {
                    setError("Adres bilgileri eksik.");
                    return;
                  }
                  setError(null);
                  startTransition(async () => {
                    const shop_shipping: Record<string, { amount: number }> = {};
                    for (const [shopId, ship] of Object.entries(shopShipping)) {
                      shop_shipping[shopId] = { amount: ship.amount };
                    }
                    const result = await placeOrder({
                      items: items.map((i) => ({
                        product_id: i.productId,
                        quantity: i.quantity,
                      })),
                      shop_shipping,
                      shipping_address: shipping,
                      billing_address: {
                        ...billing,
                        ...(billingType === "corporate"
                          ? { company_name: billing.full_name }
                          : {}),
                      },
                      billing_type: billingType,
                      currency: items[0]?.currency ?? "TRY",
                      mock_payment: true,
                    });
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    clear();
                    router.push(`/siparis/${result.orderNumber}`);
                  });
                }}
              >
                {pending ? "İşleniyor…" : "Siparişi Onayla"}
              </button>
            </div>
          </section>
        ) : null}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-5 shadow-soft lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-bold text-ink">Özet</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-3 text-sm">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium text-ink">{item.title}</p>
                <p className="text-xs text-ink-muted">× {item.quantity}</p>
              </div>
              <p className="font-semibold">
                {formatPrice(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Ara toplam</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Kargo</dt>
            <dd>{formatPrice(shippingTotal)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Toplam</dt>
            <dd>{formatPrice(grand)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  useCartStore,
  groupCartByShop,
  cartSubtotal,
  cartHasQuoteRequired,
  cartCheckoutItems,
  cartItemCount,
} from "@/lib/cart/store";

export function CartPageClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const groups = groupCartByShop(items);
  const checkoutItems = cartCheckoutItems(items);
  const subtotal = cartSubtotal(checkoutItems);
  const hasQuote = cartHasQuoteRequired(items);
  const count = cartItemCount(items);

  if (!count) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink">Sepetiniz boş</p>
        <p className="mt-1 text-sm text-ink-muted">
          Alışverişe devam etmek için kategorilere göz atın.
        </p>
        <Link
          href="/kategoriler"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Kategorilere git
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {groups.map((group) => (
          <section
            key={group.shopId}
            className="overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <div className="border-b border-border bg-background/60 px-4 py-3">
              <Link
                href={`/magaza/${group.shopSlug}`}
                className="text-sm font-semibold text-ink hover:text-primary"
              >
                {group.shopName}
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {group.items.map((item) => (
                <li key={item.productId} className="flex gap-4 p-4">
                  <Link
                    href={`/urunler/${item.slug}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-background"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/urunler/${item.slug}`}
                      className="line-clamp-2 text-sm font-semibold text-ink hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    {item.brandName ? (
                      <p className="mt-0.5 text-xs text-ink-muted">{item.brandName}</p>
                    ) : null}
                    {item.shippingType === "QUOTE_REQUIRED" ? (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Nakliye teklifi gerekli — checkout’a dahil edilmez
                      </p>
                    ) : null}
                    {item.quantity > item.stock ? (
                      <p className="mt-1 text-xs text-red-600">
                        Stok yetersiz (max {item.stock})
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-ink-muted">
                        Adet
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) =>
                            setQuantity(
                              item.productId,
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className="h-8 w-16 rounded-lg border border-border bg-background px-2 text-sm text-ink"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Çıkar
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 font-display text-sm font-bold text-ink">
                    {formatPrice(item.unitPrice * item.quantity, item.currency)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-5 shadow-soft lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-bold text-ink">Sipariş özeti</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Ara toplam</dt>
            <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Kargo</dt>
            <dd className="font-medium text-ink">Checkout’ta hesaplanır</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="font-semibold text-ink">Genel toplam</dt>
            <dd className="font-display font-bold text-ink">{formatPrice(subtotal)}</dd>
          </div>
        </dl>
        {hasQuote ? (
          <p className="mt-3 text-xs text-amber-700">
            Teklif gereken ürünler ödeme adımına taşınmaz.
          </p>
        ) : null}
        {checkoutItems.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Checkout için uygun ürün yok.
          </p>
        ) : isLoggedIn ? (
          <Link
            href="/odeme"
            className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Siparişi Tamamla
          </Link>
        ) : (
          <Link
            href="/giris?redirect=/odeme"
            className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Giriş yap ve devam et
          </Link>
        )}
      </aside>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import { trackClientEvent } from "@/lib/analytics/client";
import { formatPrice } from "@/lib/format";
import { QuoteRequestModal } from "@/components/quotes/QuoteRequestModal";
import type { AddressRow } from "@/lib/orders/types";

type ProductDetailPurchaseProps = {
  product: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    price: number;
    compareAtPrice: number | null;
    currency: string;
    stock: number;
    shopId: string;
    shopName: string;
    shopSlug: string;
    sellerId: string;
    brandName: string | null;
    shippingType: string;
    shippingPrice: number | null;
  };
  quotesEnabled: boolean;
  addresses: AddressRow[];
  isLoggedIn: boolean;
};

export function ProductDetailPurchase({
  product,
  quotesEnabled,
  addresses,
  isLoggedIn,
}: ProductDetailPurchaseProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const inStock = product.stock > 0;
  const showQuote = product.shippingType === "QUOTE_REQUIRED" && quotesEnabled;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      currency: product.currency,
      stock: product.stock,
      shopId: product.shopId,
      shopName: product.shopName,
      shopSlug: product.shopSlug,
      sellerId: product.sellerId,
      brandName: product.brandName,
      shippingType: product.shippingType,
      shippingPrice: product.shippingPrice,
      quantity: qty,
    });
    void trackClientEvent("add_to_cart", {
      product_id: product.id,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const addToCartButton = (
    <button
      type="button"
      disabled={!inStock || showQuote}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 lg:w-full"
      onClick={handleAddToCart}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          Eklendi
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Sepete Ekle
        </>
      )}
    </button>
  );

  return (
    <>
      <div className="hidden lg:block">
        <div className="flex items-center gap-3">
          <label htmlFor="product-qty" className="text-sm font-medium text-ink">
            Adet
          </label>
          <input
            id="product-qty"
            type="number"
            min={1}
            max={Math.max(1, product.stock)}
            value={qty}
            onChange={(e) =>
              setQty(
                Math.max(1, Math.min(product.stock, Number(e.target.value) || 1))
              )
            }
            className="h-10 w-20 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <span
            className={`text-sm font-medium ${inStock ? "text-green-700" : "text-red-600"}`}
          >
            {inStock ? "Stokta" : "Stokta yok"}
          </span>
        </div>

        <div className="mt-4">
          {showQuote ? (
            <QuoteRequestModal
              productId={product.id}
              productTitle={product.title}
              maxQuantity={product.stock}
              addresses={addresses}
              isLoggedIn={isLoggedIn}
            />
          ) : (
            addToCartButton
          )}
        </div>

        {showQuote ? (
          <p className="mt-3 text-xs text-ink-muted">
            Bu ürün için nakliye ücreti satıcı teklifi ile belirlenir.
          </p>
        ) : null}
      </div>

      <div className="mt-4 lg:hidden">
        <div className="flex items-center gap-3">
          <label htmlFor="product-qty-mobile" className="text-sm font-medium text-ink">
            Adet
          </label>
          <input
            id="product-qty-mobile"
            type="number"
            min={1}
            max={Math.max(1, product.stock)}
            value={qty}
            onChange={(e) =>
              setQty(
                Math.max(1, Math.min(product.stock, Number(e.target.value) || 1))
              )
            }
            className="h-10 w-20 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <span
            className={`text-sm font-medium ${inStock ? "text-green-700" : "text-red-600"}`}
          >
            {inStock ? "Stokta" : "Stokta yok"}
          </span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-ink">
              {formatPrice(product.price, product.currency)}
            </p>
            {product.compareAtPrice != null &&
            product.compareAtPrice > product.price ? (
              <p className="text-xs text-ink-muted line-through">
                {formatPrice(product.compareAtPrice, product.currency)}
              </p>
            ) : null}
          </div>
          {showQuote ? (
            <QuoteRequestModal
              productId={product.id}
              productTitle={product.title}
              maxQuantity={product.stock}
              addresses={addresses}
              isLoggedIn={isLoggedIn}
            />
          ) : (
            <button
              type="button"
              disabled={!inStock}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleAddToCart}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" />
                  Eklendi
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Sepete Ekle
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

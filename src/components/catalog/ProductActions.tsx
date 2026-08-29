"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Truck, Check } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";

type ProductActionsProps = {
  product: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    price: number;
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
};

export function ProductActions({ product, quotesEnabled }: ProductActionsProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const inStock = product.stock > 0;
  const showQuote = product.shippingType === "QUOTE_REQUIRED" && quotesEnabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-sm font-medium text-ink">
          Adet
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={Math.max(1, product.stock)}
          value={qty}
          onChange={(e) =>
            setQty(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))
          }
          className="h-10 w-20 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <span
          className={`text-sm font-medium ${inStock ? "text-green-700" : "text-red-600"}`}
        >
          {inStock ? "Stokta" : "Stokta yok"}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={!inStock}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
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
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
          }}
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
        {showQuote ? (
          <Link
            href="#nakliye-teklifi"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-soft"
          >
            <Truck className="h-4 w-4" />
            Nakliye Teklifi Al
          </Link>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartShopGroup } from "@/lib/cart/types";

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  mergeItems: (incoming: CartItem[]) => void;
  replaceFromServer: (items: CartItem[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const qty = Math.max(1, item.quantity ?? 1);
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          const nextQty = Math.min(existing.stock, existing.quantity + qty);
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, ...item, quantity: nextQty, stock: item.stock }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              {
                ...item,
                quantity: Math.min(item.stock, qty),
              },
            ],
          });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      setQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(i.stock, quantity) }
              : i
          ),
        });
      },
      clear: () => set({ items: [] }),
      mergeItems: (incoming) => {
        const map = new Map(get().items.map((i) => [i.productId, i]));
        for (const item of incoming) {
          const prev = map.get(item.productId);
          if (prev) {
            map.set(item.productId, {
              ...item,
              quantity: Math.min(
                item.stock,
                Math.max(prev.quantity, item.quantity)
              ),
            });
          } else {
            map.set(item.productId, item);
          }
        }
        set({ items: Array.from(map.values()) });
      },
      replaceFromServer: (items) => set({ items }),
    }),
    {
      name: "tedarikcim_cart_v1",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export function groupCartByShop(items: CartItem[]): CartShopGroup[] {
  const map = new Map<string, CartShopGroup>();
  for (const item of items) {
    let group = map.get(item.shopId);
    if (!group) {
      group = {
        shopId: item.shopId,
        shopName: item.shopName,
        shopSlug: item.shopSlug,
        sellerId: item.sellerId,
        items: [],
        subtotal: 0,
        hasQuoteRequired: false,
      };
      map.set(item.shopId, group);
    }
    group.items.push(item);
    group.subtotal += item.unitPrice * item.quantity;
    if (item.shippingType === "QUOTE_REQUIRED") {
      group.hasQuoteRequired = true;
    }
  }
  return Array.from(map.values());
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function cartHasQuoteRequired(items: CartItem[]): boolean {
  return items.some((i) => i.shippingType === "QUOTE_REQUIRED");
}

export function cartCheckoutItems(items: CartItem[]): CartItem[] {
  return items.filter((i) => i.shippingType !== "QUOTE_REQUIRED");
}

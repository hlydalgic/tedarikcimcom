"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AppLink } from "@/components/ui/AppLink";
import { formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  getRecentlyViewed,
  pruneRecentlyViewed,
  type RecentlyViewedItem,
} from "@/lib/catalog/recently-viewed";

export function RecentlyViewedStrip({ title = "Son görüntülenenler" }: { title?: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const stored = getRecentlyViewed();
    if (!stored.length) return;
    let cancelled = false;

    void (async () => {
      // Explicit status filters: RLS also exposes inactive products to their owner/admins.
      const { data, error } = await createClient()
        .from("products")
        .select("id")
        .in(
          "id",
          stored.map((item) => item.id)
        )
        .eq("status", "ACTIVE")
        .is("archived_at", null);

      if (cancelled) return;
      if (error) {
        setItems(stored);
        return;
      }
      setItems(pruneRecentlyViewed(new Set((data ?? []).map((row) => row.id as string))));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
      <h2 className="font-display text-xl font-bold text-ink md:text-2xl">{title}</h2>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <AppLink
            key={item.id}
            href={`/urunler/${item.slug}`}
            className="flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary/30 hover:shadow-soft"
          >
            <div className="relative aspect-square bg-background">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : null}
            </div>
            <div className="p-2.5">
              <p className="line-clamp-2 text-xs font-medium text-ink">{item.title}</p>
              <p className="mt-1 text-xs font-bold text-ink">
                {formatPrice(item.price, item.currency)}
              </p>
            </div>
          </AppLink>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { addRecentlyViewed } from "@/lib/catalog/recently-viewed";

type GalleryImage = {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary?: boolean;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  title: string;
  productMeta: {
    id: string;
    slug: string;
    price: number;
    currency: string;
  };
};

export function ProductGallery({ images, title, productMeta }: ProductGalleryProps) {
  const sorted = [...images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary)
  );
  const thumbs = sorted.slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = thumbs[activeIndex] ?? thumbs[0];

  useEffect(() => {
    addRecentlyViewed({
      id: productMeta.id,
      slug: productMeta.slug,
      title,
      imageUrl: active?.url ?? null,
      price: productMeta.price,
      currency: productMeta.currency,
    });
  }, [productMeta, active?.url, title]);

  if (!active) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-background text-sm text-ink-muted">
        Görsel yok
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="lg:hidden">
        <div
          ref={scrollRef}
          onScroll={() => {
            const container = scrollRef.current;
            if (!container || !container.clientWidth) return;
            const index = Math.round(container.scrollLeft / container.clientWidth);
            setActiveIndex(index);
          }}
          className="-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 scrollbar-hide"
        >
          {thumbs.map((img, index) => (
            <div
              key={img.id}
              className="relative aspect-square w-full shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-background"
              style={{ width: "min(100%, calc(100vw - 2rem))" }}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? title}
                fill
                className="object-cover"
                sizes="100vw"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        {thumbs.length > 1 ? (
          <div className="mt-2 flex justify-center gap-1.5">
            {thumbs.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition ${
                  index === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="hidden lg:block">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-background">
          <Image
            src={active.url}
            alt={active.alt_text ?? title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        {thumbs.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {thumbs.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-background transition ${
                  index === activeIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
                aria-label={`Görsel ${index + 1}`}
                aria-pressed={index === activeIndex}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text ?? title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

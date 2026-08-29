"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { addRecentlyViewed } from "@/lib/catalog/recently-viewed";

type GalleryImage = {
  id: string;
  url: string;
  alt_text: string | null;
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
  const sorted = [...images].sort((a, b) => {
    const aPrimary = "is_primary" in a ? (a as { is_primary?: boolean }).is_primary : false;
    const bPrimary = "is_primary" in b ? (b as { is_primary?: boolean }).is_primary : false;
    return Number(bPrimary) - Number(aPrimary);
  });

  const primary = sorted[0];
  const thumbs = sorted.slice(0, 6);

  useEffect(() => {
    addRecentlyViewed({
      id: productMeta.id,
      slug: productMeta.slug,
      title,
      imageUrl: primary?.url ?? null,
      price: productMeta.price,
      currency: productMeta.currency,
    });
  }, [productMeta, primary?.url, title]);

  if (!primary) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-background text-sm text-ink-muted">
        Görsel yok
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-background">
        <Image
          src={primary.url}
          alt={primary.alt_text ?? title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition group-hover:bg-ink/10 group-hover:opacity-100">
          <ZoomIn className="h-8 w-8 text-white drop-shadow" />
        </div>
      </div>
      {thumbs.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {thumbs.map((img) => (
            <div
              key={img.id}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-background"
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? title}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

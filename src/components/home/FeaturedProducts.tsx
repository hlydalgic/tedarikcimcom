import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { mockProducts } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";

export function FeaturedProducts() {
  return (
    <section
      id="one-cikanlar"
      className="border-y border-border/70 bg-surface"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Öne çıkan ürünler
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink-muted md:text-base">
              Doğrulanmış satıcılardan seçilmiş teknik ürünler.
            </p>
          </div>
          <Link
            href="/urunler"
            className="hidden text-sm font-semibold text-primary hover:text-primary-hover sm:inline"
          >
            Daha fazla
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockProducts.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:border-primary/25 hover:shadow-soft"
            >
              <Link href={`/urun/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-background">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                {product.badge ? (
                  <span className="absolute left-3 top-3 rounded-md bg-surface/95 px-2 py-1 text-[11px] font-semibold text-ink shadow-sm">
                    {product.badge}
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label="Favorilere ekle"
                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface/95 text-ink-muted opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-accent"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium text-ink-muted">{product.brand}</p>
                <Link href={`/urun/${product.slug}`}>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink transition group-hover:text-primary">
                    {product.title}
                  </h3>
                </Link>
                <p className="mt-1 text-xs text-ink-muted">{product.category}</p>

                <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                  <div>
                    <p className="font-display text-lg font-bold text-ink">
                      {formatPrice(product.price)}
                    </p>
                    {product.compareAtPrice ? (
                      <p className="text-xs text-ink-muted line-through">
                        {formatPrice(product.compareAtPrice)}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={`/urun/${product.slug}`}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
                  >
                    İncele
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

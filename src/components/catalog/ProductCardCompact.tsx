import Image from "next/image";
import type { CatalogProductListItem } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { ProductLink } from "@/components/catalog/ProductLink";

type ProductCardCompactProps = {
  product: CatalogProductListItem;
  searchQuery?: string;
};

export function ProductCardCompact({
  product,
  searchQuery,
}: ProductCardCompactProps) {
  const imageUrl =
    product.primary_image_url ??
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80";

  return (
    <article className="flex h-full w-[168px] flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <ProductLink
        href={`/urunler/${product.slug}`}
        searchQuery={searchQuery}
        productId={product.id}
        className="relative block aspect-square overflow-hidden bg-background"
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover"
          sizes="168px"
        />
      </ProductLink>

      <div className="flex flex-1 flex-col p-2.5">
        <ProductLink
          href={`/urunler/${product.slug}`}
          searchQuery={searchQuery}
          productId={product.id}
        >
          <h3 className="line-clamp-2 text-xs font-medium leading-snug text-ink">
            {product.title}
          </h3>
        </ProductLink>

        <p className="mt-1.5 font-display text-sm font-bold text-ink">
          {formatPrice(product.price, product.currency)}
        </p>

        <ProductLink
          href={`/urunler/${product.slug}`}
          searchQuery={searchQuery}
          productId={product.id}
          className="mt-2 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary-hover"
        >
          İncele
        </ProductLink>
      </div>
    </article>
  );
}

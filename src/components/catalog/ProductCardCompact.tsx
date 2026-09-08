import Image from "next/image";
import type { CatalogProductListItem } from "@/lib/catalog/types";
import { ProductCardBody } from "@/components/catalog/ProductCardBody";
import { ProductLink } from "@/components/catalog/ProductLink";

type ProductCardCompactProps = {
  product: CatalogProductListItem;
  searchQuery?: string;
  prefetch?: boolean;
};

export function ProductCardCompact({
  product,
  searchQuery,
  prefetch = true,
}: ProductCardCompactProps) {
  const inStock = product.stock > 0;
  const imageUrl =
    product.primary_image_url ??
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80";

  return (
    <article className="flex h-full w-[168px] flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <ProductLink
        href={`/urunler/${product.slug}`}
        searchQuery={searchQuery}
        productId={product.id}
        prefetch={prefetch}
        className="relative block aspect-square overflow-hidden bg-background"
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover"
          sizes="168px"
        />
        {!inStock ? (
          <span className="absolute left-2 top-2 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Stokta yok
          </span>
        ) : null}
      </ProductLink>

      <ProductCardBody
        product={product}
        searchQuery={searchQuery}
        compact
        prefetch={prefetch}
      />
    </article>
  );
}

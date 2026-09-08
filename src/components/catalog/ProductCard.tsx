import Image from "next/image";
import type { CatalogProductListItem } from "@/lib/catalog/types";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { ProductCardBody } from "@/components/catalog/ProductCardBody";
import { ProductLink } from "@/components/catalog/ProductLink";

type ProductCardProps = {
  product: CatalogProductListItem;
  favoritesEnabled?: boolean;
  initialFavorited?: boolean;
  searchQuery?: string;
};

export function ProductCard({
  product,
  favoritesEnabled = false,
  initialFavorited = false,
  searchQuery,
}: ProductCardProps) {
  const inStock = product.stock > 0;
  const imageUrl =
    product.primary_image_url ??
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:border-primary/25 hover:shadow-soft">
      <ProductLink
        href={`/urunler/${product.slug}`}
        searchQuery={searchQuery}
        productId={product.id}
        className="relative block aspect-[4/3] overflow-hidden bg-background"
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {!inStock ? (
          <span className="absolute left-3 top-3 rounded-md bg-ink/80 px-2 py-1 text-[11px] font-semibold text-white">
            Stokta yok
          </span>
        ) : null}
        {favoritesEnabled ? (
          <div className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100">
            <FavoriteButton
              productId={product.id}
              initialFavorited={initialFavorited}
              className="bg-surface/95 shadow-sm"
            />
          </div>
        ) : null}
      </ProductLink>

      <ProductCardBody
        product={product}
        searchQuery={searchQuery}
      />
    </article>
  );
}

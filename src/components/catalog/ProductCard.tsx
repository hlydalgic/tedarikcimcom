import Image from "next/image";
import type { CatalogProductListItem } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
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

      <div className="flex flex-1 flex-col p-4">
        {product.brand_name ? (
          <p className="text-xs font-medium text-ink-muted">{product.brand_name}</p>
        ) : null}
        <ProductLink
          href={`/urunler/${product.slug}`}
          searchQuery={searchQuery}
          productId={product.id}
        >
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink transition group-hover:text-primary">
            {product.title}
          </h3>
        </ProductLink>
        <ProductLink
          href={`/magaza/${product.shop_slug}`}
          className="mt-1 block text-xs text-ink-muted hover:text-primary"
        >
          {product.shop_name}
        </ProductLink>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="font-display text-lg font-bold text-ink">
              {formatPrice(product.price, product.currency)}
            </p>
            {product.compare_at_price != null &&
            product.compare_at_price > product.price ? (
              <p className="text-xs text-ink-muted line-through">
                {formatPrice(product.compare_at_price, product.currency)}
              </p>
            ) : null}
          </div>
          <ProductLink
            href={`/urunler/${product.slug}`}
            searchQuery={searchQuery}
            productId={product.id}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
          >
            İncele
          </ProductLink>
        </div>
      </div>
    </article>
  );
}

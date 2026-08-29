import type { CatalogProductListItem } from "@/lib/catalog/types";
import { ProductCard } from "@/components/catalog/ProductCard";

type ProductGridProps = {
  products: CatalogProductListItem[];
  favoritesEnabled?: boolean;
  favoriteIds?: Set<string>;
  columns?: "default" | "shop";
};

export function ProductGrid({
  products,
  favoritesEnabled = false,
  favoriteIds,
  columns = "default",
}: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink">Ürün bulunamadı</p>
        <p className="mt-1 text-sm text-ink-muted">
          Filtreleri temizleyerek tekrar deneyin.
        </p>
      </div>
    );
  }

  const gridClass =
    columns === "shop"
      ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          favoritesEnabled={favoritesEnabled}
          initialFavorited={favoriteIds?.has(product.id)}
        />
      ))}
    </div>
  );
}

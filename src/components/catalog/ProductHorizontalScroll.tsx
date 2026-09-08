import type { CatalogProductListItem } from "@/lib/catalog/types";
import { ProductCardCompact } from "@/components/catalog/ProductCardCompact";

type ProductHorizontalScrollProps = {
  products: CatalogProductListItem[];
  searchQuery?: string;
};

export function ProductHorizontalScroll({
  products,
  searchQuery,
}: ProductHorizontalScrollProps) {
  if (!products.length) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide md:hidden">
      <div className="flex gap-3 pb-1">
        {products.map((product) => (
          <div key={product.id} className="shrink-0">
            <ProductCardCompact product={product} searchQuery={searchQuery} />
          </div>
        ))}
      </div>
    </div>
  );
}

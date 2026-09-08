import type { CatalogProductListItem } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { ProductLink } from "@/components/catalog/ProductLink";

type ProductCardBodyProps = {
  product: CatalogProductListItem;
  searchQuery?: string;
  compact?: boolean;
};

export function ProductCardBody({
  product,
  searchQuery,
  compact = false,
}: ProductCardBodyProps) {
  const paddingClass = compact ? "p-2.5" : "p-4";
  const brandClass = compact
    ? "text-[10px] font-medium text-ink-muted"
    : "text-xs font-medium text-ink-muted";
  const titleClass = compact
    ? "line-clamp-2 text-xs font-semibold leading-snug text-ink"
    : "mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink transition group-hover:text-primary";
  const shopClass = compact
    ? "mt-0.5 block text-[10px] text-ink-muted hover:text-primary"
    : "mt-1 block text-xs text-ink-muted hover:text-primary";
  const attrClass = compact
    ? "text-[10px] leading-snug text-ink-muted"
    : "text-xs leading-snug text-ink-muted";
  const priceClass = compact
    ? "font-display text-sm font-bold text-ink"
    : "font-display text-lg font-bold text-ink";
  const compareClass = compact
    ? "text-[10px] text-ink-muted line-through"
    : "text-xs text-ink-muted line-through";
  const buttonClass = compact
    ? "inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary-hover"
    : "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover";

  return (
    <div className={`flex flex-1 flex-col ${paddingClass}`}>
      {product.brand_name ? (
        <p className={brandClass}>{product.brand_name}</p>
      ) : null}

      <ProductLink
        href={`/urunler/${product.slug}`}
        searchQuery={searchQuery}
        productId={product.id}
      >
        <h3 className={titleClass}>{product.title}</h3>
      </ProductLink>

      <ProductLink
        href={`/magaza/${product.shop_slug}`}
        className={shopClass}
      >
        {product.shop_name}
      </ProductLink>

      {product.card_attributes.length > 0 ? (
        <ul className={compact ? "mt-1.5 space-y-0.5" : "mt-2 space-y-1"}>
          {product.card_attributes.map((attr) => (
            <li
              key={`${attr.attribute_name}-${attr.display_value}-${attr.sort_order}`}
              className={attrClass}
            >
              <span className="font-medium text-ink">{attr.attribute_name}:</span>{" "}
              {attr.display_value}
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={
          compact
            ? "mt-auto space-y-2 pt-2"
            : "mt-auto flex items-end justify-between gap-2 pt-4"
        }
      >
        <div>
          <p className={priceClass}>
            {formatPrice(product.price, product.currency)}
          </p>
          {product.compare_at_price != null &&
          product.compare_at_price > product.price ? (
            <p className={compareClass}>
              {formatPrice(product.compare_at_price, product.currency)}
            </p>
          ) : null}
        </div>
        <ProductLink
          href={`/urunler/${product.slug}`}
          searchQuery={searchQuery}
          productId={product.id}
          className={buttonClass}
        >
          İncele
        </ProductLink>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import {
  getProductBySlug,
  getProductSpecs,
  getRelatedProducts,
  buildCategoryHref,
  getCategoryBreadcrumb,
} from "@/lib/catalog/queries";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { isProductFavorited } from "@/lib/favorites/queries";
import { formatPrice } from "@/lib/format";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { ProductActions } from "@/components/catalog/ProductActions";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ProductSpecsTable } from "@/components/catalog/ProductSpecsTable";
import { RecentlyViewedStrip } from "@/components/catalog/RecentlyViewedStrip";

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Ürün bulunamadı" };

  const settings = await getMarketplaceSettings();
  const description =
    product.description?.slice(0, 160) ?? settings.seo_description ?? undefined;

  return {
    title: `${product.title} | ${settings.marketplace_name}`,
    description,
    openGraph: {
      title: product.title,
      description,
      siteName: settings.marketplace_name,
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [specs, related, crumbs, features, favorited] = await Promise.all([
    getProductSpecs(product.id),
    getRelatedProducts(product.category_id, product.id),
    getCategoryBreadcrumb(product.category_id),
    getMarketplaceFeatures(),
    isProductFavorited(product.id),
  ]);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");
  const quotesEnabled = isFeatureEnabled(features, "quotes_enabled");

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <Breadcrumb
          items={[
            ...crumbs.map((c, i) => ({
              name: c.name,
              href:
                i < crumbs.length - 1
                  ? buildCategoryHref(crumbs.slice(0, i + 1))
                  : `/kategoriler/${product.category_slug}`,
            })),
            { name: product.title },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery
            images={product.images}
            title={product.title}
            productMeta={{
              id: product.id,
              slug: product.slug,
              price: product.price,
              currency: product.currency,
            }}
          />

          <div>
            {product.brand_name ? (
              <Link
                href={`/arama?q=${encodeURIComponent(product.brand_name)}`}
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                {product.brand_name}
              </Link>
            ) : null}

            <div className="mt-1 flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                {product.title}
              </h1>
              {favoritesEnabled ? (
                <FavoriteButton
                  productId={product.id}
                  initialFavorited={favorited}
                  className="shrink-0 border border-border bg-surface"
                />
              ) : null}
            </div>

            <div className="mt-4 flex items-end gap-3">
              <p className="font-display text-3xl font-bold text-ink">
                {formatPrice(product.price, product.currency)}
              </p>
              {product.compare_at_price != null &&
              product.compare_at_price > product.price ? (
                <p className="pb-1 text-lg text-ink-muted line-through">
                  {formatPrice(product.compare_at_price, product.currency)}
                </p>
              ) : null}
            </div>

            {product.sku ? (
              <p className="mt-2 text-xs text-ink-muted">SKU: {product.sku}</p>
            ) : null}

            <div className="mt-6">
              <ProductActions
                quotesEnabled={quotesEnabled}
                product={{
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  imageUrl: product.images[0]?.url ?? null,
                  price: product.price,
                  currency: product.currency,
                  stock: product.stock,
                  shopId: product.shop_id,
                  shopName: product.shop_name,
                  shopSlug: product.shop_slug,
                  sellerId: product.seller_id,
                  brandName: product.brand_name,
                  shippingType: product.shipping_type,
                  shippingPrice: product.shipping_price,
                }}
              />
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                {product.shop_logo_url ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-background">
                    <Image
                      src={product.shop_logo_url}
                      alt={product.shop_name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
                    {product.shop_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/magaza/${product.shop_slug}`}
                    className="font-semibold text-ink hover:text-primary"
                  >
                    {product.shop_name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                    {product.shop_rating_avg != null ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                        {product.shop_rating_avg.toFixed(1)}
                        <span>({product.shop_rating_count})</span>
                      </span>
                    ) : null}
                    <span>{product.shop_product_count} ürün</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {specs.length ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink">Teknik özellikler</h2>
            <div className="mt-4">
              <ProductSpecsTable specs={specs} />
            </div>
          </section>
        ) : null}

        {product.description ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink">Ürün açıklaması</h2>
            <div className="prose prose-sm mt-4 max-w-none text-ink-muted">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          </section>
        ) : null}

        {related.length ? (
          <section className="mt-14">
            <h2 className="font-display text-xl font-bold text-ink">İlgili ürünler</h2>
            <div className="mt-6">
              <ProductGrid
                products={related}
                favoritesEnabled={favoritesEnabled}
              />
            </div>
          </section>
        ) : null}
      </div>

      <RecentlyViewedStrip />
    </>
  );
}

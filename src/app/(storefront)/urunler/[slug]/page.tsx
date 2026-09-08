import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppLink } from "@/components/ui/AppLink";
import {
  getProductBySlug,
  getProductSpecs,
  getRelatedProducts,
  getCategoryBreadcrumb,
  attachCategoryHrefs,
} from "@/lib/catalog/queries";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { isProductFavorited } from "@/lib/favorites/queries";
import { listUserAddresses } from "@/lib/cart/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { ProductDetailPurchase } from "@/components/catalog/ProductDetailPurchase";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ProductSellerCard } from "@/components/catalog/ProductSellerCard";
import { ProductSpecsAccordion } from "@/components/catalog/ProductSpecsAccordion";
import { ProductSpecsTable } from "@/components/catalog/ProductSpecsTable";
import { RecentlyViewedStrip } from "@/components/catalog/RecentlyViewedStrip";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbListJsonLd,
  buildProductJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 60;

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Ürün bulunamadı" };

  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);
  const description =
    product.description?.slice(0, 160) ?? settings.seo_description ?? undefined;

  return buildPageMetadata({
    title: `${product.title} | ${settings.marketplace_name}`,
    description,
    siteName: settings.marketplace_name,
    canonicalPath: `/urunler/${params.slug}`,
    siteUrl,
    imageUrl: product.images[0]?.url ?? null,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [specs, related, categoryCrumbs, features, favorited, siteUrl] =
    await Promise.all([
      getProductSpecs(product.id),
      getRelatedProducts(product.category_id, product.id, 4),
      getCategoryBreadcrumb(product.category_id),
      getMarketplaceFeatures(),
      isProductFavorited(product.id),
      getSiteUrl(),
    ]);

  const crumbsWithHrefs = await attachCategoryHrefs(categoryCrumbs);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");
  const quotesEnabled = isFeatureEnabled(features, "quotes_enabled");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const addresses = user ? await listUserAddresses() : [];

  const productUrl = absoluteUrl(siteUrl, `/urunler/${product.slug}`);
  const breadcrumbItems = [
    { name: "Ana sayfa", href: "/" },
    ...crumbsWithHrefs.map((c) => ({
      name: c.name,
      href: c.href,
    })),
    { name: product.title },
  ];

  const productJsonLd = buildProductJsonLd({
    name: product.title,
    description: product.description,
    imageUrl: product.images[0]?.url,
    price: product.price,
    currency: product.currency,
    inStock: product.stock > 0,
    sku: product.sku,
    url: productUrl,
    sellerName: product.shop_name,
  });

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(breadcrumbItems, siteUrl);

  const purchaseProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    imageUrl: product.images[0]?.url ?? null,
    price: product.price,
    compareAtPrice: product.compare_at_price,
    currency: product.currency,
    stock: product.stock,
    shopId: product.shop_id,
    shopName: product.shop_name,
    shopSlug: product.shop_slug,
    sellerId: product.seller_id,
    brandName: product.brand_name,
    shippingType: product.shipping_type,
    shippingPrice: product.shipping_price,
  };

  return (
    <>
      <JsonLd data={[productJsonLd, breadcrumbJsonLd]} />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-6 lg:px-8 lg:pb-8">
        <Breadcrumb
          items={[
            ...crumbsWithHrefs.map((c) => ({
              name: c.name,
              href: c.href,
            })),
            { name: product.title },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
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
              <AppLink
                href={`/arama?q=${encodeURIComponent(product.brand_name)}`}
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                {product.brand_name}
              </AppLink>
            ) : null}

            <div className="mt-1 flex items-start justify-between gap-3">
              <h1 className="min-w-0 flex-1 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                {product.title}
              </h1>
              {favoritesEnabled ? (
                <FavoriteButton
                  productId={product.id}
                  initialFavorited={favorited}
                  className="shrink-0 border-0 bg-transparent shadow-none"
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
              <p className="mt-2 hidden text-xs text-ink-muted lg:block">
                SKU: {product.sku}
              </p>
            ) : null}

            <ProductDetailPurchase
              product={purchaseProduct}
              quotesEnabled={quotesEnabled}
              addresses={addresses}
              isLoggedIn={Boolean(user)}
            />

            <div className="mt-6">
              <ProductSellerCard
                shopName={product.shop_name}
                shopSlug={product.shop_slug}
                shopLogoUrl={product.shop_logo_url}
                shopRatingAvg={product.shop_rating_avg}
                shopRatingCount={product.shop_rating_count}
                shopProductCount={product.shop_product_count}
              />
            </div>

            {specs.length ? (
              <div className="mt-6 hidden border-t border-border pt-6 lg:block">
                <h2 className="mb-4 font-display text-lg font-bold text-ink">
                  Teknik özellikler
                </h2>
                <ProductSpecsTable specs={specs} />
              </div>
            ) : null}
          </div>
        </div>

        {specs.length ? (
          <div className="mt-6 lg:hidden">
            <ProductSpecsAccordion specs={specs} />
          </div>
        ) : null}

        {product.description ? (
          <section className="mt-10 lg:mt-14">
            <h2 className="font-display text-xl font-bold text-ink">
              Ürün açıklaması
            </h2>
            <div className="prose prose-sm mt-4 max-w-none text-ink-muted">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          </section>
        ) : null}

        {related.length ? (
          <section className="mt-10 lg:mt-14">
            <h2 className="font-display text-xl font-bold text-ink">
              Bu kategorideki diğer ürünler
            </h2>
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

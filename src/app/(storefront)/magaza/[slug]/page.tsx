import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { filterProducts, getShopBySlug } from "@/lib/catalog/queries";
import { parseFiltersFromSearchParams } from "@/lib/catalog/filters-url";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { listUserFavoriteIds } from "@/lib/favorites/queries";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";

type PageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

function toURLSearchParams(
  input: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);
  if (!shop) return { title: "Mağaza bulunamadı" };

  const settings = await getMarketplaceSettings();
  return {
    title: `${shop.name} | ${settings.marketplace_name}`,
    description: shop.description ?? undefined,
    openGraph: {
      title: shop.name,
      description: shop.description ?? undefined,
      siteName: settings.marketplace_name,
      images: shop.banner_url ? [{ url: shop.banner_url }] : undefined,
    },
  };
}

export default async function ShopPage({ params, searchParams }: PageProps) {
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();

  const urlParams = toURLSearchParams(searchParams);
  const { filters, sort, page } = parseFiltersFromSearchParams(urlParams, []);

  const [result, features, favoriteIds] = await Promise.all([
    filterProducts({
      shopId: shop.id,
      filters,
      sort,
      page,
      pageSize: 24,
    }),
    getMarketplaceFeatures(),
    listUserFavoriteIds(),
  ]);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");

  return (
    <div>
      <div className="relative h-40 overflow-hidden bg-ink md:h-52">
        {shop.banner_url ? (
          <Image
            src={shop.banner_url}
            alt=""
            fill
            className="object-cover opacity-80"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />
        )}
        <div className="absolute inset-0 bg-ink/30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="-mt-10 relative flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          {shop.logo_url ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-surface shadow-soft md:h-24 md:w-24">
              <Image
                src={shop.logo_url}
                alt={shop.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-surface bg-primary-soft text-xl font-bold text-primary shadow-soft md:h-24 md:w-24">
              {shop.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="pb-2">
            <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
              {shop.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              {shop.rating_avg != null ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  {shop.rating_avg.toFixed(1)} ({shop.rating_count})
                </span>
              ) : null}
              <span>{shop.product_count} ürün</span>
            </div>
            {shop.description ? (
              <p className="mt-3 max-w-3xl text-sm text-ink-muted">{shop.description}</p>
            ) : null}
          </div>
        </div>

        <div className="py-8">
          <Breadcrumb items={[{ name: shop.name }]} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">
                {result.total.toLocaleString("tr-TR")}
              </span>{" "}
              ürün
            </p>
            <SortSelect />
          </div>

          <ProductGrid
            products={result.items}
            favoritesEnabled={favoritesEnabled}
            favoriteIds={favoriteIds}
            columns="shop"
          />
          <Pagination page={page} pageSize={result.pageSize} total={result.total} />
        </div>
      </div>
    </div>
  );
}

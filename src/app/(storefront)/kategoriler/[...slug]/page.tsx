import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildCategoryHref,
  filterProducts,
  getCategoryBreadcrumb,
  getCategoryBySlugPath,
  getCategoryFilters,
} from "@/lib/catalog/queries";
import { parseFiltersFromSearchParams } from "@/lib/catalog/filters-url";
import { getMarketplaceFeatures, getMarketplaceSettings, isFeatureEnabled } from "@/lib/marketplace/settings";
import { listUserFavoriteIds } from "@/lib/favorites/queries";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SortSelect } from "@/components/catalog/SortSelect";

type PageProps = {
  params: { slug: string[] };
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
  const category = await getCategoryBySlugPath(params.slug);
  if (!category) return { title: "Kategori bulunamadı" };

  const settings = await getMarketplaceSettings();
  const title = category.seo_title ?? category.name;
  const description =
    category.seo_description ?? category.description ?? settings.seo_description;

  return {
    title: `${title} | ${settings.marketplace_name}`,
    description: description ?? undefined,
    openGraph: {
      title: `${title} | ${settings.marketplace_name}`,
      description: description ?? undefined,
      siteName: settings.marketplace_name,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const category = await getCategoryBySlugPath(params.slug);
  if (!category) notFound();

  const filterDefs = await getCategoryFilters(category.id);
  const urlParams = toURLSearchParams(searchParams);
  const { filters, sort, page } = parseFiltersFromSearchParams(urlParams, filterDefs);

  const [result, crumbs, features, favoriteIds] = await Promise.all([
    filterProducts({
      categoryId: category.id,
      filters,
      sort,
      page,
      pageSize: 24,
    }),
    getCategoryBreadcrumb(category.id),
    getMarketplaceFeatures(),
    listUserFavoriteIds(),
  ]);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <Breadcrumb
        items={crumbs.map((c, i) => ({
          name: c.name,
          href:
            i < crumbs.length - 1
              ? buildCategoryHref(crumbs.slice(0, i + 1))
              : undefined,
        }))}
      />

      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-2 max-w-3xl text-sm text-ink-muted md:text-base">
            {category.description}
          </p>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">
            {result.total.toLocaleString("tr-TR")}
          </span>{" "}
          sonuç
        </p>
        <SortSelect />
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="h-96 rounded-2xl bg-background animate-pulse" />}>
          <FilterSidebar filterDefs={filterDefs} />
        </Suspense>

        <div>
          <ProductGrid
            products={result.items}
            favoritesEnabled={favoritesEnabled}
            favoriteIds={favoriteIds}
          />
          <Pagination page={page} pageSize={result.pageSize} total={result.total} />
        </div>
      </div>
    </div>
  );
}

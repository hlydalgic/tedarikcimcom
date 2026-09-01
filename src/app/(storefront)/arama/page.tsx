import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getSearchCategoryFacets,
  getSearchFilters,
  searchProducts,
} from "@/lib/catalog/queries";
import { parseFiltersFromSearchParams } from "@/lib/catalog/filters-url";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { listUserFavoriteIds } from "@/lib/favorites/queries";
import type { CatalogSort } from "@/lib/catalog/types";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SearchCategorySidebar } from "@/components/catalog/SearchCategorySidebar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { SearchPageTracker } from "@/components/analytics/SearchPageTracker";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 300;

type PageProps = {
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

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const title = q ? `"${q}" arama sonuçları` : "Arama";

  return buildPageMetadata({
    title: `${title} | ${settings.marketplace_name}`,
    description: q ? `"${q}" için arama sonuçları` : settings.seo_description,
    siteName: settings.marketplace_name,
    canonicalPath: q ? `/arama?q=${encodeURIComponent(q)}` : "/arama",
    siteUrl,
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const categoryId =
    typeof searchParams.kategori === "string" ? searchParams.kategori : undefined;
  const page = Math.max(
    1,
    parseInt(typeof searchParams.sayfa === "string" ? searchParams.sayfa : "1", 10) || 1
  );
  const sortRaw = typeof searchParams.sira === "string" ? searchParams.sira : "relevance";
  const sort: CatalogSort =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "newest"
      ? sortRaw
      : "relevance";

  const hasQuery = q.length >= 2;
  const urlParams = toURLSearchParams(searchParams);

  const filterDefs = hasQuery
    ? await getSearchFilters(q, categoryId)
    : [];
  const { filters } = parseFiltersFromSearchParams(urlParams, filterDefs);

  const [categoryFacets, result, features, favoriteIds] = await Promise.all([
    hasQuery ? getSearchCategoryFacets(q) : Promise.resolve([]),
    hasQuery
      ? searchProducts({
          query: q,
          sort,
          page,
          pageSize: 24,
          categoryId,
          filters,
        })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 24 }),
    getMarketplaceFeatures(),
    listUserFavoriteIds(),
  ]);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {hasQuery ? (
        <SearchPageTracker query={q} resultCount={result.total} />
      ) : null}

      <Breadcrumb items={[{ name: "Arama" }]} />

      <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
        {q ? (
          <>
            &quot;{q}&quot; için sonuçlar
          </>
        ) : (
          "Arama"
        )}
      </h1>

      {!hasQuery ? (
        <p className="mt-4 text-sm text-ink-muted">
          Arama yapmak için en az 2 karakter girin.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">
                {result.total.toLocaleString("tr-TR")}
              </span>{" "}
              sonuç
            </p>
            <Suspense fallback={null}>
              <SortSelect includeRelevance />
            </Suspense>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
            <aside className="space-y-4">
              <Suspense fallback={null}>
                <SearchCategorySidebar
                  facets={categoryFacets}
                  query={q}
                  selectedCategoryId={categoryId}
                />
              </Suspense>
              {filterDefs.length > 0 ? (
                <Suspense
                  fallback={
                    <div className="h-64 animate-pulse rounded-2xl bg-background" />
                  }
                >
                  <FilterSidebar
                    filterDefs={filterDefs}
                    preserveParams={["q", "kategori", "sira"]}
                  />
                </Suspense>
              ) : null}
            </aside>

            <div>
              <ProductGrid
                products={result.items}
                favoritesEnabled={favoritesEnabled}
                favoriteIds={favoriteIds}
                searchQuery={q}
              />
              <Suspense fallback={null}>
                <Pagination
                  page={page}
                  pageSize={result.pageSize}
                  total={result.total}
                />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

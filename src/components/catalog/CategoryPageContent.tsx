import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  buildCategoryHref,
  filterProducts,
  getCategoryBreadcrumb,
  getCategoryBySlugPath,
  getCategoryFilters,
  getCategorySidebarContext,
  listActiveCategories,
} from "@/lib/catalog/queries";
import { parseFiltersFromSearchParams } from "@/lib/catalog/filters-url";
import {
  getMarketplaceFeatures,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { listUserFavoriteIds } from "@/lib/favorites/queries";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { CategoryCatalogLayout } from "@/components/catalog/CategoryCatalogLayout";
import { CategoryFilterTracker } from "@/components/analytics/CategoryFilterTracker";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SortSelect } from "@/components/catalog/SortSelect";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

type CategoryPageContentProps = {
  slug: string[];
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

export async function CategoryPageContent({
  slug,
  searchParams,
}: CategoryPageContentProps) {
  const category = await getCategoryBySlugPath(slug);
  if (!category) notFound();

  const filterDefs = await getCategoryFilters(category.id);
  const urlParams = toURLSearchParams(searchParams);
  const { filters, sort, page } = parseFiltersFromSearchParams(
    urlParams,
    filterDefs
  );

  const [result, crumbs, sidebarContext, allCategories, features, favoriteIds, siteUrl] =
    await Promise.all([
      filterProducts({
        categoryId: category.id,
        filters,
        sort,
        page,
        pageSize: 24,
        includeSubcategories: true,
      }),
      getCategoryBreadcrumb(category.id),
      getCategorySidebarContext(category),
      listActiveCategories(),
      getMarketplaceFeatures(),
      listUserFavoriteIds(),
      getSiteUrl(),
    ]);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");
  const categoryPath = `/kategoriler/${slug.join("/")}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(
    [
      { name: "Ana sayfa", href: "/" },
      ...crumbs.map((c, i) => ({
        name: c.name,
        href:
          i < crumbs.length - 1
            ? buildCategoryHref(crumbs.slice(0, i + 1))
            : categoryPath,
      })),
    ],
    siteUrl
  );

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <Suspense fallback={null}>
        <CategoryFilterTracker />
      </Suspense>

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

      <CategoryCatalogLayout
        sidebarContext={sidebarContext}
        allCategories={allCategories}
        filterDefs={filterDefs}
      >
        <ProductGrid
          products={result.items}
          favoritesEnabled={favoritesEnabled}
          favoriteIds={favoriteIds}
          prefetchFirst={8}
        />
        <Pagination page={page} pageSize={result.pageSize} total={result.total} />
      </CategoryCatalogLayout>
    </>
  );
}

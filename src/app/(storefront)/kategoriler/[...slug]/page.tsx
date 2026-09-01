import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildCategoryHref,
  filterProducts,
  getCategoryBreadcrumb,
  getCategoryBySlugPath,
  getCategoryFilters,
  getCategorySidebarContext,
} from "@/lib/catalog/queries";
import { parseFiltersFromSearchParams } from "@/lib/catalog/filters-url";
import { getMarketplaceFeatures, getMarketplaceSettings, isFeatureEnabled } from "@/lib/marketplace/settings";
import { listUserFavoriteIds } from "@/lib/favorites/queries";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { CategoryTreeSidebar } from "@/components/catalog/CategoryTreeSidebar";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SortSelect } from "@/components/catalog/SortSelect";
import { JsonLd } from "@/components/seo/JsonLd";
import { CategoryFilterTracker } from "@/components/analytics/CategoryFilterTracker";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 300;

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

  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);
  const title = category.seo_title ?? category.name;
  const description =
    category.seo_description ?? category.description ?? settings.seo_description;
  const canonicalPath = `/kategoriler/${params.slug.join("/")}`;

  return buildPageMetadata({
    title: `${title} | ${settings.marketplace_name}`,
    description,
    siteName: settings.marketplace_name,
    canonicalPath,
    siteUrl,
    imageUrl: category.image_url,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const category = await getCategoryBySlugPath(params.slug);
  if (!category) notFound();

  const filterDefs = await getCategoryFilters(category.id);
  const urlParams = toURLSearchParams(searchParams);
  const { filters, sort, page } = parseFiltersFromSearchParams(urlParams, filterDefs);

  const [result, crumbs, sidebarContext, features, favoriteIds, siteUrl] =
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
      getMarketplaceFeatures(),
      listUserFavoriteIds(),
      getSiteUrl(),
    ]);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");
  const categoryPath = `/kategoriler/${params.slug.join("/")}`;

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
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
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

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        <aside className="space-y-4">
          <CategoryTreeSidebar context={sidebarContext} />
          <Suspense
            fallback={
              <div className="h-96 animate-pulse rounded-2xl bg-background" />
            }
          >
            <FilterSidebar filterDefs={filterDefs} />
          </Suspense>
        </aside>

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

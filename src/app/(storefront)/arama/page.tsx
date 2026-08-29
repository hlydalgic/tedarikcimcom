import { Suspense } from "react";
import type { Metadata } from "next";
import { searchProducts } from "@/lib/catalog/queries";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { listUserFavoriteIds } from "@/lib/favorites/queries";
import type { CatalogSort } from "@/lib/catalog/types";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SortSelect } from "@/components/catalog/SortSelect";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const title = q ? `"${q}" arama sonuçları` : "Arama";
  return {
    title: `${title} | ${settings.marketplace_name}`,
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const page = Math.max(
    1,
    parseInt(typeof searchParams.sayfa === "string" ? searchParams.sayfa : "1", 10) || 1
  );
  const sortRaw = typeof searchParams.sira === "string" ? searchParams.sira : "relevance";
  const sort: CatalogSort =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "newest"
      ? sortRaw
      : "relevance";

  const [result, features, favoriteIds] = await Promise.all([
    q.length >= 2
      ? searchProducts({ query: q, sort, page, pageSize: 24 })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 24 }),
    getMarketplaceFeatures(),
    listUserFavoriteIds(),
  ]);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
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

      {q.length < 2 ? (
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

          <div className="mt-6">
            <ProductGrid
              products={result.items}
              favoritesEnabled={favoritesEnabled}
              favoriteIds={favoriteIds}
            />
            <Suspense fallback={null}>
              <Pagination page={page} pageSize={result.pageSize} total={result.total} />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { listFeaturedProducts } from "@/lib/catalog/queries";
import {
  getMarketplaceFeatures,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { listUserFavoriteIds } from "@/lib/favorites/queries";
import { ProductGrid } from "@/components/catalog/ProductGrid";

export async function FeaturedProducts() {
  const [products, features, favoriteIds] = await Promise.all([
    listFeaturedProducts(8),
    getMarketplaceFeatures(),
    listUserFavoriteIds(),
  ]);

  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");

  return (
    <section
      id="one-cikanlar"
      className="border-y border-border/70 bg-surface"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Öne çıkan ürünler
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink-muted md:text-base">
              Doğrulanmış satıcılardan seçilmiş teknik ürünler.
            </p>
          </div>
          <Link
            href="/kategoriler"
            className="hidden text-sm font-semibold text-primary hover:text-primary-hover sm:inline"
          >
            Daha fazla
          </Link>
        </div>

        <ProductGrid
          products={products}
          favoritesEnabled={favoritesEnabled}
          favoriteIds={favoriteIds}
        />
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { listUserFavorites } from "@/lib/favorites/queries";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return {
    title: `Favorilerim | ${settings.marketplace_name}`,
  };
}

export default async function FavoritesPage() {
  const features = await getMarketplaceFeatures();
  if (!isFeatureEnabled(features, "favorites_enabled")) {
    redirect("/hesabim/profil");
  }

  const favorites = await listUserFavorites();

  return (
    <div>
      <Breadcrumb items={[{ name: "Favorilerim" }]} />
      <h1 className="font-display text-2xl font-bold text-ink">Favorilerim</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Beğendiğiniz ürünleri buradan takip edebilirsiniz.
      </p>
      <div className="mt-8">
        {favorites.length ? (
          <ProductGrid products={favorites} favoritesEnabled />
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm font-medium text-ink">Henüz favori ürününüz yok</p>
            <p className="mt-1 text-sm text-ink-muted">
              Ürün kartlarındaki kalp ikonuna tıklayarak favorilere ekleyin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

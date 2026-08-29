import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import {
  getMarketplaceFeatures,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";

export default async function HesabimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("/hesabim/profil");
  const features = await getMarketplaceFeatures();
  const favoritesEnabled = isFeatureEnabled(features, "favorites_enabled");
  const quotesEnabled = isFeatureEnabled(features, "quotes_enabled");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <nav className="mb-8 flex flex-wrap gap-4 text-sm">
        <Link href="/hesabim/profil" className="font-semibold text-primary">
          Profil
        </Link>
        <Link href="/hesabim/siparisler" className="text-ink-muted hover:text-primary">
          Siparişler
        </Link>
        {quotesEnabled ? (
          <Link href="/hesabim/teklifler" className="text-ink-muted hover:text-primary">
            Teklifler
          </Link>
        ) : null}
        {favoritesEnabled ? (
          <Link href="/hesabim/favoriler" className="text-ink-muted hover:text-primary">
            Favoriler
          </Link>
        ) : null}
      </nav>
      {children}
    </div>
  );
}

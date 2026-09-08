import type { Metadata } from "next";
import { AppLink } from "@/components/ui/AppLink";
import { requireUser } from "@/lib/auth/require-user";
import {
  getMarketplaceFeatures,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

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
        <AppLink href="/hesabim/profil" className="font-semibold text-primary">
          Profil
        </AppLink>
        <AppLink href="/hesabim/siparisler" className="text-ink-muted hover:text-primary">
          Siparişler
        </AppLink>
        {quotesEnabled ? (
          <AppLink href="/hesabim/teklifler" className="text-ink-muted hover:text-primary">
            Teklifler
          </AppLink>
        ) : null}
        {favoritesEnabled ? (
          <AppLink href="/hesabim/favoriler" className="text-ink-muted hover:text-primary">
            Favoriler
          </AppLink>
        ) : null}
      </nav>
      {children}
    </div>
  );
}

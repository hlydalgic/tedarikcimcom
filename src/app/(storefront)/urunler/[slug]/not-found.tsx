import { PackageX } from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";
import { AppLink } from "@/components/ui/AppLink";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function ProductNotFound() {
  const settings = await getMarketplaceSettings();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center md:py-24">
      <BrandMark
        shortName={settings.short_name}
        logoUrl={settings.logo_url}
        className="text-2xl md:text-3xl"
      />

      <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <PackageX className="h-8 w-8" aria-hidden />
      </div>

      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        Ürün bulunamadı
      </h1>
      <p className="mt-3 text-sm text-ink-muted md:text-base">
        Aradığınız ürün artık mevcut değil veya kaldırılmış olabilir.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <AppLink
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Alışverişe Devam Et
        </AppLink>
        <AppLink
          href="/kategoriler"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:bg-background"
        >
          Kategorilere Göz At
        </AppLink>
      </div>
    </div>
  );
}

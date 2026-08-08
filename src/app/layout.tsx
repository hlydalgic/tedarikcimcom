import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Figtree, Outfit } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  getMarketplaceSettings,
  marketplaceCssVars,
} from "@/lib/marketplace/settings";
import "./globals.css";

const display = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const body = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  const title =
    settings.seo_title?.trim() || settings.marketplace_name || "Marketplace";
  const description =
    settings.seo_description?.trim() ||
    settings.tagline?.trim() ||
    undefined;

  return {
    title: {
      default: title,
      template: `%s | ${settings.short_name}`,
    },
    description,
    icons: settings.favicon_url
      ? { icon: settings.favicon_url }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getMarketplaceSettings();
  const cssVars = marketplaceCssVars(settings) as CSSProperties;

  return (
    <html
      lang={settings.default_locale || "tr"}
      className={`${display.variable} ${body.variable}`}
      style={cssVars}
    >
      <body className="min-h-screen bg-mesh font-sans text-ink">
        <Header
          branding={{
            shortName: settings.short_name,
            logoUrl: settings.logo_url,
          }}
        />
        <main>{children}</main>
        <Footer
          branding={{
            marketplaceName: settings.marketplace_name,
            shortName: settings.short_name,
            logoUrl: settings.logo_dark_url || settings.logo_url,
            tagline: settings.tagline,
            seoDescription: settings.seo_description,
          }}
        />
      </body>
    </html>
  );
}

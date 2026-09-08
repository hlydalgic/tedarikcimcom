import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Figtree, Outfit } from "next/font/google";
import {
  getMarketplaceSettings,
  marketplaceCssVars,
} from "@/lib/marketplace/settings";
import { IOS_SPLASH_SCREENS } from "@/lib/pwa/ios-splash";
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
    manifest: "/manifest.json",
    themeColor: "#0A4D8C",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "AhadaBuldum",
    },
    icons: settings.favicon_url
      ? {
          icon: settings.favicon_url,
          apple: "/icons/icon-192.png",
        }
      : {
          apple: "/icons/icon-192.png",
        },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A4D8C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="AhadaBuldum" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {IOS_SPLASH_SCREENS.map((screen) => (
          <link
            key={screen.href}
            rel="apple-touch-startup-image"
            href={screen.href}
            media={screen.media}
          />
        ))}
      </head>
      <body className="min-h-screen bg-mesh font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

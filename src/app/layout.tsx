import type { Metadata } from "next";
import { Figtree, Outfit } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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

export const metadata: Metadata = {
  title: {
    default: "tedarikcim — Türkiye'nin teknik ürünler pazaryeri",
    template: "%s | tedarikcim",
  },
  description:
    "Boru, vana, hırdavat ve altyapı malzemelerini doğrulanmış satıcılardan güvenle tedarik edin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-mesh font-sans text-ink">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

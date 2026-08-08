"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
  ChevronDown,
} from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";
import { mockNavCategories } from "@/lib/mock-data";

export type HeaderBranding = {
  shortName: string;
  logoUrl: string | null;
};

export function Header({ branding }: { branding: HeaderBranding }) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-5 md:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
          aria-label="Menüyü aç"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <BrandMark
          shortName={branding.shortName}
          logoUrl={branding.logoUrl}
          className="text-xl md:text-2xl"
        />

        <form
          className="relative mx-auto hidden min-w-0 flex-1 md:block"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <label htmlFor="header-search" className="sr-only">
            Ürün, marka veya kategori ara
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            id="header-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Boru, vana, hortum, marka veya SKU ara…"
            className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-28 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Ara
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-0.5 md:gap-1" aria-label="Hesap">
          <Link
            href="/hesabim"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink transition hover:bg-background"
          >
            <User className="h-5 w-5" />
            <span className="hidden lg:inline">Hesap</span>
          </Link>
          <Link
            href="/hesabim/favorilerim"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink transition hover:bg-background"
          >
            <Heart className="h-5 w-5" />
            <span className="hidden lg:inline">Favoriler</span>
          </Link>
          <Link
            href="/sepet"
            className="relative inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink transition hover:bg-background"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden lg:inline">Sepet</span>
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded bg-accent px-1 text-[10px] font-bold text-white">
              0
            </span>
          </Link>
        </nav>
      </div>

      <div className="border-t border-border/60 bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 md:px-6 lg:px-8">
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setCatsOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Kategoriler
              <ChevronDown className={`h-4 w-4 transition ${catsOpen ? "rotate-180" : ""}`} />
            </button>
            {catsOpen ? (
              <div className="absolute left-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
                {mockNavCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/kategori/${cat.slug}`}
                    className="block px-4 py-2.5 text-sm text-ink transition hover:bg-primary-soft"
                    onClick={() => setCatsOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {mockNavCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/kategori/${cat.slug}`}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-background hover:text-ink"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-2 md:hidden">
        <form className="relative" onSubmit={(e) => e.preventDefault()} role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün veya kategori ara…"
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </form>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Menüyü kapat"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-surface p-5 shadow-lift animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
              <BrandMark
                shortName={branding.shortName}
                logoUrl={branding.logoUrl}
                className="text-lg"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 hover:bg-background"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Kategoriler
            </p>
            <div className="flex flex-col gap-1">
              {mockNavCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/kategori/${cat.slug}`}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-primary-soft"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

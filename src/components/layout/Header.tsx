"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Heart,
  Menu,
  ShoppingCart,
  User,
  X,
  ChevronDown,
} from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";
import { CartBadge } from "@/components/cart/CartBadge";
import { SearchBar } from "@/components/catalog/SearchBar";
import type { NavCategory } from "@/lib/catalog/types";

export type HeaderBranding = {
  shortName: string;
  logoUrl: string | null;
};

type HeaderProps = {
  branding: HeaderBranding;
  navCategories: NavCategory[];
  favoritesEnabled: boolean;
};

function categoryHref(cat: NavCategory, all: NavCategory[]): string {
  const parts: string[] = [cat.slug];
  let current = cat;
  while (current.parent_id) {
    const parent = all.find((c) => c.id === current.parent_id);
    if (!parent) break;
    parts.unshift(parent.slug);
    current = parent;
  }
  return `/kategoriler/${parts.join("/")}`;
}

export function Header({ branding, navCategories, favoritesEnabled }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  const topNav = navCategories.filter((c) => !c.parent_id).slice(0, 8);

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

        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar />
        </div>

        <nav className="ml-auto flex items-center gap-0.5 md:gap-1" aria-label="Hesap">
          <Link
            href="/hesabim/profil"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink transition hover:bg-background"
          >
            <User className="h-5 w-5" />
            <span className="hidden lg:inline">Hesap</span>
          </Link>
          {favoritesEnabled ? (
            <Link
              href="/hesabim/favoriler"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink transition hover:bg-background"
            >
              <Heart className="h-5 w-5" />
              <span className="hidden lg:inline">Favoriler</span>
            </Link>
          ) : null}
          <Link
            href="/sepet"
            className="relative inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink transition hover:bg-background"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden lg:inline">Sepet</span>
            <CartBadge />
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
              <ChevronDown
                className={`h-4 w-4 transition ${catsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {catsOpen ? (
              <div className="absolute left-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
                <Link
                  href="/kategoriler"
                  className="block px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft"
                  onClick={() => setCatsOpen(false)}
                >
                  Tüm kategoriler
                </Link>
                {topNav.map((cat) => (
                  <Link
                    key={cat.id}
                    href={categoryHref(cat, navCategories)}
                    className="block px-4 py-2.5 text-sm text-ink transition hover:bg-primary-soft"
                    onClick={() => setCatsOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {topNav.map((cat) => (
            <Link
              key={cat.id}
              href={categoryHref(cat, navCategories)}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-background hover:text-ink"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-2 md:hidden">
        <SearchBar compact />
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
              {topNav.map((cat) => (
                <Link
                  key={cat.id}
                  href={categoryHref(cat, navCategories)}
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

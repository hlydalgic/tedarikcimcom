"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Menu, ShoppingCart, X } from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";
import { CartBadge } from "@/components/cart/CartBadge";
import { SearchBar } from "@/components/catalog/SearchBar";
import { HeaderUserMenu } from "@/components/layout/HeaderUserMenu";
import {
  CategoryMegaMenu,
  CategoryMobileNav,
} from "@/components/layout/CategoryMegaMenu";
import { buildNavCategoryHref } from "@/lib/catalog/category-href";
import type { HeaderUser } from "@/lib/auth/header-user";
import type { NavCategory } from "@/lib/catalog/types";

export type HeaderBranding = {
  shortName: string;
  logoUrl: string | null;
};

type HeaderProps = {
  branding: HeaderBranding;
  navCategories: NavCategory[];
  favoritesEnabled: boolean;
  user: HeaderUser | null;
};

export function Header({
  branding,
  navCategories,
  favoritesEnabled,
  user,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navStripRef = useRef<HTMLDivElement>(null);

  const topNav = navCategories.filter((c) => !c.parent_id).slice(0, 8);

  return (
    <header className="sticky top-0 z-[100] border-b border-border/80 bg-surface/95 backdrop-blur-md">
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

        <nav className="ml-auto flex items-center gap-1 md:gap-2" aria-label="Hesap">
          <HeaderUserMenu user={user} favoritesEnabled={favoritesEnabled} />
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

      <div
        ref={navStripRef}
        className="relative overflow-visible border-t border-border/60 bg-surface"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 md:px-6 lg:px-8">
          <CategoryMegaMenu
            categories={navCategories}
            navStripRef={navStripRef}
          />

          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {topNav.map((cat) => (
              <Link
                key={cat.id}
                href={buildNavCategoryHref(cat, navCategories)}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-background hover:text-ink"
              >
                {cat.name}
              </Link>
            ))}
          </div>
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
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-y-auto bg-surface p-5 shadow-lift animate-fade-in">
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
            <CategoryMobileNav
              categories={navCategories}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Store,
  User,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { HeaderUser } from "@/lib/auth/header-user";

type Props = {
  user: HeaderUser | null;
  favoritesEnabled: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function HeaderUserMenu({ user, favoritesEnabled }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/giris"
          className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm font-semibold text-ink transition hover:bg-background"
        >
          Giriş Yap
        </Link>
        <Link
          href="/kayit"
          className="inline-flex h-10 items-center rounded-lg bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Kayıt Ol
        </Link>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 max-w-[180px] items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink transition hover:bg-background"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials(user.displayName)}
        </span>
        <span className="hidden truncate lg:inline">{user.displayName}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {user.displayName}
            </p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>

          <MenuLink href="/hesabim" icon={User} onClick={() => setOpen(false)}>
            Hesabım
          </MenuLink>
          <MenuLink
            href="/hesabim/siparisler"
            icon={Package}
            onClick={() => setOpen(false)}
          >
            Siparişlerim
          </MenuLink>
          {favoritesEnabled ? (
            <MenuLink
              href="/hesabim/favoriler"
              icon={Heart}
              onClick={() => setOpen(false)}
            >
              Favorilerim
            </MenuLink>
          ) : null}
          {user.isSeller ? (
            <MenuLink href="/panel" icon={LayoutDashboard} onClick={() => setOpen(false)}>
              Satıcı paneli
            </MenuLink>
          ) : (
            <MenuLink href="/satici-ol" icon={Store} onClick={() => setOpen(false)}>
              Satıcı ol
            </MenuLink>
          )}

          <div className="mt-1 border-t border-border pt-1">
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition hover:bg-background"
              >
                <LogOut className="h-4 w-4 text-ink-muted" />
                Çıkış yap
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof User;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition hover:bg-background"
    >
      <Icon className="h-4 w-4 text-ink-muted" />
      {children}
    </Link>
  );
}

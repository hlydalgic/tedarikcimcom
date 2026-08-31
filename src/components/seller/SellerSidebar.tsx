"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Wallet,
  Store,
  LogOut,
  FileText,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { BrandMark } from "@/components/branding/BrandMark";

const NAV = [
  {
    label: "Dashboard",
    href: "/panel",
    icon: LayoutDashboard,
    match: (p: string) => p === "/panel",
  },
  {
    label: "Ürünlerim",
    href: "/panel/urunler",
    icon: Package,
    match: (p: string) =>
      p.startsWith("/panel/urunler") && !p.startsWith("/panel/urunler/ekle"),
  },
  {
    label: "Ürün Ekle",
    href: "/panel/urunler/ekle",
    icon: PlusCircle,
    match: (p: string) => p.startsWith("/panel/urunler/ekle"),
  },
  {
    label: "Siparişler",
    href: "/panel/siparisler",
    icon: ShoppingBag,
    match: (p: string) => p.startsWith("/panel/siparisler"),
  },
  {
    label: "Nakliye Teklifleri",
    href: "/panel/teklifler",
    icon: FileText,
    match: (p: string) => p.startsWith("/panel/teklifler"),
  },
  {
    label: "Hakediş",
    href: "/panel/hakedis",
    icon: Wallet,
    match: (p: string) => p.startsWith("/panel/hakedis"),
  },
  {
    label: "Mağaza Ayarları",
    href: "/panel/magaza",
    icon: Store,
    match: (p: string) => p.startsWith("/panel/magaza"),
  },
];

type Props = {
  shortName: string;
  shopName: string;
  email?: string;
};

export function SellerSidebar({ shortName, shopName, email }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-5">
        <BrandMark shortName={shortName} href="/panel" className="text-lg" />
        <p className="mt-1 truncate text-xs font-medium text-ink-muted">
          {shopName}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 p-3" aria-label="Satıcı paneli">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-primary-soft text-primary"
                  : "text-ink-muted hover:bg-background hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        {email ? (
          <p className="mb-3 truncate text-xs text-ink-muted">{email}</p>
        ) : null}
        <Link
          href="/"
          className="mb-1 block rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-background hover:text-ink"
        >
          Mağazaya dön
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-background hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Çıkış yap
          </button>
        </form>
      </div>
    </aside>
  );
}

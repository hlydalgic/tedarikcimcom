"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  SlidersHorizontal,
  Filter,
  Package,
  ShoppingBag,
  Store,
  Settings,
  Tag,
  Ruler,
  LogOut,
  FileText,
  Wallet,
  Users,
  BarChart3,
  ScrollText,
  RotateCcw,
  Search,
  LineChart,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { BrandMark } from "@/components/branding/BrandMark";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    match: (pathname: string) => pathname === "/admin",
  },
  {
    label: "Kategoriler",
    href: "/admin/kategoriler",
    icon: FolderTree,
    match: (pathname: string) => pathname.startsWith("/admin/kategoriler"),
  },
  {
    label: "Özellikler",
    href: "/admin/ozellikler",
    icon: SlidersHorizontal,
    match: (pathname: string) => pathname.startsWith("/admin/ozellikler"),
  },
  {
    label: "Filtreler",
    href: "/admin/filtreler",
    icon: Filter,
    match: (pathname: string) => pathname.startsWith("/admin/filtreler"),
  },
  {
    label: "Markalar",
    href: "/admin/markalar",
    icon: Tag,
    match: (pathname: string) => pathname.startsWith("/admin/markalar"),
  },
  {
    label: "Birimler",
    href: "/admin/birimler",
    icon: Ruler,
    match: (pathname: string) => pathname.startsWith("/admin/birimler"),
  },
  {
    label: "Ürünler",
    href: "/admin/urunler",
    icon: Package,
    match: (pathname: string) => pathname.startsWith("/admin/urunler"),
  },
  {
    label: "Siparişler",
    href: "/admin/siparisler",
    icon: ShoppingBag,
    match: (pathname: string) => pathname.startsWith("/admin/siparisler"),
  },
  {
    label: "Teklifler",
    href: "/admin/teklifler",
    icon: FileText,
    match: (pathname: string) => pathname.startsWith("/admin/teklifler"),
  },
  {
    label: "Satıcılar",
    href: "/admin/saticilar",
    icon: Store,
    match: (pathname: string) => pathname.startsWith("/admin/saticilar"),
  },
  {
    label: "Hakedişler",
    href: "/admin/hakedisler",
    icon: Wallet,
    match: (pathname: string) => pathname.startsWith("/admin/hakedisler"),
  },
  {
    label: "İadeler",
    href: "/admin/iadeler",
    icon: RotateCcw,
    match: (pathname: string) => pathname.startsWith("/admin/iadeler"),
  },
  {
    label: "Kullanıcılar",
    href: "/admin/kullanicilar",
    icon: Users,
    match: (pathname: string) => pathname.startsWith("/admin/kullanicilar"),
  },
  {
    label: "Raporlar",
    href: "/admin/raporlar",
    icon: BarChart3,
    match: (pathname: string) => pathname.startsWith("/admin/raporlar"),
  },
  {
    label: "Analitik",
    href: "/admin/analitik",
    icon: LineChart,
    match: (pathname: string) => pathname.startsWith("/admin/analitik"),
  },
  {
    label: "Arama analitiği",
    href: "/admin/arama-analitigi",
    icon: Search,
    match: (pathname: string) => pathname.startsWith("/admin/arama-analitigi"),
  },
  {
    label: "Loglar",
    href: "/admin/loglar",
    icon: ScrollText,
    match: (pathname: string) => pathname.startsWith("/admin/loglar"),
  },
  {
    label: "Ayarlar",
    href: "/admin/ayarlar",
    icon: Settings,
    match: (pathname: string) => pathname.startsWith("/admin/ayarlar"),
  },
];

type AdminSidebarProps = {
  shortName: string;
  email?: string;
};

export function AdminSidebar({ shortName, email }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-5">
        <BrandMark shortName={shortName} href="/admin" className="text-lg" />
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Admin
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 p-3" aria-label="Admin">
        {NAV_ITEMS.map((item) => {
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
        <div className="flex flex-col gap-1">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-background hover:text-ink"
          >
            Mağazaya dön
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-background hover:text-error"
            >
              <LogOut className="h-4 w-4" />
              Çıkış yap
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

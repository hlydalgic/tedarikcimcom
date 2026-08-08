import Link from "next/link";
import {
  FolderTree,
  SlidersHorizontal,
  Filter,
  Package,
} from "lucide-react";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

const QUICK_LINKS = [
  {
    href: "/admin/kategoriler",
    title: "Kategoriler",
    description: "Taxonomy ağacı ve kategori yönetimi",
    icon: FolderTree,
  },
  {
    href: "/admin/ozellikler",
    title: "Özellikler",
    description: "Dinamik attribute tanımları",
    icon: SlidersHorizontal,
  },
  {
    href: "/admin/filtreler",
    title: "Filtreler",
    description: "Kategori bazlı filter builder",
    icon: Filter,
  },
  {
    href: "/admin/urunler",
    title: "Ürünler",
    description: "Moderasyon ve katalog",
    icon: Package,
  },
];

export default async function AdminDashboardPage() {
  const settings = await getMarketplaceSettings();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-ink-muted md:text-base">
          {settings.marketplace_name} yönetim paneline hoş geldiniz. Category /
          Attribute / Filter Builder bir sonraki adımda burada bağlanacak.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/30 hover:shadow-soft"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-base font-semibold text-ink">
                {item.title}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

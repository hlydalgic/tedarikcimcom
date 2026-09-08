import { AppLink } from "@/components/ui/AppLink";
import { listNavCategories } from "@/lib/catalog/queries";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function CategoriesIndexPage() {
  const [categories, settings] = await Promise.all([
    listNavCategories(),
    getMarketplaceSettings(),
  ]);

  const roots = categories.filter((c) => !c.parent_id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-ink">Kategoriler</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        {settings.marketplace_name} üzerindeki tüm ürün kategorilerini keşfedin.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roots.map((cat) => {
          const children = categories.filter((c) => c.parent_id === cat.id);
          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-soft"
            >
              <AppLink
                href={cat.href}
                className="font-display text-lg font-semibold text-ink hover:text-primary"
              >
                {cat.name}
              </AppLink>
              {children.length ? (
                <ul className="mt-3 space-y-1.5">
                  {children.map((child) => (
                    <li key={child.id}>
                      <AppLink
                        href={child.href}
                        className="text-sm text-ink-muted transition hover:text-primary"
                      >
                        {child.name}
                      </AppLink>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

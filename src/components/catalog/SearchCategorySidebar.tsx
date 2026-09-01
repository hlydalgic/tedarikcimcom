"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SearchCategoryFacet } from "@/lib/catalog/types";

type SearchCategorySidebarProps = {
  facets: SearchCategoryFacet[];
  query: string;
  selectedCategoryId?: string;
};

export function SearchCategorySidebar({
  facets,
  query,
  selectedCategoryId,
}: SearchCategorySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!facets.length) return null;

  function selectCategory(categoryId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query);
    if (categoryId) {
      params.set("kategori", categoryId);
    } else {
      params.delete("kategori");
    }
    params.delete("sayfa");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <h2 className="mb-3 font-display text-base font-bold text-ink">
        Kategoriler
      </h2>
      <ul className="max-h-80 space-y-0.5 overflow-y-auto pr-1">
        <li>
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className={`block w-full rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-primary-soft ${
              !selectedCategoryId
                ? "font-semibold text-primary"
                : "text-ink hover:text-primary"
            }`}
          >
            Tümü
          </button>
        </li>
        {facets.map((facet) => {
          const isActive = selectedCategoryId === facet.category_id;
          return (
            <li key={facet.category_id}>
              <button
                type="button"
                onClick={() => selectCategory(facet.category_id)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-primary-soft ${
                  isActive
                    ? "font-semibold text-primary"
                    : "text-ink hover:text-primary"
                }`}
              >
                <span className="line-clamp-2">{facet.category_name}</span>
                <span className="shrink-0 text-xs text-ink-muted">
                  ({facet.product_count})
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

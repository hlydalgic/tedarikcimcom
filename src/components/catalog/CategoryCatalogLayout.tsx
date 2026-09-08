"use client";

import { Suspense, useMemo, useState } from "react";
import { List, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { CategoryFilterDefinition } from "@/lib/catalog/types";
import type { CategorySidebarContext } from "@/lib/catalog/category-href";
import {
  countActiveFilters,
  parseFiltersFromSearchParams,
} from "@/lib/catalog/filters-url";
import { CategoryTreeSidebar } from "@/components/catalog/CategoryTreeSidebar";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { BottomDrawer } from "@/components/ui/BottomDrawer";

type CategoryCatalogLayoutProps = {
  sidebarContext: CategorySidebarContext;
  filterDefs: CategoryFilterDefinition[];
  children: React.ReactNode;
};

export function CategoryCatalogLayout({
  sidebarContext,
  filterDefs,
  children,
}: CategoryCatalogLayoutProps) {
  const searchParams = useSearchParams();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    const { filters } = parseFiltersFromSearchParams(searchParams, filterDefs);
    return countActiveFilters(filters);
  }, [searchParams, filterDefs]);

  return (
    <>
      <div className="mb-4 flex gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setCategoryOpen(true)}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-ink transition hover:bg-background"
        >
          <List className="h-4 w-4" />
          Kategoriler
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-ink transition hover:bg-background"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrele
          {activeFilterCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        <aside className="hidden space-y-4 lg:block">
          <CategoryTreeSidebar context={sidebarContext} />
          <Suspense
            fallback={
              <div className="h-96 animate-pulse rounded-2xl bg-background" />
            }
          >
            <FilterSidebar filterDefs={filterDefs} />
          </Suspense>
        </aside>

        <div>{children}</div>
      </div>

      <BottomDrawer
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        title="Kategoriler"
      >
        <div className="px-4 py-4">
          <CategoryTreeSidebar
            context={sidebarContext}
            embedded
            onLinkClick={() => setCategoryOpen(false)}
          />
        </div>
      </BottomDrawer>

      <BottomDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtrele"
      >
        <Suspense
          fallback={
            <div className="h-48 animate-pulse bg-background px-4 py-4" />
          }
        >
          <FilterSidebar
            filterDefs={filterDefs}
            deferred
            embedded
            drawerOpen={filterOpen}
            onApplied={() => setFilterOpen(false)}
          />
        </Suspense>
      </BottomDrawer>
    </>
  );
}

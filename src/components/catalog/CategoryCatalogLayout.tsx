"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { List, SlidersHorizontal } from "lucide-react";
import type { CategoryFilterDefinition, NavCategory } from "@/lib/catalog/types";
import {
  buildCategorySidebarContext,
  buildNavCategoryHref,
  type CategorySidebarContext,
} from "@/lib/catalog/category-href";
import {
  countActiveFilters,
  parseFiltersFromSearchParams,
} from "@/lib/catalog/filters-url";
import { CategoryTreeSidebar } from "@/components/catalog/CategoryTreeSidebar";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { BottomDrawer } from "@/components/ui/BottomDrawer";

type CategoryCatalogLayoutProps = {
  sidebarContext: CategorySidebarContext;
  allCategories: NavCategory[];
  filterDefs: CategoryFilterDefinition[];
  children: React.ReactNode;
};

export function CategoryCatalogLayout({
  sidebarContext,
  allCategories,
  filterDefs,
  children,
}: CategoryCatalogLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftCategoryId, setDraftCategoryId] = useState(sidebarContext.currentId);

  useEffect(() => {
    if (categoryOpen) {
      setDraftCategoryId(sidebarContext.currentId);
    }
  }, [categoryOpen, sidebarContext.currentId]);

  const draftSidebarContext = useMemo(() => {
    const category = allCategories.find((item) => item.id === draftCategoryId);
    if (!category) return sidebarContext;
    return buildCategorySidebarContext(category, allCategories);
  }, [allCategories, draftCategoryId, sidebarContext]);

  const openCategoryDrawer = () => {
    setDraftCategoryId(sidebarContext.currentId);
    setCategoryOpen(true);
  };

  const closeCategoryDrawer = () => {
    setCategoryOpen(false);
  };

  const closeFilterDrawer = () => {
    setFilterOpen(false);
  };

  const applyCategory = () => {
    const category = allCategories.find((item) => item.id === draftCategoryId);
    if (!category) return;

    const href = category.href ?? buildNavCategoryHref(category, allCategories);
    closeCategoryDrawer();
    router.push(href);
  };

  const activeFilterCount = useMemo(() => {
    const { filters } = parseFiltersFromSearchParams(searchParams, filterDefs);
    return countActiveFilters(filters);
  }, [searchParams, filterDefs]);

  return (
    <>
      <div className="mb-4 flex gap-2 lg:hidden">
        <button
          type="button"
          onClick={openCategoryDrawer}
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
        onClose={closeCategoryDrawer}
        title="Kategoriler"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <CategoryTreeSidebar
              context={draftSidebarContext}
              embedded
              picker
              selectedId={draftCategoryId}
              onSelect={setDraftCategoryId}
            />
          </div>
          <div className="shrink-0 border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={applyCategory}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Uygula
            </button>
          </div>
        </div>
      </BottomDrawer>

      <BottomDrawer
        open={filterOpen}
        onClose={closeFilterDrawer}
        title="Filtrele"
      >
        <Suspense
          fallback={
            <div className="h-full animate-pulse bg-background px-4 py-4" />
          }
        >
          <FilterSidebar
            filterDefs={filterDefs}
            deferred
            embedded
            drawerOpen={filterOpen}
            onApplied={closeFilterDrawer}
          />
        </Suspense>
      </BottomDrawer>
    </>
  );
}

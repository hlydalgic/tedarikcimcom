"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type {
  AttributeFilterValue,
  CategoryFilterDefinition,
  ProductFilters,
} from "@/lib/catalog/types";
import {
  buildSearchParamsFromFilters,
  filterParamKey,
  hasActiveFilters,
  parseFiltersFromSearchParams,
} from "@/lib/catalog/filters-url";

type FilterSidebarProps = {
  filterDefs: CategoryFilterDefinition[];
};

function getOptionValues(
  filters: ProductFilters,
  attributeId: string
): string[] {
  const attr = filters.attributes?.[attributeId];
  if (attr?.type === "options" || attr?.type === "text") {
    return attr.values;
  }
  return [];
}

function FilterSection({
  title,
  defaultCollapsed,
  children,
}: {
  title: string;
  defaultCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);

  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-ink"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-ink-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="mt-3 space-y-2">{children}</div> : null}
    </div>
  );
}

export function FilterSidebar({ filterDefs }: FilterSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const { filters } = useMemo(
    () => parseFiltersFromSearchParams(searchParams, filterDefs),
    [searchParams, filterDefs]
  );

  const pushFilters = useCallback(
    (nextFilters: ProductFilters, sort?: string, page?: number) => {
      const current = parseFiltersFromSearchParams(searchParams, filterDefs);
      const params = buildSearchParamsFromFilters({
        filters: nextFilters,
        sort: (sort as typeof current.sort) ?? current.sort,
        page: page ?? 1,
        filterDefs,
      });
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, filterDefs]
  );

  function clearAll() {
    router.push(pathname);
  }

  function updateSystem(partial: Partial<ProductFilters>) {
    pushFilters({ ...filters, ...partial });
  }

  function updateAttribute(attributeId: string, value: AttributeFilterValue | undefined) {
    const attributes = { ...(filters.attributes ?? {}) };
    if (
      value === undefined ||
      (value.type === "options" && !value.values.length) ||
      (value.type === "text" && !value.values.length)
    ) {
      delete attributes[attributeId];
    } else {
      attributes[attributeId] = value;
    }
    pushFilters({ ...filters, attributes });
  }

  function toggleOption(
    attributeId: string,
    optionId: string,
    multi: boolean
  ) {
    const current = filters.attributes?.[attributeId];
    const existing =
      current?.type === "options" ? current.values : multi ? [] : [];
    let next: string[];
    if (multi) {
      next = existing.includes(optionId)
        ? existing.filter((v) => v !== optionId)
        : [...existing, optionId];
      updateAttribute(attributeId, { type: "options", values: next });
    } else {
      next = existing.includes(optionId) ? [] : [optionId];
      updateAttribute(attributeId, { type: "options", values: next });
    }
  }

  return (
    <aside className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-ink">Filtreler</h2>
        {hasActiveFilters(filters) ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
          >
            <X className="h-3.5 w-3.5" />
            Temizle
          </button>
        ) : null}
      </div>

      {filterDefs.map((def) => {
        const paramKey = filterParamKey(def);

        if (def.system_filter_key === "price") {
          return (
            <FilterSection
              key={def.id}
              title={def.label}
              defaultCollapsed={def.default_collapsed}
            >
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Min</span>
                  <input
                    type="number"
                    min={def.range_min ?? 0}
                    max={def.range_max ?? undefined}
                    defaultValue={filters.price_min ?? ""}
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                    onBlur={(e) =>
                      updateSystem({
                        price_min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Max</span>
                  <input
                    type="number"
                    min={def.range_min ?? 0}
                    max={def.range_max ?? undefined}
                    defaultValue={filters.price_max ?? ""}
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                    onBlur={(e) =>
                      updateSystem({
                        price_max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
              </div>
              {def.range_min != null && def.range_max != null ? (
                <p className="mt-2 text-xs text-ink-muted">
                  {def.range_min.toLocaleString("tr-TR")} –{" "}
                  {def.range_max.toLocaleString("tr-TR")} ₺
                </p>
              ) : null}
            </FilterSection>
          );
        }

        if (def.system_filter_key === "in_stock" || def.system_filter_key === "free_shipping") {
          const checked =
            def.system_filter_key === "in_stock"
              ? filters.in_stock === true
              : filters.free_shipping === true;
          return (
            <FilterSection
              key={def.id}
              title={def.label}
              defaultCollapsed={def.default_collapsed}
            >
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm text-ink">{def.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  onChange={(e) =>
                    updateSystem(
                      def.system_filter_key === "in_stock"
                        ? { in_stock: e.target.checked ? true : undefined }
                        : { free_shipping: e.target.checked ? true : undefined }
                    )
                  }
                />
              </label>
            </FilterSection>
          );
        }

        if (
          def.display_type === "TOGGLE" &&
          def.attribute_id &&
          !def.system_filter_key
        ) {
          const attrFilter = filters.attributes?.[def.attribute_id];
          const checked =
            attrFilter?.type === "boolean" && attrFilter.value === true;
          return (
            <FilterSection
              key={def.id}
              title={def.label}
              defaultCollapsed={def.default_collapsed}
            >
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm text-ink">Evet</span>
                <input
                  type="checkbox"
                  checked={checked}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  onChange={(e) =>
                    updateAttribute(def.attribute_id!, {
                      type: "boolean",
                      value: e.target.checked,
                    })
                  }
                />
              </label>
            </FilterSection>
          );
        }

        if (
          (def.display_type === "RANGE_SLIDER" || def.display_type === "MIN_MAX") &&
          def.attribute_id
        ) {
          const current = filters.attributes?.[def.attribute_id];
          const minVal = current?.type === "range" ? current.min : undefined;
          const maxVal = current?.type === "range" ? current.max : undefined;
          return (
            <FilterSection
              key={def.id}
              title={def.label}
              defaultCollapsed={def.default_collapsed}
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  defaultValue={minVal ?? ""}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                  onBlur={(e) =>
                    updateAttribute(def.attribute_id!, {
                      type: "range",
                      min: e.target.value ? Number(e.target.value) : undefined,
                      max: maxVal,
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Max"
                  defaultValue={maxVal ?? ""}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                  onBlur={(e) =>
                    updateAttribute(def.attribute_id!, {
                      type: "range",
                      min: minVal,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </FilterSection>
          );
        }

        if (def.display_type === "RADIO" && def.attribute_id) {
          const selected = getOptionValues(filters, def.attribute_id)[0];
          return (
            <FilterSection
              key={def.id}
              title={def.label}
              defaultCollapsed={def.default_collapsed}
            >
              {def.options.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-ink"
                >
                  <input
                    type="radio"
                    name={paramKey ?? def.id}
                    checked={selected === opt.id}
                    className="h-4 w-4 border-border text-primary focus:ring-primary/30"
                    onChange={() =>
                      toggleOption(def.attribute_id!, opt.id, false)
                    }
                  />
                  <span>{opt.label}</span>
                  {opt.count != null ? (
                    <span className="text-xs text-ink-muted">({opt.count})</span>
                  ) : null}
                </label>
              ))}
            </FilterSection>
          );
        }

        if (def.display_type === "COLOR_SWATCHES" && def.attribute_id) {
          const selected = getOptionValues(filters, def.attribute_id);
          return (
            <FilterSection
              key={def.id}
              title={def.label}
              defaultCollapsed={def.default_collapsed}
            >
              <div className="flex flex-wrap gap-2">
                {def.options.map((opt) => {
                  const active = selected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      title={opt.label}
                      aria-label={opt.label}
                      aria-pressed={active}
                      onClick={() => toggleOption(def.attribute_id!, opt.id, true)}
                      className={`h-8 w-8 rounded-lg border-2 transition ${
                        active ? "border-primary ring-2 ring-primary/20" : "border-border"
                      }`}
                      style={{
                        backgroundColor: opt.color_hex ?? "#e5e7eb",
                      }}
                    />
                  );
                })}
              </div>
            </FilterSection>
          );
        }

        const isSearchable =
          def.display_type === "SEARCHABLE_CHECKBOX_LIST" ||
          def.system_filter_key === "brand" ||
          def.system_filter_key === "seller";

        const isMulti =
          def.display_type === "CHECKBOX" ||
          def.display_type === "MULTI_SELECT" ||
          def.display_type === "SEARCHABLE_CHECKBOX_LIST" ||
          def.system_filter_key === "brand" ||
          def.system_filter_key === "seller";

        let selectedIds: string[] = [];
        if (def.system_filter_key === "brand") {
          selectedIds = filters.brand_ids ?? [];
        } else if (def.system_filter_key === "seller") {
          selectedIds = filters.shop_ids ?? [];
        } else if (def.system_filter_key === "rating") {
          selectedIds =
            filters.rating_min != null ? [String(filters.rating_min)] : [];
        } else if (def.attribute_id) {
          selectedIds = getOptionValues(filters, def.attribute_id);
        }

        const searchKey = def.id;
        const query = (searchQueries[searchKey] ?? "").toLowerCase();
        const visibleOptions = isSearchable
          ? def.options.filter((o) => o.label.toLowerCase().includes(query))
          : def.options;

        return (
          <FilterSection
            key={def.id}
            title={def.label}
            defaultCollapsed={def.default_collapsed}
          >
            {isSearchable ? (
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <input
                  type="search"
                  placeholder="Ara…"
                  value={searchQueries[searchKey] ?? ""}
                  onChange={(e) =>
                    setSearchQueries((prev) => ({
                      ...prev,
                      [searchKey]: e.target.value,
                    }))
                  }
                  className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-2 text-xs outline-none focus:border-primary"
                />
              </div>
            ) : null}

            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {visibleOptions.map((opt) => {
                const checked = selectedIds.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                      onChange={() => {
                        if (def.system_filter_key === "brand") {
                          const next = checked
                            ? (filters.brand_ids ?? []).filter((id) => id !== opt.id)
                            : [...(filters.brand_ids ?? []), opt.id];
                          updateSystem({
                            brand_ids: next.length ? next : undefined,
                          });
                        } else if (def.system_filter_key === "seller") {
                          const next = checked
                            ? (filters.shop_ids ?? []).filter((id) => id !== opt.id)
                            : [...(filters.shop_ids ?? []), opt.id];
                          updateSystem({
                            shop_ids: next.length ? next : undefined,
                          });
                        } else if (def.system_filter_key === "rating") {
                          updateSystem({
                            rating_min: checked ? undefined : Number(opt.value),
                          });
                        } else if (def.attribute_id) {
                          toggleOption(def.attribute_id, opt.id, isMulti);
                        }
                      }}
                    />
                    <span className="line-clamp-1 flex-1">{opt.label}</span>
                    {opt.count != null ? (
                      <span className="text-xs text-ink-muted">({opt.count})</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </FilterSection>
        );
      })}
    </aside>
  );
}

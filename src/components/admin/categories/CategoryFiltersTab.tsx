"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  addCategoryFilter,
  removeCategoryFilter,
  reorderCategoryFilter,
  updateCategoryFilter,
} from "@/app/actions/attributes";
import {
  FILTER_DISPLAY_TYPES,
  SYSTEM_FILTER_KEYS,
  defaultFilterDisplayType,
  defaultSystemFilterDisplay,
  type AttributeRow,
  type CategoryAttributeRow,
  type CategoryFilterRow,
  type FilterDisplayType,
  type SystemFilterKey,
} from "@/lib/attributes/types";

type Props = {
  categoryId: string;
  categoryFilters: CategoryFilterRow[];
  categoryAttributes: CategoryAttributeRow[];
  attributes: AttributeRow[];
  onMessage: (msg: string) => void;
  onError: (msg: string) => void;
};

export function CategoryFiltersTab({
  categoryId,
  categoryFilters,
  categoryAttributes,
  attributes,
  onMessage,
  onError,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [source, setSource] = useState<"attribute" | "system">("attribute");
  const [attributeId, setAttributeId] = useState("");
  const [systemKey, setSystemKey] = useState<SystemFilterKey>("price");
  const [displayType, setDisplayType] =
    useState<FilterDisplayType>("CHECKBOX");
  const [labelOverride, setLabelOverride] = useState("");
  const [defaultCollapsed, setDefaultCollapsed] = useState(false);

  const attrById = useMemo(() => {
    const map = new Map<string, AttributeRow>();
    attributes.forEach((a) => map.set(a.id, a));
    return map;
  }, [attributes]);

  const filters = useMemo(
    () =>
      categoryFilters
        .filter((f) => f.category_id === categoryId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [categoryFilters, categoryId]
  );

  const usedAttrIds = useMemo(
    () =>
      new Set(
        filters.filter((f) => f.attribute_id).map((f) => f.attribute_id!)
      ),
    [filters]
  );
  const usedSystemKeys = useMemo(
    () =>
      new Set(
        filters
          .filter((f) => f.system_filter_key)
          .map((f) => f.system_filter_key!)
      ),
    [filters]
  );

  const filterableAttrs = useMemo(() => {
    return categoryAttributes
      .filter((ca) => ca.category_id === categoryId && ca.is_active)
      .map((ca) => {
        const attr = attrById.get(ca.attribute_id);
        if (!attr) return null;
        const filterable = ca.override_filterable ?? attr.filterable;
        if (!filterable) return null;
        if (usedAttrIds.has(attr.id)) return null;
        return attr;
      })
      .filter(Boolean) as AttributeRow[];
  }, [categoryAttributes, categoryId, attrById, usedAttrIds]);

  const availableSystem = SYSTEM_FILTER_KEYS.filter(
    (s) => !usedSystemKeys.has(s.key)
  );

  const run = (fn: () => Promise<{ error?: string; success?: boolean }>) => {
    startTransition(async () => {
      const result = await fn();
      if (result.error) onError(result.error);
      else onMessage("Kaydedildi.");
    });
  };

  const filterLabel = (f: CategoryFilterRow) => {
    if (f.label_override) return f.label_override;
    if (f.system_filter_key) {
      return (
        SYSTEM_FILTER_KEYS.find((s) => s.key === f.system_filter_key)?.label ??
        f.system_filter_key
      );
    }
    if (f.attribute_id) {
      return attrById.get(f.attribute_id)?.name ?? "Attribute";
    }
    return "Filtre";
  };

  const onSourceAttributeChange = (id: string) => {
    setAttributeId(id);
    const attr = attrById.get(id);
    if (attr) setDisplayType(defaultFilterDisplayType(attr.type));
  };

  const onSourceSystemChange = (key: SystemFilterKey) => {
    setSystemKey(key);
    setDisplayType(defaultSystemFilterDisplay(key));
  };

  const addFilter = () => {
    run(async () => {
      const result = await addCategoryFilter({
        categoryId,
        attributeId: source === "attribute" ? attributeId : null,
        systemFilterKey: source === "system" ? systemKey : null,
        displayType,
        labelOverride: labelOverride || null,
        defaultCollapsed,
      });
      if (result.success) {
        setShowAdd(false);
        setAttributeId("");
        setLabelOverride("");
        setDefaultCollapsed(false);
      }
      return result;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink">{filters.length} filtre</p>
          <p className="text-xs text-ink-muted">
            PLP sidebar sırası — attribute + system filtreler
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Filtre ekle
        </button>
      </div>

      {showAdd ? (
        <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSource("attribute")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                source === "attribute"
                  ? "bg-primary text-white"
                  : "bg-surface text-ink-muted"
              }`}
            >
              Attribute
            </button>
            <button
              type="button"
              onClick={() => {
                setSource("system");
                setDisplayType(defaultSystemFilterDisplay(systemKey));
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                source === "system"
                  ? "bg-primary text-white"
                  : "bg-surface text-ink-muted"
              }`}
            >
              System
            </button>
          </div>

          {source === "attribute" ? (
            <select
              value={attributeId}
              onChange={(e) => onSourceAttributeChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            >
              <option value="">Filterable attribute seçin…</option>
              {filterableAttrs.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={systemKey}
              onChange={(e) =>
                onSourceSystemChange(e.target.value as SystemFilterKey)
              }
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            >
              {availableSystem.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Display type
              </label>
              <select
                value={displayType}
                onChange={(e) =>
                  setDisplayType(e.target.value as FilterDisplayType)
                }
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              >
                {FILTER_DISPLAY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Label override
              </label>
              <input
                value={labelOverride}
                onChange={(e) => setLabelOverride(e.target.value)}
                placeholder="Opsiyonel"
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={defaultCollapsed}
              onChange={(e) => setDefaultCollapsed(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Varsayılan kapalı (collapsed)
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="h-9 rounded-xl border border-border px-3 text-xs font-semibold"
            >
              İptal
            </button>
            <button
              type="button"
              disabled={
                pending ||
                (source === "attribute" && !attributeId) ||
                (source === "system" && availableSystem.length === 0)
              }
              onClick={addFilter}
              className="h-9 rounded-xl bg-primary px-4 text-xs font-semibold text-white disabled:opacity-60"
            >
              Ekle
            </button>
          </div>
        </div>
      ) : null}

      {filters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-muted">
          Henüz filtre yok. Attribute veya system filtre ekleyin.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {filters.map((f, index) => (
            <li
              key={f.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{filterLabel(f)}</span>
                  <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-muted">
                    {f.display_type}
                  </span>
                  {f.system_filter_key ? (
                    <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
                      System
                    </span>
                  ) : (
                    <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      Attribute
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Sıra: {f.sort_order}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={f.is_enabled}
                    disabled={pending}
                    onChange={(e) =>
                      run(() =>
                        updateCategoryFilter({
                          id: f.id,
                          isEnabled: e.target.checked,
                        })
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  Enabled
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={f.default_collapsed}
                    disabled={pending}
                    onChange={(e) =>
                      run(() =>
                        updateCategoryFilter({
                          id: f.id,
                          defaultCollapsed: e.target.checked,
                        })
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  Collapsed
                </label>
                <button
                  type="button"
                  disabled={pending || index === 0}
                  className="rounded p-1.5 text-ink-muted hover:bg-background disabled:opacity-30"
                  onClick={() =>
                    run(() =>
                      reorderCategoryFilter({ id: f.id, direction: "up" })
                    )
                  }
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={pending || index === filters.length - 1}
                  className="rounded p-1.5 text-ink-muted hover:bg-background disabled:opacity-30"
                  onClick={() =>
                    run(() =>
                      reorderCategoryFilter({ id: f.id, direction: "down" })
                    )
                  }
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded p-1.5 text-ink-muted hover:bg-background hover:text-error"
                  onClick={() => {
                    if (!window.confirm("Filtreyi kaldırmak istiyor musunuz?")) {
                      return;
                    }
                    run(() => removeCategoryFilter(f.id));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

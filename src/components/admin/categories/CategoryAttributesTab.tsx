"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  GitBranch,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  propagateAttribute,
  removeCategoryAttribute,
  reorderCategoryAttribute,
  updateCategoryAttribute,
} from "@/app/actions/attributes";
import { AttributeFormModal } from "@/components/admin/categories/AttributeFormModal";
import type {
  AttributeRow,
  CategoryAttributeRow,
  UnitRow,
} from "@/lib/attributes/types";

type Props = {
  categoryId: string;
  categoryAttributes: CategoryAttributeRow[];
  attributes: AttributeRow[];
  units: UnitRow[];
  onMessage: (msg: string) => void;
  onError: (msg: string) => void;
};

export function CategoryAttributesTab({
  categoryId,
  categoryAttributes,
  attributes,
  units,
  onMessage,
  onError,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<"create" | "assign" | "edit" | null>(null);
  const [editAttr, setEditAttr] = useState<AttributeRow | null>(null);

  const attrById = useMemo(() => {
    const map = new Map<string, AttributeRow>();
    attributes.forEach((a) => map.set(a.id, a));
    return map;
  }, [attributes]);

  const unitById = useMemo(() => {
    const map = new Map<string, UnitRow>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  const rows = useMemo(() => {
    return categoryAttributes
      .filter((ca) => ca.category_id === categoryId)
      .map((ca) => {
        const attr = attrById.get(ca.attribute_id);
        const sort =
          ca.override_sort_order ?? attr?.sort_order ?? Number.MAX_SAFE_INTEGER;
        return { ca, attr, sort };
      })
      .filter((r) => r.attr)
      .sort((a, b) => a.sort - b.sort || (a.attr!.name > b.attr!.name ? 1 : -1));
  }, [categoryAttributes, categoryId, attrById]);

  const assignedIds = useMemo(
    () => new Set(rows.map((r) => r.ca.attribute_id)),
    [rows]
  );

  const run = (fn: () => Promise<{ error?: string; success?: boolean }>) => {
    startTransition(async () => {
      const result = await fn();
      if (result.error) onError(result.error);
      else onMessage("Kaydedildi.");
    });
  };

  const effectiveRequired = (ca: CategoryAttributeRow, attr: AttributeRow) =>
    ca.override_required ?? attr.required;
  const effectiveFilterable = (ca: CategoryAttributeRow, attr: AttributeRow) =>
    ca.override_filterable ?? attr.filterable;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink">
            {rows.length} attribute
          </p>
          <p className="text-xs text-ink-muted">
            Bu kategoriye bağlı özellikler (local + inherited)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal("create")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Attribute ekle
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-muted">
          Bu kategoriye henüz attribute atanmamış.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {rows.map(({ ca, attr, sort }, index) => {
            if (!attr) return null;
            const unit = attr.unit_id ? unitById.get(attr.unit_id) : null;
            return (
              <li
                key={ca.id}
                className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center ${
                  !ca.is_active ? "opacity-50" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{attr.name}</span>
                    <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-muted">
                      {attr.type}
                    </span>
                    {ca.inherited ? (
                      <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        Inherited
                      </span>
                    ) : (
                      <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-success">
                        Local
                      </span>
                    )}
                    {!ca.is_active ? (
                      <span className="rounded bg-error/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-error">
                        Pasif
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-muted">
                    {unit ? (
                      <span>
                        Birim: {unit.symbol}
                      </span>
                    ) : null}
                    <span>
                      Sıra: {sort === Number.MAX_SAFE_INTEGER ? "—" : sort}
                    </span>
                    {effectiveRequired(ca, attr) ? (
                      <span className="font-semibold text-warning">Required</span>
                    ) : null}
                    {effectiveFilterable(ca, attr) ? (
                      <span className="font-semibold text-primary">
                        Filterable
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    title="Yukarı"
                    disabled={pending || index === 0}
                    className="rounded p-1.5 text-ink-muted hover:bg-background disabled:opacity-30"
                    onClick={() =>
                      run(() =>
                        reorderCategoryAttribute({ id: ca.id, direction: "up" })
                      )
                    }
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Aşağı"
                    disabled={pending || index === rows.length - 1}
                    className="rounded p-1.5 text-ink-muted hover:bg-background disabled:opacity-30"
                    onClick={() =>
                      run(() =>
                        reorderCategoryAttribute({
                          id: ca.id,
                          direction: "down",
                        })
                      )
                    }
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Düzenle"
                    className="rounded p-1.5 text-ink-muted hover:bg-background"
                    onClick={() => {
                      setEditAttr(attr);
                      setModal("edit");
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!ca.inherited ? (
                    <button
                      type="button"
                      title="Alt kategorilere uygula"
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-ink-muted hover:border-primary hover:text-primary"
                      onClick={() =>
                        run(() =>
                          propagateAttribute({
                            categoryId,
                            attributeId: attr.id,
                          })
                        )
                      }
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        Alt kategorilere uygula
                      </span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    title={ca.is_active ? "Devre dışı bırak" : "Aktifleştir"}
                    disabled={pending}
                    className="rounded p-1.5 text-ink-muted hover:bg-background"
                    onClick={() =>
                      run(() =>
                        updateCategoryAttribute({
                          id: ca.id,
                          isActive: !ca.is_active,
                        })
                      )
                    }
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Kaldır"
                    disabled={pending}
                    className="rounded p-1.5 text-ink-muted hover:bg-background hover:text-error"
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Bu attribute atamasını kaldırmak istiyor musunuz?"
                        )
                      ) {
                        return;
                      }
                      run(() => removeCategoryAttribute(ca.id));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal ? (
        <AttributeFormModal
          categoryId={categoryId}
          units={units}
          catalog={attributes}
          assignedAttributeIds={assignedIds}
          mode={modal === "edit" ? "edit" : modal === "assign" ? "assign" : "create"}
          editAttribute={modal === "edit" ? editAttr : null}
          onClose={() => {
            setModal(null);
            setEditAttr(null);
          }}
          onDone={(msg) => {
            setModal(null);
            setEditAttr(null);
            onMessage(msg ?? "Kaydedildi.");
          }}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

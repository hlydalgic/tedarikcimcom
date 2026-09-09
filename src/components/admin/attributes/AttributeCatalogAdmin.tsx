"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Pencil, Plus } from "lucide-react";
import {
  archiveAttribute,
  createGlobalAttribute,
  updateAttributeDefinition,
} from "@/app/actions/attributes";
import {
  AttributeForm,
  TYPE_LABELS,
  attributeFormStateFromAttribute,
  buildAttributeValidationRules,
  createEmptyAttributeFormState,
  needsAttributeOptions,
  serializeAttributeOptions,
  type AttributeFormState,
} from "@/components/admin/attributes/AttributeForm";
import type {
  AttributeOptionRow,
  AttributeRow,
  UnitRow,
} from "@/lib/attributes/types";

type Props = {
  attributes: AttributeRow[];
  units: UnitRow[];
  options: AttributeOptionRow[];
  usageCounts: Record<string, number>;
};

export function AttributeCatalogAdmin({
  attributes,
  units,
  options,
  usageCounts,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editAttr, setEditAttr] = useState<AttributeRow | null>(null);
  const [form, setForm] = useState<AttributeFormState>(
    createEmptyAttributeFormState()
  );

  const unitById = useMemo(() => {
    const map = new Map<string, UnitRow>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  const optionsByAttr = useMemo(() => {
    const map = new Map<string, AttributeOptionRow[]>();
    options.forEach((o) => {
      const list = map.get(o.attribute_id) ?? [];
      list.push(o);
      map.set(o.attribute_id, list);
    });
    return map;
  }, [options]);

  const openCreate = () => {
    setEditAttr(null);
    setForm(createEmptyAttributeFormState());
    setModal("create");
  };

  const openEdit = (attr: AttributeRow) => {
    setEditAttr(attr);
    setForm(
      attributeFormStateFromAttribute(attr, optionsByAttr.get(attr.id) ?? [])
    );
    setModal("edit");
  };

  const submit = () => {
    startTransition(async () => {
      setError(null);
      const validationRules = buildAttributeValidationRules(form);
      const optionPayload = needsAttributeOptions(form.type)
        ? serializeAttributeOptions(form)
        : undefined;

      if (modal === "edit" && editAttr) {
        if (
          form.type !== editAttr.type &&
          !window.confirm(
            `Attribute tipini ${editAttr.type} → ${form.type} olarak değiştirmek istiyor musunuz? Mevcut ürün değerleri etkilenebilir.`
          )
        ) {
          return;
        }

        const result = await updateAttributeDefinition({
          attributeId: editAttr.id,
          name: form.name,
          type: form.type,
          required: form.required,
          filterable: form.filterable,
          searchable: form.searchable,
          comparable: form.comparable,
          isVariantAttribute: form.isVariant,
          showOnCard: form.showOnCard,
          showOnDetail: form.showOnDetail,
          showInSpecs: form.showInSpecs,
          sortOrder: form.sortOrder,
          placeholder: form.placeholder || null,
          helpText: form.helpText || null,
          unitId: form.unitId || null,
          validationRules: {
            ...editAttr.validation_rules,
            ...validationRules,
          },
          options: optionPayload,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Attribute güncellendi.");
      } else {
        const result = await createGlobalAttribute({
          name: form.name,
          slug: form.slug,
          type: form.type,
          unitId: form.unitId || null,
          required: form.required,
          filterable: form.filterable,
          searchable: form.searchable,
          comparable: form.comparable,
          isVariantAttribute: form.isVariant,
          showOnCard: form.showOnCard,
          showOnDetail: form.showOnDetail,
          showInSpecs: form.showInSpecs,
          sortOrder: form.sortOrder,
          placeholder: form.placeholder || null,
          helpText: form.helpText || null,
          validationRules,
          trueLabel: form.trueLabel,
          falseLabel: form.falseLabel,
          options: optionPayload,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Attribute oluşturuldu.");
      }
      setModal(null);
      router.refresh();
    });
  };

  const onArchive = (attr: AttributeRow) => {
    if (!window.confirm(`"${attr.name}" arşivlensin mi?`)) return;
    startTransition(async () => {
      const result = await archiveAttribute(attr.id);
      if (result.error) setError(result.error);
      else {
        setMessage("Attribute arşivlendi.");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Özellikler</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Global attribute catalog — kategoriye bağımsız tanımlar
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni attribute
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          {message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Ad</th>
              <th className="px-4 py-3 font-semibold">Tip</th>
              <th className="px-4 py-3 font-semibold">Birim</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 font-semibold">Flags</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attributes.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-ink-muted"
                >
                  Henüz attribute yok.
                </td>
              </tr>
            ) : (
              attributes.map((attr) => {
                const unit = attr.unit_id
                  ? unitById.get(attr.unit_id)
                  : null;
                return (
                  <tr key={attr.id} className="hover:bg-background/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{attr.name}</p>
                      <p className="font-mono text-[11px] text-ink-muted">
                        {attr.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-muted">
                        {TYPE_LABELS[attr.type] ?? attr.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {unit ? unit.symbol : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {usageCounts[attr.id] ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {[
                        attr.required ? "req" : null,
                        attr.filterable ? "filter" : null,
                        attr.searchable ? "search" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded p-1.5 text-ink-muted hover:bg-background"
                          onClick={() => openEdit(attr)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded p-1.5 text-ink-muted hover:bg-background hover:text-error"
                          onClick={() => onArchive(attr)}
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setModal(null)} />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-base font-bold">
                {modal === "edit" ? "Attribute düzenle" : "Yeni attribute"}
              </h3>
              <button
                type="button"
                className="text-sm text-ink-muted"
                onClick={() => setModal(null)}
              >
                Kapat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <AttributeForm
                mode={modal}
                state={form}
                onChange={setForm}
                units={units}
                allowTypeChange
                originalType={editAttr?.type ?? null}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-10 rounded-xl border border-border px-4 text-sm font-semibold"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

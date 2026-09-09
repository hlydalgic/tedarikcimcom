"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  assignExistingAttribute,
  createAttributeAndAssign,
  updateAttributeDefinition,
} from "@/app/actions/attributes";
import {
  AttributeForm,
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
  categoryId: string;
  units: UnitRow[];
  catalog: AttributeRow[];
  options: AttributeOptionRow[];
  assignedAttributeIds: Set<string>;
  mode: "create" | "assign" | "edit";
  editAttribute?: AttributeRow | null;
  onClose: () => void;
  onDone: (message?: string) => void;
  onError: (message: string) => void;
};

export function AttributeFormModal({
  categoryId,
  units,
  catalog,
  options,
  assignedAttributeIds,
  mode: initialMode,
  editAttribute,
  onClose,
  onDone,
  onError,
}: Props) {
  const [mode, setMode] = useState<"create" | "assign" | "edit">(initialMode);
  const [pending, startTransition] = useTransition();
  const [assignId, setAssignId] = useState("");
  const [form, setForm] = useState<AttributeFormState>(() =>
    editAttribute
      ? attributeFormStateFromAttribute(
          editAttribute,
          options.filter((o) => o.attribute_id === editAttribute.id)
        )
      : createEmptyAttributeFormState()
  );

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === "edit" && editAttribute) {
      setForm(
        attributeFormStateFromAttribute(
          editAttribute,
          options.filter((o) => o.attribute_id === editAttribute.id)
        )
      );
    } else if (initialMode === "create") {
      setForm(createEmptyAttributeFormState());
    }
  }, [initialMode, editAttribute, options]);

  const availableCatalog = useMemo(
    () => catalog.filter((a) => !assignedAttributeIds.has(a.id)),
    [catalog, assignedAttributeIds]
  );

  const submit = () => {
    startTransition(async () => {
      if (mode === "assign") {
        if (!assignId) {
          onError("Bir attribute seçin.");
          return;
        }
        const result = await assignExistingAttribute({
          categoryId,
          attributeId: assignId,
        });
        if (result.error) onError(result.error);
        else onDone("Attribute atandı.");
        return;
      }

      const validationRules = buildAttributeValidationRules(form);
      const optionPayload = needsAttributeOptions(form.type)
        ? serializeAttributeOptions(form)
        : undefined;

      if (mode === "edit" && editAttribute) {
        if (
          form.type !== editAttribute.type &&
          !window.confirm(
            `Attribute tipini ${editAttribute.type} → ${form.type} olarak değiştirmek istiyor musunuz? Mevcut ürün değerleri etkilenebilir.`
          )
        ) {
          return;
        }

        const result = await updateAttributeDefinition({
          attributeId: editAttribute.id,
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
            ...editAttribute.validation_rules,
            ...validationRules,
          },
          options: optionPayload,
        });
        if (result.error) onError(result.error);
        else onDone("Attribute güncellendi.");
        return;
      }

      const result = await createAttributeAndAssign({
        categoryId,
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
      if (result.error) onError(result.error);
      else onDone("Attribute oluşturuldu ve atandı.");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-bold text-ink">
            {mode === "edit"
              ? "Attribute düzenle"
              : mode === "assign"
                ? "Mevcut attribute ekle"
                : "Yeni attribute"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-ink-muted hover:text-ink"
          >
            Kapat
          </button>
        </div>

        {mode !== "edit" ? (
          <div className="flex gap-1 border-b border-border px-5 pt-3">
            <button
              type="button"
              onClick={() => setMode("assign")}
              className={`border-b-2 px-3 py-2 text-xs font-semibold ${
                mode === "assign"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted"
              }`}
            >
              Katalogdan seç
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("create");
                setForm(createEmptyAttributeFormState());
              }}
              className={`border-b-2 px-3 py-2 text-xs font-semibold ${
                mode === "create"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted"
              }`}
            >
              Yeni oluştur
            </button>
          </div>
        ) : null}

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {mode === "assign" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Global attribute
              </label>
              <select
                value={assignId}
                onChange={(e) => setAssignId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">Seçin…</option>
                {availableCatalog.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
              {availableCatalog.length === 0 ? (
                <p className="mt-2 text-xs text-ink-muted">
                  Atanabilir attribute kalmadı. Yeni oluşturun.
                </p>
              ) : null}
            </div>
          ) : (
            <AttributeForm
              mode={mode === "edit" ? "edit" : "create"}
              state={form}
              onChange={setForm}
              units={units}
              allowTypeChange
              originalType={editAttribute?.type ?? null}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-border px-4 text-sm font-semibold"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

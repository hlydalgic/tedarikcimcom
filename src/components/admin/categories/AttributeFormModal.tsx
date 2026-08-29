"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  assignExistingAttribute,
  createAttributeAndAssign,
  updateAttributeDefinition,
} from "@/app/actions/attributes";
import {
  ATTRIBUTE_TYPES,
  slugifyAttributeName,
  type AttributeRow,
  type AttributeType,
  type UnitRow,
} from "@/lib/attributes/types";

type OptionDraft = { label: string; value: string; color_hex: string };

type Props = {
  categoryId: string;
  units: UnitRow[];
  catalog: AttributeRow[];
  assignedAttributeIds: Set<string>;
  mode: "create" | "assign" | "edit";
  editAttribute?: AttributeRow | null;
  onClose: () => void;
  onDone: (message?: string) => void;
  onError: (message: string) => void;
};

const TYPE_LABELS: Record<AttributeType, string> = {
  SELECT: "Seçim",
  MULTI_SELECT: "Çoklu seçim",
  BOOLEAN: "Evet/Hayır",
  NUMBER: "Sayı",
  NUMBER_WITH_UNIT: "Birimli sayı",
  RANGE: "Aralık",
  TEXT: "Metin",
  TEXTAREA: "Uzun metin",
  COLOR: "Renk",
  DATE: "Tarih",
  YEAR: "Yıl",
};

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border"
      />
      {label}
    </label>
  );
}

export function AttributeFormModal({
  categoryId,
  units,
  catalog,
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
  const [name, setName] = useState(editAttribute?.name ?? "");
  const [slug, setSlug] = useState(editAttribute?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(editAttribute));
  const [type, setType] = useState<AttributeType>(
    editAttribute?.type ?? "SELECT"
  );
  const [unitId, setUnitId] = useState(editAttribute?.unit_id ?? "");
  const [required, setRequired] = useState(editAttribute?.required ?? false);
  const [filterable, setFilterable] = useState(
    editAttribute?.filterable ?? false
  );
  const [searchable, setSearchable] = useState(
    editAttribute?.searchable ?? false
  );
  const [comparable, setComparable] = useState(
    editAttribute?.comparable ?? false
  );
  const [isVariant, setIsVariant] = useState(
    editAttribute?.is_variant_attribute ?? false
  );
  const [showOnCard, setShowOnCard] = useState(
    editAttribute?.show_on_card ?? false
  );
  const [showOnDetail, setShowOnDetail] = useState(
    editAttribute?.show_on_detail ?? true
  );
  const [showInSpecs, setShowInSpecs] = useState(
    editAttribute?.show_in_specs ?? true
  );
  const [sortOrder, setSortOrder] = useState(editAttribute?.sort_order ?? 0);
  const [placeholder, setPlaceholder] = useState(
    editAttribute?.placeholder ?? ""
  );
  const [helpText, setHelpText] = useState(editAttribute?.help_text ?? "");
  const [trueLabel, setTrueLabel] = useState(
    String(editAttribute?.validation_rules?.true_label ?? "Evet")
  );
  const [falseLabel, setFalseLabel] = useState(
    String(editAttribute?.validation_rules?.false_label ?? "Hayır")
  );
  const [min, setMin] = useState(
    String(editAttribute?.validation_rules?.min ?? "")
  );
  const [max, setMax] = useState(
    String(editAttribute?.validation_rules?.max ?? "")
  );
  const [decimal, setDecimal] = useState(
    String(editAttribute?.validation_rules?.decimal_places ?? "")
  );
  const [options, setOptions] = useState<OptionDraft[]>([
    { label: "", value: "", color_hex: "" },
  ]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const availableCatalog = useMemo(
    () => catalog.filter((a) => !assignedAttributeIds.has(a.id)),
    [catalog, assignedAttributeIds]
  );

  const needsOptions =
    type === "SELECT" || type === "MULTI_SELECT" || type === "COLOR";
  const needsNumeric =
    type === "NUMBER" || type === "RANGE" || type === "NUMBER_WITH_UNIT";

  const buildValidation = (): Record<string, unknown> => {
    const rules: Record<string, unknown> = {};
    if (type === "BOOLEAN") {
      rules.true_label = trueLabel;
      rules.false_label = falseLabel;
    }
    if (needsNumeric) {
      if (min !== "") rules.min = Number(min);
      if (max !== "") rules.max = Number(max);
      if (decimal !== "") rules.decimal_places = Number(decimal);
    }
    return rules;
  };

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

      if (mode === "edit" && editAttribute) {
        const result = await updateAttributeDefinition({
          attributeId: editAttribute.id,
          name,
          required,
          filterable,
          searchable,
          comparable,
          isVariantAttribute: isVariant,
          showOnCard,
          showOnDetail,
          showInSpecs,
          sortOrder,
          placeholder: placeholder || null,
          helpText: helpText || null,
          unitId: unitId || null,
          validationRules: {
            ...editAttribute.validation_rules,
            ...buildValidation(),
          },
        });
        if (result.error) onError(result.error);
        else onDone("Attribute güncellendi.");
        return;
      }

      const result = await createAttributeAndAssign({
        categoryId,
        name,
        slug,
        type,
        unitId: unitId || null,
        required,
        filterable,
        searchable,
        comparable,
        isVariantAttribute: isVariant,
        showOnCard,
        showOnDetail,
        showInSpecs,
        sortOrder,
        placeholder: placeholder || null,
        helpText: helpText || null,
        validationRules: buildValidation(),
        trueLabel,
        falseLabel,
        options: needsOptions
          ? options
              .filter((o) => o.label.trim() && o.value.trim())
              .map((o) => ({
                label: o.label.trim(),
                value: o.value.trim(),
                color_hex: o.color_hex || null,
              }))
          : undefined,
      });
      if (result.error) onError(result.error);
      else onDone("Attribute oluşturuldu ve atandı.");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
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
              onClick={() => setMode("create")}
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
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">Ad</label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slugTouched) {
                        setSlug(slugifyAttributeName(e.target.value));
                      }
                    }}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                {mode === "create" ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Slug
                      </label>
                      <input
                        value={slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setSlug(e.target.value);
                        }}
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Tip
                      </label>
                      <select
                        value={type}
                        onChange={(e) =>
                          setType(e.target.value as AttributeType)
                        }
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                      >
                        {ATTRIBUTE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {TYPE_LABELS[t]} ({t})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
              </div>

              {type === "BOOLEAN" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Pozitif label
                    </label>
                    <input
                      value={trueLabel}
                      onChange={(e) => setTrueLabel(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Negatif label
                    </label>
                    <input
                      value={falseLabel}
                      onChange={(e) => setFalseLabel(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    />
                  </div>
                </div>
              ) : null}

              {needsNumeric ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Min
                    </label>
                    <input
                      type="number"
                      value={min}
                      onChange={(e) => setMin(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Max
                    </label>
                    <input
                      type="number"
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Ondalık
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={decimal}
                      onChange={(e) => setDecimal(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    />
                  </div>
                </div>
              ) : null}

              {(type === "NUMBER_WITH_UNIT" ||
                type === "NUMBER" ||
                type === "RANGE") && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Birim
                  </label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Yok</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol}) — {u.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {needsOptions && mode === "create" ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink">Seçenekler</p>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        placeholder="Label"
                        value={opt.label}
                        onChange={(e) => {
                          const next = [...options];
                          next[idx] = {
                            ...opt,
                            label: e.target.value,
                            value:
                              opt.value ||
                              slugifyAttributeName(e.target.value),
                          };
                          setOptions(next);
                        }}
                        className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
                      />
                      <input
                        placeholder="value"
                        value={opt.value}
                        onChange={(e) => {
                          const next = [...options];
                          next[idx] = { ...opt, value: e.target.value };
                          setOptions(next);
                        }}
                        className="h-10 w-28 rounded-xl border border-border bg-background px-3 font-mono text-sm"
                      />
                      {type === "COLOR" ? (
                        <input
                          placeholder="#hex"
                          value={opt.color_hex}
                          onChange={(e) => {
                            const next = [...options];
                            next[idx] = {
                              ...opt,
                              color_hex: e.target.value,
                            };
                            setOptions(next);
                          }}
                          className="h-10 w-24 rounded-xl border border-border bg-background px-3 text-sm"
                        />
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary"
                    onClick={() =>
                      setOptions([
                        ...options,
                        { label: "", value: "", color_hex: "" },
                      ])
                    }
                  >
                    + Seçenek ekle
                  </button>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <Toggle
                  label="Required"
                  checked={required}
                  onChange={setRequired}
                />
                <Toggle
                  label="Filterable"
                  checked={filterable}
                  onChange={setFilterable}
                />
                <Toggle
                  label="Searchable"
                  checked={searchable}
                  onChange={setSearchable}
                />
                <Toggle
                  label="Comparable"
                  checked={comparable}
                  onChange={setComparable}
                />
                <Toggle
                  label="Variant attribute"
                  checked={isVariant}
                  onChange={setIsVariant}
                />
                <Toggle
                  label="Show on card"
                  checked={showOnCard}
                  onChange={setShowOnCard}
                />
                <Toggle
                  label="Show on detail"
                  checked={showOnDetail}
                  onChange={setShowOnDetail}
                />
                <Toggle
                  label="Show in specs"
                  checked={showInSpecs}
                  onChange={setShowInSpecs}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Sort order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Placeholder
                  </label>
                  <input
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Help text
                  </label>
                  <textarea
                    rows={2}
                    value={helpText}
                    onChange={(e) => setHelpText(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </>
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

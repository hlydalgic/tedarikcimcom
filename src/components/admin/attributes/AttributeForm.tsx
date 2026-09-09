"use client";

import {
  ATTRIBUTE_TYPES,
  slugifyAttributeName,
  type AttributeOptionRow,
  type AttributeRow,
  type AttributeType,
  type UnitRow,
} from "@/lib/attributes/types";

export type AttributeOptionDraft = {
  id?: string;
  label: string;
  value: string;
  color_hex: string;
};

export type AttributeFormState = {
  name: string;
  slug: string;
  slugTouched: boolean;
  type: AttributeType;
  unitId: string;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  comparable: boolean;
  isVariant: boolean;
  showOnCard: boolean;
  showOnDetail: boolean;
  showInSpecs: boolean;
  sortOrder: number;
  placeholder: string;
  helpText: string;
  trueLabel: string;
  falseLabel: string;
  min: string;
  max: string;
  decimal: string;
  options: AttributeOptionDraft[];
};

export const TYPE_LABELS: Record<AttributeType, string> = {
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

const EMPTY_OPTION: AttributeOptionDraft = {
  label: "",
  value: "",
  color_hex: "",
};

export function createEmptyAttributeFormState(): AttributeFormState {
  return {
    name: "",
    slug: "",
    slugTouched: false,
    type: "SELECT",
    unitId: "",
    required: false,
    filterable: false,
    searchable: false,
    comparable: false,
    isVariant: false,
    showOnCard: false,
    showOnDetail: true,
    showInSpecs: true,
    sortOrder: 0,
    placeholder: "",
    helpText: "",
    trueLabel: "Evet",
    falseLabel: "Hayır",
    min: "",
    max: "",
    decimal: "",
    options: [{ ...EMPTY_OPTION }],
  };
}

export function attributeFormStateFromAttribute(
  attr: AttributeRow,
  options: AttributeOptionRow[] = []
): AttributeFormState {
  const mapped = options
    .filter((o) => o.attribute_id === attr.id && o.status === "active")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((o) => ({
      id: o.id,
      label: o.label,
      value: o.value,
      color_hex: o.color_hex ?? "",
    }));

  return {
    name: attr.name,
    slug: attr.slug,
    slugTouched: true,
    type: attr.type,
    unitId: attr.unit_id ?? "",
    required: attr.required,
    filterable: attr.filterable,
    searchable: attr.searchable,
    comparable: attr.comparable,
    isVariant: attr.is_variant_attribute,
    showOnCard: attr.show_on_card,
    showOnDetail: attr.show_on_detail,
    showInSpecs: attr.show_in_specs,
    sortOrder: attr.sort_order,
    placeholder: attr.placeholder ?? "",
    helpText: attr.help_text ?? "",
    trueLabel: String(attr.validation_rules?.true_label ?? "Evet"),
    falseLabel: String(attr.validation_rules?.false_label ?? "Hayır"),
    min: String(attr.validation_rules?.min ?? ""),
    max: String(attr.validation_rules?.max ?? ""),
    decimal: String(attr.validation_rules?.decimal_places ?? ""),
    options: mapped.length ? mapped : [{ ...EMPTY_OPTION }],
  };
}

export function needsAttributeOptions(type: AttributeType) {
  return type === "SELECT" || type === "MULTI_SELECT" || type === "COLOR";
}

export function needsAttributeNumeric(type: AttributeType) {
  return type === "NUMBER" || type === "RANGE" || type === "NUMBER_WITH_UNIT";
}

export function needsAttributeUnit(type: AttributeType) {
  return type === "NUMBER_WITH_UNIT" || type === "NUMBER" || type === "RANGE";
}

export function buildAttributeValidationRules(
  state: AttributeFormState
): Record<string, unknown> {
  const rules: Record<string, unknown> = {};
  if (state.type === "BOOLEAN") {
    rules.true_label = state.trueLabel;
    rules.false_label = state.falseLabel;
  }
  if (needsAttributeNumeric(state.type)) {
    if (state.min !== "") rules.min = Number(state.min);
    if (state.max !== "") rules.max = Number(state.max);
    if (state.decimal !== "") rules.decimal_places = Number(state.decimal);
  }
  return rules;
}

export function serializeAttributeOptions(state: AttributeFormState) {
  return state.options
    .filter((o) => o.label.trim() && o.value.trim())
    .map((o) => ({
      id: o.id,
      label: o.label.trim(),
      value: o.value.trim(),
      color_hex: o.color_hex.trim() || null,
    }));
}

type Props = {
  mode: "create" | "edit";
  state: AttributeFormState;
  onChange: (next: AttributeFormState) => void;
  units: UnitRow[];
  /** When editing, type changes are allowed but show a warning. */
  allowTypeChange?: boolean;
  originalType?: AttributeType | null;
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

export function AttributeForm({
  mode,
  state,
  onChange,
  units,
  allowTypeChange = true,
  originalType = null,
}: Props) {
  const patch = (partial: Partial<AttributeFormState>) =>
    onChange({ ...state, ...partial });

  const typeChanged =
    mode === "edit" &&
    originalType != null &&
    state.type !== originalType;

  const showOptions = needsAttributeOptions(state.type);
  const showNumeric = needsAttributeNumeric(state.type);
  const showUnit = needsAttributeUnit(state.type);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">Ad</label>
          <input
            value={state.name}
            onChange={(e) => {
              const name = e.target.value;
              patch({
                name,
                slug: state.slugTouched
                  ? state.slug
                  : slugifyAttributeName(name),
              });
            }}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Slug
          </label>
          <input
            value={state.slug}
            readOnly={mode === "edit"}
            onChange={(e) =>
              patch({ slugTouched: true, slug: e.target.value })
            }
            className={`h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm ${
              mode === "edit" ? "cursor-not-allowed opacity-70" : ""
            }`}
          />
          {mode === "edit" ? (
            <p className="mt-1 text-[11px] text-ink-muted">
              Slug düzenlemede değiştirilemez.
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Tip
          </label>
          <select
            value={state.type}
            disabled={mode === "edit" && !allowTypeChange}
            onChange={(e) =>
              patch({ type: e.target.value as AttributeType })
            }
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {ATTRIBUTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]} ({t})
              </option>
            ))}
          </select>
          {mode === "edit" ? (
            <p className="mt-1 text-[11px] text-ink-muted">
              Tip değişikliği mevcut ürün değerlerini etkileyebilir.
            </p>
          ) : null}
        </div>
      </div>

      {typeChanged ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Tip {originalType} → {state.type} olarak değişecek. Ürünlerdeki mevcut
          değerler uyumsuz hale gelebilir.
        </div>
      ) : null}

      {state.type === "BOOLEAN" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Pozitif label
            </label>
            <input
              value={state.trueLabel}
              onChange={(e) => patch({ trueLabel: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Negatif label
            </label>
            <input
              value={state.falseLabel}
              onChange={(e) => patch({ falseLabel: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
        </div>
      ) : null}

      {showNumeric ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Min
            </label>
            <input
              type="number"
              value={state.min}
              onChange={(e) => patch({ min: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Max
            </label>
            <input
              type="number"
              value={state.max}
              onChange={(e) => patch({ max: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Ondalık
            </label>
            <input
              type="number"
              min={0}
              value={state.decimal}
              onChange={(e) => patch({ decimal: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
        </div>
      ) : null}

      {showUnit ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Birim
          </label>
          <select
            value={state.unitId}
            onChange={(e) => patch({ unitId: e.target.value })}
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
      ) : null}

      {showOptions ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Seçenekler</p>
          {state.options.map((opt, idx) => (
            <div key={opt.id ?? `new-${idx}`} className="flex gap-2">
              <input
                placeholder="Label"
                value={opt.label}
                onChange={(e) => {
                  const next = [...state.options];
                  next[idx] = {
                    ...opt,
                    label: e.target.value,
                    value: opt.value || slugifyAttributeName(e.target.value),
                  };
                  patch({ options: next });
                }}
                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                placeholder="value"
                value={opt.value}
                onChange={(e) => {
                  const next = [...state.options];
                  next[idx] = { ...opt, value: e.target.value };
                  patch({ options: next });
                }}
                className="h-10 w-28 rounded-xl border border-border bg-background px-3 font-mono text-sm"
              />
              {state.type === "COLOR" ? (
                <input
                  placeholder="#hex"
                  value={opt.color_hex}
                  onChange={(e) => {
                    const next = [...state.options];
                    next[idx] = { ...opt, color_hex: e.target.value };
                    patch({ options: next });
                  }}
                  className="h-10 w-24 rounded-xl border border-border bg-background px-3 text-sm"
                />
              ) : null}
              <button
                type="button"
                className="h-10 shrink-0 rounded-xl border border-border px-2 text-xs font-semibold text-error hover:bg-error/5"
                onClick={() => {
                  const next = state.options.filter((_, i) => i !== idx);
                  patch({
                    options: next.length ? next : [{ ...EMPTY_OPTION }],
                  });
                }}
              >
                Sil
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs font-semibold text-primary"
            onClick={() =>
              patch({ options: [...state.options, { ...EMPTY_OPTION }] })
            }
          >
            + Seçenek ekle
          </button>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          label="Required"
          checked={state.required}
          onChange={(v) => patch({ required: v })}
        />
        <Toggle
          label="Filterable"
          checked={state.filterable}
          onChange={(v) => patch({ filterable: v })}
        />
        <Toggle
          label="Searchable"
          checked={state.searchable}
          onChange={(v) => patch({ searchable: v })}
        />
        <Toggle
          label="Comparable"
          checked={state.comparable}
          onChange={(v) => patch({ comparable: v })}
        />
        <Toggle
          label="Variant attribute"
          checked={state.isVariant}
          onChange={(v) => patch({ isVariant: v })}
        />
        <Toggle
          label="Show on card"
          checked={state.showOnCard}
          onChange={(v) => patch({ showOnCard: v })}
        />
        <Toggle
          label="Show on detail"
          checked={state.showOnDetail}
          onChange={(v) => patch({ showOnDetail: v })}
        />
        <Toggle
          label="Show in specs"
          checked={state.showInSpecs}
          onChange={(v) => patch({ showInSpecs: v })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Sort order
          </label>
          <input
            type="number"
            value={state.sortOrder}
            onChange={(e) =>
              patch({ sortOrder: Number(e.target.value) || 0 })
            }
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Placeholder
          </label>
          <input
            value={state.placeholder}
            onChange={(e) => patch({ placeholder: e.target.value })}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Help text
          </label>
          <textarea
            rows={2}
            value={state.helpText}
            onChange={(e) => patch({ helpText: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

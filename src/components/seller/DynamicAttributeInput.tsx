"use client";

import type { SellerFormField } from "@/lib/seller/form-schema";

type Props = {
  field: SellerFormField;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function DynamicAttributeInput({ field, value, onChange }: Props) {
  const label = (
    <label className="mb-1.5 block text-sm font-medium text-ink">
      {field.name}
      {field.required ? <span className="text-error"> *</span> : null}
      {field.unit ? (
        <span className="ml-1 text-xs font-normal text-ink-muted">
          ({field.unit.symbol})
        </span>
      ) : null}
    </label>
  );

  const help = field.helpText ? (
    <p className="mt-1 text-xs text-ink-muted">{field.helpText}</p>
  ) : null;

  switch (field.type) {
    case "SELECT":
      return (
        <div>
          {label}
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value || null)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="">Seçin…</option>
            {field.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      );

    case "MULTI_SELECT": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div>
          {label}
          <div className="space-y-1 rounded-xl border border-border p-3">
            {field.options.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, o.id]);
                    else onChange(selected.filter((id) => id !== o.id));
                  }}
                  className="h-4 w-4 rounded border-border"
                />
                {o.label}
              </label>
            ))}
          </div>
          {help}
        </div>
      );
    }

    case "BOOLEAN": {
      const trueLabel = String(field.validationRules.true_label ?? "Evet");
      const falseLabel = String(field.validationRules.false_label ?? "Hayır");
      const checked = Boolean(value);
      return (
        <div>
          {label}
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold ${
              checked
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-ink-muted"
            }`}
          >
            {checked ? trueLabel : falseLabel}
          </button>
          {help}
        </div>
      );
    }

    case "NUMBER":
    case "NUMBER_WITH_UNIT":
    case "YEAR":
      return (
        <div>
          {label}
          <input
            type="number"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder={field.placeholder ?? undefined}
            step={
              field.validationRules.decimal_places
                ? 1 / 10 ** Number(field.validationRules.decimal_places)
                : undefined
            }
            min={
              field.validationRules.min != null
                ? Number(field.validationRules.min)
                : undefined
            }
            max={
              field.validationRules.max != null
                ? Number(field.validationRules.max)
                : undefined
            }
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          {help}
        </div>
      );

    case "RANGE": {
      const range = (value as { min?: number; max?: number }) ?? {};
      return (
        <div>
          {label}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={range.min ?? ""}
              onChange={(e) =>
                onChange({
                  ...range,
                  min: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={range.max ?? ""}
              onChange={(e) =>
                onChange({
                  ...range,
                  max: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          {help}
        </div>
      );
    }

    case "TEXTAREA":
      return (
        <div>
          {label}
          <textarea
            rows={4}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? undefined}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          {help}
        </div>
      );

    case "COLOR":
      return (
        <div>
          {label}
          <div className="flex gap-2">
            <select
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value || null)}
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="">Seçin…</option>
              {field.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            {field.options.find((o) => o.id === value)?.color_hex ? (
              <span
                className="h-11 w-11 rounded-xl border border-border"
                style={{
                  backgroundColor:
                    field.options.find((o) => o.id === value)?.color_hex ??
                    undefined,
                }}
              />
            ) : null}
          </div>
          {help}
        </div>
      );

    case "DATE":
      return (
        <div>
          {label}
          <input
            type="date"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value || null)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          {help}
        </div>
      );

    case "TEXT":
    default:
      return (
        <div>
          {label}
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? undefined}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          {help}
        </div>
      );
  }
}

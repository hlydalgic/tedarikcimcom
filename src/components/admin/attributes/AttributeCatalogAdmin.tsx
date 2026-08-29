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
  ATTRIBUTE_TYPES,
  slugifyAttributeName,
  type AttributeRow,
  type AttributeType,
  type UnitRow,
} from "@/lib/attributes/types";

type Props = {
  attributes: AttributeRow[];
  units: UnitRow[];
  usageCounts: Record<string, number>;
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

type OptionDraft = { label: string; value: string; color_hex: string };

export function AttributeCatalogAdmin({
  attributes,
  units,
  usageCounts,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editAttr, setEditAttr] = useState<AttributeRow | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [type, setType] = useState<AttributeType>("SELECT");
  const [unitId, setUnitId] = useState("");
  const [required, setRequired] = useState(false);
  const [filterable, setFilterable] = useState(false);
  const [searchable, setSearchable] = useState(false);
  const [comparable, setComparable] = useState(false);
  const [isVariant, setIsVariant] = useState(false);
  const [showOnCard, setShowOnCard] = useState(false);
  const [showOnDetail, setShowOnDetail] = useState(true);
  const [showInSpecs, setShowInSpecs] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [trueLabel, setTrueLabel] = useState("Evet");
  const [falseLabel, setFalseLabel] = useState("Hayır");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [decimal, setDecimal] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([
    { label: "", value: "", color_hex: "" },
  ]);

  const unitById = useMemo(() => {
    const map = new Map<string, UnitRow>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  const resetForm = (attr?: AttributeRow | null) => {
    if (attr) {
      setName(attr.name);
      setSlug(attr.slug);
      setSlugTouched(true);
      setType(attr.type);
      setUnitId(attr.unit_id ?? "");
      setRequired(attr.required);
      setFilterable(attr.filterable);
      setSearchable(attr.searchable);
      setComparable(attr.comparable);
      setIsVariant(attr.is_variant_attribute);
      setShowOnCard(attr.show_on_card);
      setShowOnDetail(attr.show_on_detail);
      setShowInSpecs(attr.show_in_specs);
      setSortOrder(attr.sort_order);
      setPlaceholder(attr.placeholder ?? "");
      setHelpText(attr.help_text ?? "");
      setTrueLabel(String(attr.validation_rules?.true_label ?? "Evet"));
      setFalseLabel(String(attr.validation_rules?.false_label ?? "Hayır"));
      setMin(String(attr.validation_rules?.min ?? ""));
      setMax(String(attr.validation_rules?.max ?? ""));
      setDecimal(String(attr.validation_rules?.decimal_places ?? ""));
    } else {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setType("SELECT");
      setUnitId("");
      setRequired(false);
      setFilterable(false);
      setSearchable(false);
      setComparable(false);
      setIsVariant(false);
      setShowOnCard(false);
      setShowOnDetail(true);
      setShowInSpecs(true);
      setSortOrder(0);
      setPlaceholder("");
      setHelpText("");
      setTrueLabel("Evet");
      setFalseLabel("Hayır");
      setMin("");
      setMax("");
      setDecimal("");
      setOptions([{ label: "", value: "", color_hex: "" }]);
    }
  };

  const openCreate = () => {
    resetForm(null);
    setEditAttr(null);
    setModal("create");
  };

  const openEdit = (attr: AttributeRow) => {
    resetForm(attr);
    setEditAttr(attr);
    setModal("edit");
  };

  const buildValidation = (): Record<string, unknown> => {
    const rules: Record<string, unknown> = {};
    if (type === "BOOLEAN") {
      rules.true_label = trueLabel;
      rules.false_label = falseLabel;
    }
    if (
      type === "NUMBER" ||
      type === "RANGE" ||
      type === "NUMBER_WITH_UNIT"
    ) {
      if (min !== "") rules.min = Number(min);
      if (max !== "") rules.max = Number(max);
      if (decimal !== "") rules.decimal_places = Number(decimal);
    }
    return rules;
  };

  const submit = () => {
    startTransition(async () => {
      setError(null);
      if (modal === "edit" && editAttr) {
        const result = await updateAttributeDefinition({
          attributeId: editAttr.id,
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
            ...editAttr.validation_rules,
            ...buildValidation(),
          },
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Attribute güncellendi.");
      } else {
        const needsOptions =
          type === "SELECT" || type === "MULTI_SELECT" || type === "COLOR";
        const result = await createGlobalAttribute({
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

  const needsOptions =
    type === "SELECT" || type === "MULTI_SELECT" || type === "COLOR";
  const needsNumeric =
    type === "NUMBER" || type === "RANGE" || type === "NUMBER_WITH_UNIT";

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
                        {attr.type}
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
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <div>
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
              {modal === "create" ? (
                <div className="grid gap-3 sm:grid-cols-2">
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
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {type === "BOOLEAN" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={trueLabel}
                    onChange={(e) => setTrueLabel(e.target.value)}
                    placeholder="Pozitif"
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <input
                    value={falseLabel}
                    onChange={(e) => setFalseLabel(e.target.value)}
                    placeholder="Negatif"
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
              ) : null}

              {needsNumeric ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="number"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    placeholder="Min"
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <input
                    type="number"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    placeholder="Max"
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <input
                    type="number"
                    value={decimal}
                    onChange={(e) => setDecimal(e.target.value)}
                    placeholder="Ondalık"
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
              ) : null}

              {(type === "NUMBER_WITH_UNIT" ||
                type === "NUMBER" ||
                type === "RANGE") && (
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">Birim yok</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              )}

              {needsOptions && modal === "create" ? (
                <div className="space-y-2">
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
                    + Seçenek
                  </button>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                {(
                  [
                    ["Required", required, setRequired],
                    ["Filterable", filterable, setFilterable],
                    ["Searchable", searchable, setSearchable],
                    ["Comparable", comparable, setComparable],
                    ["Variant", isVariant, setIsVariant],
                    ["Show on card", showOnCard, setShowOnCard],
                    ["Show on detail", showOnDetail, setShowOnDetail],
                    ["Show in specs", showInSpecs, setShowInSpecs],
                  ] as const
                ).map(([label, checked, setter]) => (
                  <label key={label} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setter(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    {label}
                  </label>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                  placeholder="Sort order"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                />
                <input
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="Placeholder"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                />
                <textarea
                  rows={2}
                  value={helpText}
                  onChange={(e) => setHelpText(e.target.value)}
                  placeholder="Help text"
                  className="sm:col-span-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
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

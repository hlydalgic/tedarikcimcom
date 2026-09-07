"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Pencil } from "lucide-react";
import {
  archiveSystemFilterDefinition,
  updateSystemFilterDefinition,
} from "@/app/actions/system-filters";
import {
  FILTER_DISPLAY_TYPES,
  type FilterDisplayType,
  type SystemFilterDefinitionRow,
} from "@/lib/attributes/types";

type Props = {
  filters: SystemFilterDefinitionRow[];
};

export function SystemFiltersAdmin({ filters }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editFilter, setEditFilter] = useState<SystemFilterDefinitionRow | null>(
    null
  );
  const [displayType, setDisplayType] = useState<FilterDisplayType>("CHECKBOX");

  const activeFilters = filters.filter((f) => !f.archived_at);

  const openEdit = (filter: SystemFilterDefinitionRow) => {
    setEditFilter(filter);
    setDisplayType(filter.display_type);
  };

  const submit = () => {
    if (!editFilter) return;

    startTransition(async () => {
      setError(null);
      const result = await updateSystemFilterDefinition({
        id: editFilter.id,
        displayType,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Display type güncellendi.");
      setEditFilter(null);
      router.refresh();
    });
  };

  const archive = (filter: SystemFilterDefinitionRow) => {
    if (
      !window.confirm(
        `"${filter.name}" filtresini arşivlemek istiyor musunuz?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await archiveSystemFilterDefinition(filter.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("System filtre arşivlendi.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          System Filtreler
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Yerleşik PLP filtreleri (fiyat, marka, satıcı vb.). Yeni filtre
          ihtiyacı için özellik (attribute) tanımlayın.
        </p>
      </div>

      {message ? (
        <p className="rounded-xl bg-success/10 px-4 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-error/10 px-4 py-2 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-background text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Display</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {activeFilters.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-ink-muted"
                >
                  Yerleşik system filtre bulunamadı.
                </td>
              </tr>
            ) : (
              activeFilters.map((filter) => (
                <tr key={filter.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{filter.name}</div>
                    {filter.description ? (
                      <div className="mt-0.5 text-xs text-ink-muted">
                        {filter.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {filter.key}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {filter.display_type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        filter.is_active
                          ? "bg-success/15 text-success"
                          : "bg-ink-muted/15 text-ink-muted"
                      }`}
                    >
                      {filter.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(filter)}
                        className="rounded-lg p-2 text-ink-muted hover:bg-background hover:text-ink"
                        aria-label="Display type düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!filter.is_builtin ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => archive(filter)}
                          className="rounded-lg p-2 text-ink-muted hover:bg-background hover:text-error"
                          aria-label="Arşivle"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editFilter ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lift">
            <h2 className="font-display text-lg font-bold text-ink">
              Display type düzenle
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {editFilter.name}{" "}
              <span className="font-mono text-xs">({editFilter.key})</span>
            </p>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium">
                Display type
              </label>
              <select
                value={displayType}
                onChange={(e) =>
                  setDisplayType(e.target.value as FilterDisplayType)
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {FILTER_DISPLAY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditFilter(null)}
                className="h-10 rounded-xl border border-border px-4 text-sm font-semibold"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

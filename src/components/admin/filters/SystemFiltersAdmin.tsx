"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Pencil, Plus } from "lucide-react";
import {
  archiveSystemFilterDefinition,
  createSystemFilterDefinition,
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
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editFilter, setEditFilter] = useState<SystemFilterDefinitionRow | null>(
    null
  );
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [displayType, setDisplayType] = useState<FilterDisplayType>("CHECKBOX");
  const [isActive, setIsActive] = useState(true);

  const activeFilters = filters.filter((f) => !f.archived_at);

  const openCreate = () => {
    setEditFilter(null);
    setName("");
    setKey("");
    setDescription("");
    setDisplayType("CHECKBOX");
    setIsActive(true);
    setModal("create");
  };

  const openEdit = (filter: SystemFilterDefinitionRow) => {
    setEditFilter(filter);
    setName(filter.name);
    setKey(filter.key);
    setDescription(filter.description ?? "");
    setDisplayType(filter.display_type);
    setIsActive(filter.is_active);
    setModal("edit");
  };

  const submit = () => {
    startTransition(async () => {
      setError(null);
      if (modal === "edit" && editFilter) {
        const result = await updateSystemFilterDefinition({
          id: editFilter.id,
          name,
          description,
          displayType,
          isActive,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("System filtre güncellendi.");
      } else {
        const result = await createSystemFilterDefinition({
          name,
          key: key || undefined,
          description,
          displayType,
          isActive,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("System filtre oluşturuldu.");
      }
      setModal(null);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            System Filtreler
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Kategori PLP sidebar&apos;ında kullanılabilecek sistem filtre
            tanımları
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni system filtre
        </button>
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
                  Henüz system filtre tanımı yok.
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
                    {filter.is_builtin ? (
                      <span className="ml-2 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
                        Built-in
                      </span>
                    ) : null}
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
                        aria-label="Düzenle"
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

      {modal ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-lift">
            <h2 className="font-display text-lg font-bold text-ink">
              {modal === "create" ? "Yeni system filtre" : "System filtre düzenle"}
            </h2>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium">Ad</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Garanti Süresi"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>

              {modal === "create" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Key / slug
                  </label>
                  <input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="garanti_suresi (boşsa ad'dan üretilir)"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Key</label>
                  <p className="rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-ink-muted">
                    {key}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
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

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Aktif
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-10 rounded-xl border border-border px-4 text-sm font-semibold"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={pending || name.trim().length < 2}
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

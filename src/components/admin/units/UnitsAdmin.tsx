"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { createUnit, updateUnit } from "@/app/actions/units";
import { UNIT_CATEGORIES, type UnitRow } from "@/lib/attributes/types";

type Props = { units: UnitRow[] };

export function UnitsAdmin({ units }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editUnit, setEditUnit] = useState<UnitRow | null>(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [category, setCategory] = useState<string>("length");

  const openCreate = () => {
    setEditUnit(null);
    setName("");
    setSymbol("");
    setCategory("length");
    setModal("create");
  };

  const openEdit = (u: UnitRow) => {
    setEditUnit(u);
    setName(u.name);
    setSymbol(u.symbol);
    setCategory(u.category);
    setModal("edit");
  };

  const submit = () => {
    startTransition(async () => {
      setError(null);
      if (modal === "edit" && editUnit) {
        const result = await updateUnit({
          id: editUnit.id,
          name,
          symbol,
          category,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Birim güncellendi.");
      } else {
        const result = await createUnit({ name, symbol, category });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Birim oluşturuldu.");
      }
      setModal(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Birimler</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Ölçü birimleri (mm, bar, kg…)
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni birim
        </button>
      </div>

      {error ? (
        <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          {message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Sembol</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {units.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                <td className="px-4 py-3 font-mono text-ink-muted">{u.symbol}</td>
                <td className="px-4 py-3 text-ink-muted">{u.category}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="rounded p-1.5 text-ink-muted hover:bg-background"
                    onClick={() => openEdit(u)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="absolute inset-0" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <h3 className="mb-4 font-display font-bold">
              {modal === "edit" ? "Birim düzenle" : "Yeni birim"}
            </h3>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ad"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Sembol"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {UNIT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
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
                Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

export type CategoryLeafOption = {
  id: string;
  label: string;
};

type Props = {
  options: CategoryLeafOption[];
  selectedId: string;
  pending?: boolean;
  onSelect: (id: string) => void;
};

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function CategoryLeafPicker({
  options,
  selectedId,
  pending = false,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(
    () => options.find((option) => option.id === selectedId)?.label ?? "",
    [options, selectedId]
  );

  useEffect(() => {
    if (selectedLabel) {
      setQuery(selectedLabel);
    }
  }, [selectedLabel]);

  const filteredOptions = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return options;

    return options.filter((option) =>
      normalizeSearch(option.label).includes(needle)
    );
  }, [options, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kategori ara... (ör: PPRC Boru)"
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-ink outline-none ring-2 ring-transparent transition focus:ring-primary/30"
        />
      </div>

      <div className="max-h-96 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
        {filteredOptions.length ? (
          filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={pending}
              onClick={() => {
                setQuery(option.label);
                onSelect(option.id);
              }}
              className={`flex w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:border-primary hover:bg-primary-soft/40 ${
                selectedId === option.id
                  ? "border border-primary bg-primary-soft text-primary"
                  : "border border-transparent text-ink"
              }`}
            >
              {option.label}
            </button>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-sm text-ink-muted">
            Eşleşen kategori bulunamadı.
          </p>
        )}
      </div>
    </div>
  );
}

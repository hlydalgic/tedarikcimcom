"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CatalogSort } from "@/lib/catalog/types";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "En yeni" },
  { value: "price_asc", label: "Fiyat (artan)" },
  { value: "price_desc", label: "Fiyat (azalan)" },
];

type SortSelectProps = {
  includeRelevance?: boolean;
};

export function SortSelect({ includeRelevance = false }: SortSelectProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const options = includeRelevance
    ? [{ value: "relevance" as CatalogSort, label: "İlgili" }, ...SORT_OPTIONS]
    : SORT_OPTIONS;

  const current = searchParams.get("sira") ?? (includeRelevance ? "relevance" : "newest");

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-ink-muted">Sırala:</span>
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          const val = e.target.value;
          if (val === "newest" || (includeRelevance && val === "relevance")) {
            params.delete("sira");
          } else {
            params.set("sira", val);
          }
          params.delete("sayfa");
          const qs = params.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="h-9 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-ink outline-none focus:border-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

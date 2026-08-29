"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

type Suggestion = {
  suggestion_type: "product" | "category";
  label: string;
  href: string;
};

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/arama/oneriler?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as Suggestion[];
        setSuggestions(data);
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function submitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setOpen(false);
    router.push(`/arama?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={wrapRef} className={`relative ${compact ? "w-full" : "mx-auto min-w-0 flex-1"}`}>
      <form
        className="relative"
        onSubmit={submitSearch}
        role="search"
      >
        <label htmlFor={compact ? "mobile-search" : "header-search"} className="sr-only">
          Ürün, marka veya kategori ara
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          id={compact ? "mobile-search" : "header-search"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder="Boru, vana, hortum, marka veya SKU ara…"
          className={`w-full rounded-xl border border-border bg-background pl-10 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${
            compact ? "h-10 pr-3" : "h-11 pr-28"
          }`}
        />
        {!compact ? (
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Ara
          </button>
        ) : null}
      </form>

      {open && suggestions.length ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lift">
          {suggestions.map((s, i) => (
            <Link
              key={`${s.href}-${i}`}
              href={s.href}
              className="block px-4 py-2.5 text-sm text-ink transition hover:bg-primary-soft"
              onClick={() => setOpen(false)}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                {s.suggestion_type === "product" ? "Ürün" : "Kategori"}
              </span>
              <span className="mt-0.5 block">{s.label}</span>
            </Link>
          ))}
          <button
            type="button"
            className="block w-full border-t border-border px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-primary-soft"
            onClick={() => submitSearch()}
          >
            &quot;{query}&quot; için tüm sonuçlar
          </button>
        </div>
      ) : null}
    </div>
  );
}

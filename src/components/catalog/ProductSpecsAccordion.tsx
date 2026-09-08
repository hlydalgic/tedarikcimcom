"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ProductSpecRow } from "@/lib/catalog/types";
import { ProductSpecsTable } from "@/components/catalog/ProductSpecsTable";

export function ProductSpecsAccordion({ specs }: { specs: ProductSpecRow[] }) {
  const [open, setOpen] = useState(false);

  if (!specs.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-base font-bold text-ink">
          Teknik özellikler
        </span>
        <ChevronDown
          className={`h-5 w-5 text-ink-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-border px-1 pb-1 pt-1">
          <ProductSpecsTable specs={specs} embedded />
        </div>
      ) : null}
    </div>
  );
}

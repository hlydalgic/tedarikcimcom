"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
};

export function Pagination({ page, pageSize, total }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("sayfa");
    } else {
      params.set("sayfa", String(nextPage));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <nav
      aria-label="Sayfalama"
      className="mt-8 flex items-center justify-center gap-2"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => goToPage(page - 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Önceki
      </button>
      <span className="px-3 text-sm text-ink-muted">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sonraki
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

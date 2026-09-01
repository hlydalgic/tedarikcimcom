"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, LayoutGrid } from "lucide-react";
import {
  buildNavCategoryHref,
  buildNavCategoryTree,
  type NavCategoryNode,
} from "@/lib/catalog/category-href";
import type { NavCategory } from "@/lib/catalog/types";

type CategoryMegaMenuProps = {
  categories: NavCategory[];
};

export function CategoryMegaMenu({ categories }: CategoryMegaMenuProps) {
  const tree = buildNavCategoryTree(categories);
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(
    tree[0]?.id ?? null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hoveredRoot =
    tree.find((c) => c.id === hoveredId) ?? tree[0] ?? null;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 200);
  }, [clearCloseTimer]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
    if (!hoveredId && tree[0]) {
      setHoveredId(tree[0].id);
    }
  }

  function renderChildLinks(root: NavCategoryNode) {
    if (!root.children.length) {
      return (
        <p className="px-6 py-8 text-sm text-ink-muted">
          Alt kategori bulunmuyor.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {root.children.map((child) => (
          <Link
            key={child.id}
            href={buildNavCategoryHref(child, categories)}
            className="group flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-ink transition hover:bg-primary-soft hover:text-primary"
            onClick={() => setOpen(false)}
          >
            <span>{child.name}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative hidden md:block"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        <LayoutGrid className="h-4 w-4" />
        Kategoriler
        <ChevronRight
          className={`h-4 w-4 transition ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open ? (
        <div
          className="absolute left-[calc(50%-50vw)] top-full z-[9999] mt-0 w-screen min-h-[400px] overflow-visible border-b border-border bg-surface shadow-lift"
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <div className="mx-auto flex min-h-[400px] max-w-7xl overflow-visible px-4 md:px-6 lg:px-8">
            <aside className="min-h-[400px] w-[200px] min-w-[200px] shrink-0 border-r border-border bg-background/60 py-3">
              <Link
                href="/kategoriler"
                className="block px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                onClick={() => setOpen(false)}
              >
                Tüm kategoriler
              </Link>
              {tree.map((root) => {
                const active = hoveredRoot?.id === root.id;
                return (
                  <Link
                    key={root.id}
                    href={buildNavCategoryHref(root, categories)}
                    className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition ${
                      active
                        ? "bg-surface font-semibold text-primary"
                        : "text-ink hover:bg-primary-soft hover:text-primary"
                    }`}
                    onMouseEnter={() => setHoveredId(root.id)}
                    onClick={() => setOpen(false)}
                  >
                    <span>{root.name}</span>
                    {root.children.length > 0 ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                    ) : null}
                  </Link>
                );
              })}
            </aside>

            <div className="min-h-[400px] min-w-0 flex-1 overflow-visible">
              {hoveredRoot ? (
                <>
                  <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <Link
                      href={buildNavCategoryHref(hoveredRoot, categories)}
                      className="text-base font-semibold text-ink transition hover:text-primary"
                      onClick={() => setOpen(false)}
                    >
                      {hoveredRoot.name}
                    </Link>
                    <Link
                      href={buildNavCategoryHref(hoveredRoot, categories)}
                      className="text-sm font-semibold text-primary hover:text-primary-hover"
                      onClick={() => setOpen(false)}
                    >
                      Tümünü gör →
                    </Link>
                  </div>
                  {renderChildLinks(hoveredRoot)}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CategoryMobileNav({
  categories,
  onNavigate,
}: {
  categories: NavCategory[];
  onNavigate?: () => void;
}) {
  const tree = buildNavCategoryTree(categories);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/kategoriler"
        className="rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft"
        onClick={onNavigate}
      >
        Tüm kategoriler
      </Link>
      {tree.map((root) => {
        const expanded = expandedId === root.id;
        return (
          <div key={root.id}>
            <div className="flex items-center gap-1">
              <Link
                href={buildNavCategoryHref(root, categories)}
                className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-primary-soft"
                onClick={onNavigate}
              >
                {root.name}
              </Link>
              {root.children.length > 0 ? (
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-label={`${root.name} alt kategorileri`}
                  className="rounded-lg p-2.5 text-ink-muted hover:bg-background"
                  onClick={() =>
                    setExpandedId(expanded ? null : root.id)
                  }
                >
                  <ChevronRight
                    className={`h-4 w-4 transition ${expanded ? "rotate-90" : ""}`}
                  />
                </button>
              ) : null}
            </div>
            {expanded && root.children.length > 0 ? (
              <div className="ml-3 border-l border-border pl-2">
                {root.children.map((child) => (
                  <Link
                    key={child.id}
                    href={buildNavCategoryHref(child, categories)}
                    className="block rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-primary-soft hover:text-ink"
                    onClick={onNavigate}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

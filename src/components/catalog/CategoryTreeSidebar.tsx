"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CategorySidebarContext } from "@/lib/catalog/category-href";

type CategoryTreeSidebarProps = {
  context: CategorySidebarContext;
};

export function CategoryTreeSidebar({ context }: CategoryTreeSidebarProps) {
  const {
    currentId,
    currentName,
    currentHref,
    ancestors,
    listItems,
    currentInList,
    currentChildren,
  } = context;

  if (!ancestors.length && !listItems.length && !currentInList) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <h2 className="mb-3 font-display text-base font-bold text-ink">
        Kategoriler
      </h2>

      {ancestors.length > 0 ? (
        <nav
          aria-label="Üst kategoriler"
          className="mb-3 space-y-1 border-b border-border pb-3"
        >
          {ancestors.map((ancestor) => (
            <Link
              key={ancestor.id}
              href={ancestor.href}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-primary-soft hover:text-primary"
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
              {ancestor.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {!currentInList ? (
        <Link
          href={currentHref}
          className="mb-2 block rounded-lg px-2.5 py-2 text-sm font-semibold text-primary"
          aria-current="page"
        >
          {currentName}
        </Link>
      ) : null}

      {listItems.length > 0 ? (
        <ul className="space-y-0.5">
          {listItems.map((item) => {
            const isActive = item.id === currentId;
            const showNestedChildren =
              isActive && currentInList && currentChildren.length > 0;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-2.5 py-2 text-sm transition hover:bg-primary-soft ${
                    isActive
                      ? "font-semibold text-primary"
                      : "text-ink hover:text-primary"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.name}
                </Link>

                {showNestedChildren ? (
                  <ul className="ml-3 space-y-0.5 border-l border-border pl-2">
                    {currentChildren.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={child.href}
                          className="block rounded-lg px-2.5 py-1.5 text-sm text-ink-muted transition hover:bg-primary-soft hover:text-primary"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

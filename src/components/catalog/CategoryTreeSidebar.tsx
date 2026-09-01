"use client";

import Link from "next/link";
import type { CategorySidebarContext } from "@/lib/catalog/category-href";

type CategoryTreeSidebarProps = {
  context: CategorySidebarContext;
  /** At root level, show direct children as the primary list */
  isRoot?: boolean;
};

export function CategoryTreeSidebar({
  context,
  isRoot = false,
}: CategoryTreeSidebarProps) {
  const { currentId, siblings, children } = context;
  const showSiblings = siblings.length > 0;
  const showChildren = children.length > 0;

  if (!showSiblings && !showChildren) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <h2 className="mb-3 font-display text-base font-bold text-ink">
        Kategoriler
      </h2>

      {showSiblings ? (
        <ul className="space-y-0.5">
          {siblings.map((item) => {
            const isActive = item.id === currentId;
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
              </li>
            );
          })}
        </ul>
      ) : null}

      {showChildren ? (
        <div className={showSiblings ? "mt-4 border-t border-border pt-4" : ""}>
          {showSiblings ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Alt kategoriler
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {children.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-2.5 py-2 text-sm transition hover:bg-primary-soft ${
                    isRoot
                      ? "text-ink hover:text-primary"
                      : "pl-4 text-ink-muted hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

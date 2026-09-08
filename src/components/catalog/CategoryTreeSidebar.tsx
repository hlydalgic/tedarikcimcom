"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CategorySidebarContext } from "@/lib/catalog/category-href";

type CategoryTreeSidebarProps = {
  context: CategorySidebarContext;
  embedded?: boolean;
  onLinkClick?: () => void;
  picker?: boolean;
  selectedId?: string;
  onSelect?: (categoryId: string) => void;
};

export function CategoryTreeSidebar({
  context,
  embedded = false,
  onLinkClick,
  picker = false,
  selectedId,
  onSelect,
}: CategoryTreeSidebarProps) {
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

  const activeId = selectedId ?? currentId;

  function renderItem(
    item: { id: string; name: string; href: string },
    className: string,
    isCurrentPage?: boolean
  ) {
    const isSelected = item.id === activeId;

    if (picker) {
      return (
        <button
          type="button"
          onClick={() => onSelect?.(item.id)}
          className={`${className} w-full text-left ${
            isSelected ? "font-semibold text-primary" : ""
          }`}
          aria-current={isCurrentPage || isSelected ? "page" : undefined}
        >
          {item.name}
        </button>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={onLinkClick}
        className={className}
        aria-current={isCurrentPage ? "page" : undefined}
      >
        {item.name}
      </Link>
    );
  }

  return (
    <div
      className={
        embedded
          ? undefined
          : "rounded-2xl border border-border bg-surface p-4 shadow-soft"
      }
    >
      <h2 className="mb-3 font-display text-base font-bold text-ink">
        Kategoriler
      </h2>

      {ancestors.length > 0 ? (
        <nav
          aria-label="Üst kategoriler"
          className="mb-3 space-y-1 border-b border-border pb-3"
        >
          {ancestors.map((ancestor) => (
            <div key={ancestor.id}>
              {picker ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(ancestor.id)}
                  className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-primary-soft hover:text-primary"
                >
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                  {ancestor.name}
                </button>
              ) : (
                <Link
                  key={ancestor.id}
                  href={ancestor.href}
                  onClick={onLinkClick}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-primary-soft hover:text-primary"
                >
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                  {ancestor.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      ) : null}

      {!currentInList ? (
        renderItem(
          { id: currentId, name: currentName, href: currentHref },
          "mb-2 block rounded-lg px-2.5 py-2 text-sm font-semibold text-primary",
          true
        )
      ) : null}

      {listItems.length > 0 ? (
        <ul className="space-y-0.5">
          {listItems.map((item) => {
            const isActive = item.id === currentId;
            const isSelected = item.id === activeId;
            const showNestedChildren =
              isActive && currentInList && currentChildren.length > 0;

            return (
              <li key={item.id}>
                {renderItem(
                  item,
                  `block rounded-lg px-2.5 py-2 text-sm transition hover:bg-primary-soft ${
                    isActive || isSelected
                      ? "font-semibold text-primary"
                      : "text-ink hover:text-primary"
                  }`,
                  isActive
                )}

                {showNestedChildren ? (
                  <ul className="ml-3 space-y-0.5 border-l border-border pl-2">
                    {currentChildren.map((child) => (
                      <li key={child.id}>
                        {renderItem(
                          child,
                          "block rounded-lg px-2.5 py-1.5 text-sm text-ink-muted transition hover:bg-primary-soft hover:text-primary"
                        )}
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

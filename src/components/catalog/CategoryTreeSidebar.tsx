"use client";

import { AppLink } from "@/components/ui/AppLink";
import { ChevronRight } from "lucide-react";
import type {
  CategorySidebarContext,
  CategorySidebarItem,
} from "@/lib/catalog/category-href";

type CategoryTreeSidebarProps = {
  context: CategorySidebarContext;
  embedded?: boolean;
  onLinkClick?: () => void;
  picker?: boolean;
  selectedId?: string;
  onSelect?: (categoryId: string) => void;
};

function CategoryRadioRow({
  item,
  checked,
  picker,
  onSelect,
  onLinkClick,
}: {
  item: CategorySidebarItem;
  checked: boolean;
  picker?: boolean;
  onSelect?: (categoryId: string) => void;
  onLinkClick?: () => void;
}) {
  const row = (
    <span className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-primary-soft">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          checked
            ? "border-primary bg-primary"
            : "border-border bg-surface"
        }`}
        aria-hidden
      >
        {checked ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      <span
        className={`text-sm leading-snug ${
          checked ? "font-semibold text-primary" : "text-ink"
        }`}
      >
        {item.name}
      </span>
    </span>
  );

  if (picker) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(item.id)}
        className="block w-full text-left"
        role="radio"
        aria-checked={checked}
      >
        {row}
      </button>
    );
  }

  return (
    <AppLink
      href={item.href}
      prefetch={true}
      onClick={onLinkClick}
      className="block"
      role="radio"
      aria-checked={checked}
    >
      {row}
    </AppLink>
  );
}

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
    ancestors,
    listItems,
    currentChildren,
  } = context;

  if (!ancestors.length && !listItems.length && !currentChildren.length) {
    return null;
  }

  const activeId = selectedId ?? currentId;
  const showChildSection = currentChildren.length > 0;

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
          {ancestors.map((ancestor) =>
            picker ? (
              <button
                key={ancestor.id}
                type="button"
                onClick={() => onSelect?.(ancestor.id)}
                className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-primary-soft hover:text-primary"
              >
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                {ancestor.name}
              </button>
            ) : (
              <AppLink
                key={ancestor.id}
                href={ancestor.href}
                prefetch={true}
                onClick={onLinkClick}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-primary-soft hover:text-primary"
              >
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                {ancestor.name}
              </AppLink>
            )
          )}
        </nav>
      ) : null}

      <div role="radiogroup" aria-label="Kategori seçimi" className="space-y-0.5">
        {listItems.map((item) => (
          <CategoryRadioRow
            key={item.id}
            item={item}
            checked={item.id === activeId}
            picker={picker}
            onSelect={onSelect}
            onLinkClick={onLinkClick}
          />
        ))}
      </div>

      {showChildSection ? (
        <div className="mt-4 border-t border-border pt-3">
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Alt Kategoriler
          </h3>
          <div role="radiogroup" aria-label="Alt kategoriler" className="space-y-0.5">
            {currentChildren.map((child) => (
              <CategoryRadioRow
                key={child.id}
                item={child}
                checked={child.id === activeId}
                picker={picker}
                onSelect={onSelect}
                onLinkClick={onLinkClick}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

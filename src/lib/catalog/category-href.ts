import type { NavCategory } from "@/lib/catalog/types";

export function buildNavCategoryHref(
  category: Pick<NavCategory, "slug" | "parent_id" | "id"> & {
    href?: string;
  },
  allCategories: (Pick<NavCategory, "slug" | "parent_id" | "id"> & {
    href?: string;
  })[]
): string {
  if (category.href) return category.href;

  const parts: string[] = [category.slug];
  let current = category;
  while (current.parent_id) {
    const parent = allCategories.find((c) => c.id === current.parent_id);
    if (!parent) break;
    parts.unshift(parent.slug);
    current = parent;
  }
  return `/kategoriler/${parts.join("/")}`;
}

export type NavCategoryNode = NavCategory & {
  children: NavCategoryNode[];
};

export function buildNavCategoryTree(categories: NavCategory[]): NavCategoryNode[] {
  function childrenOf(parentId: string): NavCategoryNode[] {
    return categories
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        ...c,
        children: childrenOf(c.id),
      }));
  }

  return categories
    .filter((c) => !c.parent_id)
    .map((c) => ({
      ...c,
      children: childrenOf(c.id),
    }));
}

export type CategorySidebarItem = {
  id: string;
  name: string;
  slug: string;
  href: string;
};

export type CategorySidebarContext = {
  currentId: string;
  currentName: string;
  currentHref: string;
  /** Clickable ancestor trail (root → parent), excludes current */
  ancestors: CategorySidebarItem[];
  /** Siblings of the current category (main list) */
  listItems: CategorySidebarItem[];
  /** Whether the current category appears inside listItems */
  currentInList: boolean;
  /** Direct children of the current category (Alt Kategoriler section) */
  currentChildren: CategorySidebarItem[];
};

function toSidebarItem(
  category: Pick<NavCategory, "id" | "name" | "slug" | "parent_id" | "href">,
  allCategories: NavCategory[]
): CategorySidebarItem {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    href: category.href ?? buildNavCategoryHref(category, allCategories),
  };
}

function getParent(
  category: Pick<NavCategory, "parent_id">,
  allCategories: NavCategory[]
): NavCategory | null {
  if (!category.parent_id) return null;
  return allCategories.find((c) => c.id === category.parent_id) ?? null;
}

function getChildren(
  categoryId: string,
  allCategories: NavCategory[]
): CategorySidebarItem[] {
  return allCategories
    .filter((c) => c.parent_id === categoryId)
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.name.localeCompare(b.name, "tr")
    )
    .map((c) => toSidebarItem(c, allCategories));
}

function getSiblings(
  category: Pick<NavCategory, "id" | "parent_id" | "name" | "slug">,
  allCategories: NavCategory[]
): CategorySidebarItem[] {
  const siblings = category.parent_id
    ? allCategories.filter((c) => c.parent_id === category.parent_id)
    : allCategories.filter((c) => !c.parent_id);

  return siblings
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.name.localeCompare(b.name, "tr")
    )
    .map((c) => toSidebarItem(c, allCategories));
}

export function buildCategorySidebarContext(
  category: Pick<NavCategory, "id" | "name" | "slug" | "parent_id"> & {
    href?: string;
  },
  allCategories: NavCategory[]
): CategorySidebarContext {
  const ancestors: CategorySidebarItem[] = [];
  let walker = getParent(category, allCategories);
  while (walker) {
    ancestors.unshift(toSidebarItem(walker, allCategories));
    walker = getParent(walker, allCategories);
  }

  const listItems = getSiblings(category, allCategories);
  const currentChildren = getChildren(category.id, allCategories);

  return {
    currentId: category.id,
    currentName: category.name,
    currentHref:
      category.href ?? buildNavCategoryHref(category, allCategories),
    ancestors,
    listItems,
    currentInList: listItems.some((item) => item.id === category.id),
    currentChildren,
  };
}

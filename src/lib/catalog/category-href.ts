import type { NavCategory } from "@/lib/catalog/types";

export function buildNavCategoryHref(
  category: Pick<NavCategory, "slug" | "parent_id" | "id">,
  allCategories: Pick<NavCategory, "slug" | "parent_id" | "id">[]
): string {
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
  /** Primary navigation list for this level */
  listItems: CategorySidebarItem[];
  /** Whether the current category appears inside listItems */
  currentInList: boolean;
  /** Direct children of current — indented under active item when currentInList */
  currentChildren: CategorySidebarItem[];
};

function toSidebarItem(
  category: Pick<NavCategory, "id" | "name" | "slug" | "parent_id">,
  allCategories: NavCategory[]
): CategorySidebarItem {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    href: buildNavCategoryHref(category, allCategories),
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
    .map((c) => toSidebarItem(c, allCategories));
}

function getSiblings(
  category: Pick<NavCategory, "id" | "parent_id" | "name" | "slug">,
  allCategories: NavCategory[]
): CategorySidebarItem[] {
  if (!category.parent_id) return [];
  return allCategories
    .filter((c) => c.parent_id === category.parent_id)
    .map((c) => toSidebarItem(c, allCategories));
}

export function buildCategorySidebarContext(
  category: Pick<NavCategory, "id" | "name" | "slug" | "parent_id">,
  allCategories: NavCategory[]
): CategorySidebarContext {
  const ancestors: CategorySidebarItem[] = [];
  let walker = getParent(category, allCategories);
  while (walker) {
    ancestors.unshift(toSidebarItem(walker, allCategories));
    walker = getParent(walker, allCategories);
  }

  const parent = getParent(category, allCategories);
  const grandparent = parent ? getParent(parent, allCategories) : null;

  // Root: show direct children (Boru, Vana under Tesisat)
  // One level below root: show current's children (PPRC, HDPE under Boru)
  // Deeper levels: show siblings (lateral nav under same parent)
  let listItems: CategorySidebarItem[];
  if (!category.parent_id) {
    listItems = getChildren(category.id, allCategories);
  } else if (grandparent === null) {
    listItems = getChildren(category.id, allCategories);
  } else {
    listItems = getSiblings(category, allCategories);
  }

  const currentInList = listItems.some((item) => item.id === category.id);
  const currentChildren = getChildren(category.id, allCategories);

  return {
    currentId: category.id,
    currentName: category.name,
    currentHref: buildNavCategoryHref(category, allCategories),
    ancestors,
    listItems,
    currentInList,
    currentChildren,
  };
}

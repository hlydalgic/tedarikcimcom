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
  siblings: CategorySidebarItem[];
  children: CategorySidebarItem[];
};

export function buildCategorySidebarContext(
  category: Pick<NavCategory, "id" | "name" | "slug" | "parent_id">,
  allCategories: NavCategory[]
): CategorySidebarContext {
  const siblingSource =
    category.parent_id == null
      ? []
      : allCategories.filter((c) => c.parent_id === category.parent_id);

  const children = allCategories.filter((c) => c.parent_id === category.id);

  return {
    currentId: category.id,
    siblings: siblingSource.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      href: buildNavCategoryHref(c, allCategories),
    })),
    children: children.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      href: buildNavCategoryHref(c, allCategories),
    })),
  };
}

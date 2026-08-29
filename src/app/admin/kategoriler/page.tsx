import { CategoryBuilder } from "@/components/admin/categories/CategoryBuilder";
import { getCategoryTree, listCategories } from "@/lib/categories/queries";
import {
  listAttributes,
  listCategoryAttributes,
  listCategoryFilters,
  listUnits,
} from "@/lib/attributes/queries";

type PageProps = {
  searchParams: { id?: string };
};

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const [tree, flat, attributes, categoryAttributes, categoryFilters, units] =
    await Promise.all([
      getCategoryTree({ includeArchived: false }),
      listCategories({ includeArchived: false }),
      listAttributes(),
      listCategoryAttributes(),
      listCategoryFilters(),
      listUnits(),
    ]);

  return (
    <CategoryBuilder
      initialTree={tree}
      flatCategories={flat}
      attributes={attributes}
      categoryAttributes={categoryAttributes}
      categoryFilters={categoryFilters}
      units={units}
      selectedId={searchParams.id}
    />
  );
}

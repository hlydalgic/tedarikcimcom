import { CategoryBuilder } from "@/components/admin/categories/CategoryBuilder";
import { getCategoryTree, listCategories } from "@/lib/categories/queries";

type PageProps = {
  searchParams: { id?: string };
};

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const [tree, flat] = await Promise.all([
    getCategoryTree({ includeArchived: false }),
    listCategories({ includeArchived: false }),
  ]);

  return (
    <CategoryBuilder
      initialTree={tree}
      flatCategories={flat}
      selectedId={searchParams.id}
    />
  );
}

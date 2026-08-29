import { BrandsAdmin } from "@/components/admin/brands/BrandsAdmin";
import { listBrandsWithStats } from "@/lib/brands/queries";
import { listCategories } from "@/lib/categories/queries";

export default async function AdminBrandsPage() {
  const [brands, categories] = await Promise.all([
    listBrandsWithStats(),
    listCategories({ includeArchived: false }),
  ]);

  return <BrandsAdmin brands={brands} categories={categories} />;
}

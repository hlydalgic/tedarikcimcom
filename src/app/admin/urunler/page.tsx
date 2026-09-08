import { AdminProductsAdmin } from "@/components/admin/products/AdminProductsAdmin";
import { listAdminProducts } from "@/lib/admin/queries";

type PageProps = {
  searchParams: { durum?: string };
};

const VALID_STATUSES = new Set([
  "PENDING_REVIEW",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
  "DRAFT",
  "ARCHIVED",
  "ALL",
]);

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const status = searchParams.durum ?? "PENDING_REVIEW";
  const currentStatus = VALID_STATUSES.has(status) ? status : "PENDING_REVIEW";
  const products = await listAdminProducts(currentStatus);

  return (
    <AdminProductsAdmin products={products} currentStatus={currentStatus} />
  );
}

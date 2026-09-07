import { SystemFiltersAdmin } from "@/components/admin/filters/SystemFiltersAdmin";
import { listSystemFilterDefinitions } from "@/lib/attributes/queries";

export default async function AdminFiltersPage() {
  const filters = await listSystemFilterDefinitions();
  return <SystemFiltersAdmin filters={filters} />;
}

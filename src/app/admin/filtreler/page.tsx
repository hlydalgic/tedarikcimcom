import { SystemFiltersAdmin } from "@/components/admin/filters/SystemFiltersAdmin";
import { listSystemFilterDefinitions } from "@/lib/attributes/queries";

export default async function AdminFiltersPage() {
  const filters = await listSystemFilterDefinitions();
  const builtInFilters = filters.filter((f) => f.is_builtin);
  return <SystemFiltersAdmin filters={builtInFilters} />;
}

import { UnitsAdmin } from "@/components/admin/units/UnitsAdmin";
import { listUnits } from "@/lib/attributes/queries";

export default async function AdminUnitsPage() {
  const units = await listUnits();
  return <UnitsAdmin units={units} />;
}

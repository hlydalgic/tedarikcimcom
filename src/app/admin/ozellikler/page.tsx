import { AttributeCatalogAdmin } from "@/components/admin/attributes/AttributeCatalogAdmin";
import {
  countAttributeCategoryUsage,
  listAttributes,
  listUnits,
} from "@/lib/attributes/queries";

export default async function AdminAttributesPage() {
  const [attributes, units, usageCounts] = await Promise.all([
    listAttributes(),
    listUnits(),
    countAttributeCategoryUsage(),
  ]);

  return (
    <AttributeCatalogAdmin
      attributes={attributes}
      units={units}
      usageCounts={usageCounts}
    />
  );
}

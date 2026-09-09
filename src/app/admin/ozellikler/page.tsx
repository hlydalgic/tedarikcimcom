import { AttributeCatalogAdmin } from "@/components/admin/attributes/AttributeCatalogAdmin";
import {
  countAttributeCategoryUsage,
  listAttributeOptions,
  listAttributes,
  listUnits,
} from "@/lib/attributes/queries";

export default async function AdminAttributesPage() {
  const [attributes, units, options, usageCounts] = await Promise.all([
    listAttributes(),
    listUnits(),
    listAttributeOptions(),
    countAttributeCategoryUsage(),
  ]);

  return (
    <AttributeCatalogAdmin
      attributes={attributes}
      units={units}
      options={options}
      usageCounts={usageCounts}
    />
  );
}

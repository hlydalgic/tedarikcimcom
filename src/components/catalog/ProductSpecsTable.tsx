import type { ProductSpecRow } from "@/lib/catalog/types";

export function ProductSpecsTable({ specs }: { specs: ProductSpecRow[] }) {
  if (!specs.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {specs.map((spec, index) => (
            <tr
              key={spec.attribute_id}
              className={index % 2 === 0 ? "bg-surface" : "bg-background/60"}
            >
              <th className="w-[42%] px-4 py-3 text-left font-medium text-ink-muted">
                {spec.attribute_name}
              </th>
              <td className="px-4 py-3 font-medium text-ink">
                {spec.display_value}
                {spec.unit_symbol && !spec.display_value.includes(spec.unit_symbol)
                  ? ` ${spec.unit_symbol}`
                  : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type CategoryStatus =
  | "draft"
  | "pending"
  | "active"
  | "inactive"
  | "rejected"
  | "archived";

export type ProductCondition = "new" | "refurbished" | "used";

export type ShippingType =
  | "STANDARD"
  | "FREE"
  | "SELLER_DEFINED"
  | "QUOTE_REQUIRED"
  | "PICKUP";

export const PRODUCT_CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: "new", label: "Sıfır" },
  { value: "refurbished", label: "Yenilenmiş" },
  { value: "used", label: "İkinci el" },
];

export const SHIPPING_TYPES: { value: ShippingType; label: string }[] = [
  { value: "STANDARD", label: "Standart" },
  { value: "FREE", label: "Ücretsiz kargo" },
  { value: "SELLER_DEFINED", label: "Satıcı tanımlı" },
  { value: "QUOTE_REQUIRED", label: "Teklif gerekli" },
  { value: "PICKUP", label: "Mağazadan teslim" },
];

export type CategoryRow = {
  id: string;
  parent_id: string | null;
  path: string;
  depth: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  status: CategoryStatus;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  show_on_homepage: boolean;
  show_in_nav: boolean;
  commission_rate: number | null;
  required_image_count: number;
  brand_required: boolean;
  sku_required: boolean;
  barcode_required: boolean;
  condition_allowed: ProductCondition[];
  allowed_shipping_types: ShippingType[];
  product_approval_required: boolean;
  min_description_length: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type CategoryTreeNode = CategoryRow & {
  children: CategoryTreeNode[];
};

export function buildCategoryTree(rows: CategoryRow[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  const sorted = [...rows].sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name, "tr");
  });

  for (const row of sorted) {
    map.set(row.id, { ...row, children: [] });
  }

  for (const row of sorted) {
    const node = map.get(row.id)!;
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name, "tr");
    });
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

export function slugifyCategoryName(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

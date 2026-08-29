export type BrandStatus =
  | "draft"
  | "pending"
  | "active"
  | "inactive"
  | "rejected"
  | "archived";

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: BrandStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type BrandWithStats = BrandRow & {
  category_count: number;
  product_count: number;
  category_ids: string[];
};

export function slugifyBrandName(name: string): string {
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

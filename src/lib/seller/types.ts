export type ProductStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "ARCHIVED";

export type SellerProductListItem = {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: ProductStatus;
  rejection_reason: string | null;
  category_name: string | null;
  created_at: string;
  updated_at: string;
};

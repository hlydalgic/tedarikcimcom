import type {
  AttributeType,
  FilterDisplayType,
  SystemFilterKey,
} from "@/lib/attributes/types";
import type { ShippingType } from "@/lib/categories/types";

export type CatalogSort = "newest" | "price_asc" | "price_desc" | "relevance";

export type FilterOption = {
  id: string;
  label: string;
  value: string;
  color_hex: string | null;
  count: number | null;
};

export type CategoryFilterDefinition = {
  id: string;
  category_id: string;
  attribute_id: string | null;
  system_filter_key: SystemFilterKey | null;
  display_type: FilterDisplayType;
  sort_order: number;
  default_collapsed: boolean;
  label: string;
  attribute_slug: string | null;
  attribute_type: AttributeType | null;
  options: FilterOption[];
  range_min: number | null;
  range_max: number | null;
};

export type AttributeFilterValue =
  | { type: "options"; values: string[] }
  | { type: "range"; min?: number; max?: number }
  | { type: "boolean"; value: boolean }
  | { type: "text"; values: string[] };

export type ProductFilters = {
  price_min?: number;
  price_max?: number;
  brand_ids?: string[];
  shop_ids?: string[];
  in_stock?: boolean;
  free_shipping?: boolean;
  rating_min?: number;
  attributes?: Record<string, AttributeFilterValue>;
};

export type CatalogProductListItem = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  currency: string;
  stock: number;
  shipping_type: ShippingType;
  brand_id: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  shop_rating_avg: number | null;
  primary_image_url: string | null;
  published_at: string | null;
};

export type CatalogProductListResult = {
  items: CatalogProductListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ProductSpecRow = {
  attribute_id: string;
  attribute_name: string;
  attribute_slug: string;
  attribute_type: AttributeType;
  unit_symbol: string | null;
  display_value: string;
  sort_order: number;
};

export type ProductDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  stock: number;
  sku: string | null;
  shipping_type: ShippingType;
  shipping_price: number | null;
  condition: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  brand_id: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  shop_logo_url: string | null;
  shop_banner_url: string | null;
  shop_rating_avg: number | null;
  shop_rating_count: number;
  shop_product_count: number;
  seller_id: string;
  images: { id: string; url: string; alt_text: string | null; is_primary: boolean }[];
  published_at: string | null;
};

export type ShopDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  rating_avg: number | null;
  rating_count: number;
  product_count: number;
};

export type SearchSuggestion = {
  suggestion_type: "product" | "category";
  label: string;
  href: string;
};

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

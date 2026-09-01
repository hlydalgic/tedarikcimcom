import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  buildCategorySidebarContext,
  type CategorySidebarContext,
} from "@/lib/catalog/category-href";
import type {
  CatalogProductListItem,
  CatalogProductListResult,
  CatalogSort,
  CategoryFilterDefinition,
  NavCategory,
  ProductDetail,
  ProductFilters,
  ProductSpecRow,
  SearchCategoryFacet,
  ShopDetail,
  SearchSuggestion,
} from "@/lib/catalog/types";
import type { CategoryRow } from "@/lib/categories/types";

function mapListItem(row: Record<string, unknown>): CatalogProductListItem {
  return {
    id: String(row.product_id ?? row.id),
    title: String(row.title),
    slug: String(row.slug),
    price: Number(row.price),
    compare_at_price:
      row.compare_at_price != null ? Number(row.compare_at_price) : null,
    currency: String(row.currency ?? "TRY"),
    stock: Number(row.stock ?? 0),
    shipping_type: row.shipping_type as CatalogProductListItem["shipping_type"],
    brand_id: (row.brand_id as string | null) ?? null,
    brand_name: (row.brand_name as string | null) ?? null,
    brand_slug: (row.brand_slug as string | null) ?? null,
    shop_id: String(row.shop_id),
    shop_name: String(row.shop_name),
    shop_slug: String(row.shop_slug),
    shop_rating_avg:
      row.shop_rating_avg != null ? Number(row.shop_rating_avg) : null,
    primary_image_url: (row.primary_image_url as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
  };
}

export async function getCategoryFilters(
  categoryId: string
): Promise<CategoryFilterDefinition[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_category_filters", {
    p_category_id: categoryId,
  });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    category_id: String(row.category_id),
    attribute_id: (row.attribute_id as string | null) ?? null,
    system_filter_key:
      (row.system_filter_key as CategoryFilterDefinition["system_filter_key"]) ??
      null,
    display_type: row.display_type as CategoryFilterDefinition["display_type"],
    sort_order: Number(row.sort_order),
    default_collapsed: Boolean(row.default_collapsed),
    label: String(row.label),
    attribute_slug: (row.attribute_slug as string | null) ?? null,
    attribute_type:
      (row.attribute_type as CategoryFilterDefinition["attribute_type"]) ?? null,
    options: Array.isArray(row.options)
      ? (row.options as CategoryFilterDefinition["options"])
      : typeof row.options === "object" && row.options
        ? (row.options as CategoryFilterDefinition["options"])
        : [],
    range_min: row.range_min != null ? Number(row.range_min) : null,
    range_max: row.range_max != null ? Number(row.range_max) : null,
  }));
}

export async function filterProducts(input: {
  categoryId?: string;
  shopId?: string;
  filters?: ProductFilters;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
  includeSubcategories?: boolean;
}): Promise<CatalogProductListResult> {
  const supabase = createClient();
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 24;

  const { data, error } = await supabase.rpc("filter_products", {
    p_category_id: input.categoryId ?? null,
    p_shop_id: input.shopId ?? null,
    p_filters: input.filters ?? {},
    p_sort: input.sort ?? "newest",
    p_page: page,
    p_page_size: pageSize,
    p_include_subcategories: input.includeSubcategories ?? true,
  });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Record<string, unknown>[];
  const total = rows.length ? Number(rows[0].total_count ?? 0) : 0;

  return {
    items: rows.map(mapListItem),
    total,
    page,
    pageSize,
  };
}

export async function searchProducts(input: {
  query: string;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
  categoryId?: string;
  filters?: ProductFilters;
}): Promise<CatalogProductListResult> {
  const supabase = createClient();
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 24;

  const { data, error } = await supabase.rpc("search_products", {
    p_query: input.query.trim(),
    p_page: page,
    p_page_size: pageSize,
    p_sort: input.sort ?? "relevance",
    p_category_id: input.categoryId ?? null,
    p_filters: input.filters ?? {},
  });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Record<string, unknown>[];
  const total = rows.length ? Number(rows[0].total_count ?? 0) : 0;

  return {
    items: rows.map(mapListItem),
    total,
    page,
    pageSize,
  };
}

export async function getSearchSuggestions(
  query: string,
  limit = 8
): Promise<SearchSuggestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_product_suggestions", {
    p_query: query.trim(),
    p_limit: limit,
  });
  if (error) return [];

  return (data ?? []).map((row: Record<string, unknown>) => ({
    suggestion_type: row.suggestion_type as SearchSuggestion["suggestion_type"],
    label: String(row.label),
    href: String(row.href),
    image_url: (row.image_url as string | null) ?? null,
  }));
}

export async function getSearchCategoryFacets(
  query: string,
  limit = 20
): Promise<SearchCategoryFacet[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_search_category_facets", {
    p_query: query.trim(),
    p_limit: limit,
  });
  if (error) return [];

  return (data ?? []).map((row: Record<string, unknown>) => ({
    category_id: String(row.category_id),
    category_name: String(row.category_name),
    category_path: String(row.category_path),
    product_count: Number(row.product_count ?? 0),
  }));
}

export async function getSearchFilters(
  query: string,
  categoryId?: string
): Promise<CategoryFilterDefinition[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_search_filters", {
    p_query: query.trim(),
    p_category_id: categoryId ?? null,
  });
  if (error) return [];

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    category_id: String(row.category_id ?? ""),
    attribute_id: (row.attribute_id as string | null) ?? null,
    system_filter_key:
      (row.system_filter_key as CategoryFilterDefinition["system_filter_key"]) ??
      null,
    display_type: row.display_type as CategoryFilterDefinition["display_type"],
    sort_order: Number(row.sort_order),
    default_collapsed: Boolean(row.default_collapsed),
    label: String(row.label),
    attribute_slug: (row.attribute_slug as string | null) ?? null,
    attribute_type:
      (row.attribute_type as CategoryFilterDefinition["attribute_type"]) ?? null,
    options: Array.isArray(row.options)
      ? (row.options as CategoryFilterDefinition["options"])
      : typeof row.options === "object" && row.options
        ? (row.options as CategoryFilterDefinition["options"])
        : [],
    range_min: row.range_min != null ? Number(row.range_min) : null,
    range_max: row.range_max != null ? Number(row.range_max) : null,
  }));
}

export async function getProductSpecs(
  productId: string
): Promise<ProductSpecRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_product_specs", {
    p_product_id: productId,
  });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    attribute_id: String(row.attribute_id),
    attribute_name: String(row.attribute_name),
    attribute_slug: String(row.attribute_slug),
    attribute_type: row.attribute_type as ProductSpecRow["attribute_type"],
    unit_symbol: (row.unit_symbol as string | null) ?? null,
    display_value: String(row.display_value ?? ""),
    sort_order: Number(row.sort_order),
  }));
}

export async function getCategoryBySlugPath(
  slugParts: string[]
): Promise<CategoryRow | null> {
  if (!slugParts.length) return null;

  const supabase = createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select(
      `id, parent_id, path, depth, name, slug, description, image_url, icon,
       status, sort_order, seo_title, seo_description, show_on_homepage,
       show_in_nav, commission_rate, required_image_count, brand_required,
       sku_required, barcode_required, condition_allowed, allowed_shipping_types,
       product_approval_required, min_description_length,
       created_at, updated_at, archived_at`
    )
    .eq("status", "active")
    .is("archived_at", null);

  if (error) throw new Error(error.message);
  const rows = (categories ?? []) as CategoryRow[];

  let parentId: string | null = null;
  let matched: CategoryRow | null = null;

  for (const slug of slugParts) {
    matched =
      rows.find(
        (c) =>
          c.slug === slug &&
          (parentId === null ? c.parent_id === null : c.parent_id === parentId)
      ) ?? null;
    if (!matched) return null;
    parentId = matched.id;
  }

  return matched;
}

export async function getCategoryBreadcrumb(
  categoryId: string
): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = createClient();
  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name, slug, path")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !category) return [];

  const pathLabels = String(category.path).split(".").filter(Boolean);
  if (!pathLabels.length) {
    return [
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
    ];
  }

  const { data: ancestors, error: ancError } = await supabase
    .from("categories")
    .select("id, name, slug, path")
    .eq("status", "active")
    .is("archived_at", null);

  if (ancError) throw new Error(ancError.message);

  const byPath = new Map(
    (ancestors ?? []).map((c: { path: string; id: string; name: string; slug: string }) => [
      c.path,
      c,
    ])
  );

  const crumbs: { id: string; name: string; slug: string }[] = [];
  let builtPath = "";
  for (const label of pathLabels) {
    builtPath = builtPath ? `${builtPath}.${label}` : label;
    const node = byPath.get(builtPath);
    if (node) {
      crumbs.push({ id: node.id, name: node.name, slug: node.slug });
    }
  }

  if (!crumbs.length) {
    crumbs.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });
  }

  return crumbs;
}

export function buildCategoryHref(crumbs: { slug: string }[]): string {
  return `/kategoriler/${crumbs.map((c) => c.slug).join("/")}`;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const supabase = createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select(
      `id, title, slug, description, price, compare_at_price, currency, stock, sku,
       shipping_type, shipping_price, condition, category_id, brand_id, shop_id, seller_id,
       published_at,
       brands(id, name, slug),
       shops(id, name, slug, description, logo_url, banner_url, rating_avg, rating_count),
       categories(id, name, slug)`
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .is("archived_at", null)
    .order("published_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const product = products?.[0];
  if (!product) return null;

  const { data: images } = await supabase
    .from("product_images")
    .select("id, url, alt_text, is_primary, sort_order")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const { count: shopProductCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", product.shop_id)
    .eq("status", "ACTIVE")
    .is("archived_at", null);

  const brand = unwrapRelation(
    product.brands as { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null
  );
  const shop = unwrapRelation(
    product.shops as {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      banner_url: string | null;
      rating_avg: number | null;
      rating_count: number;
    } | {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      banner_url: string | null;
      rating_avg: number | null;
      rating_count: number;
    }[]
  );
  const category = unwrapRelation(
    product.categories as { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[]
  );

  if (!shop || !category) return null;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    compare_at_price:
      product.compare_at_price != null
        ? Number(product.compare_at_price)
        : null,
    currency: product.currency,
    stock: product.stock,
    sku: product.sku,
    shipping_type: product.shipping_type,
    shipping_price:
      product.shipping_price != null ? Number(product.shipping_price) : null,
    condition: product.condition,
    category_id: category.id,
    category_name: category.name,
    category_slug: category.slug,
    brand_id: brand?.id ?? null,
    brand_name: brand?.name ?? null,
    brand_slug: brand?.slug ?? null,
    shop_id: shop.id,
    shop_name: shop.name,
    shop_slug: shop.slug,
    shop_description: shop.description,
    shop_logo_url: shop.logo_url,
    shop_banner_url: shop.banner_url,
    shop_rating_avg: shop.rating_avg,
    shop_rating_count: shop.rating_count,
    shop_product_count: shopProductCount ?? 0,
    seller_id: String(product.seller_id),
    images: (images ?? []).map(
      (img: {
        id: string;
        url: string;
        alt_text: string | null;
        is_primary: boolean;
      }) => ({
        id: img.id,
        url: img.url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
      })
    ),
    published_at: product.published_at,
  };
}

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4
): Promise<CatalogProductListItem[]> {
  const result = await filterProducts({
    categoryId,
    page: 1,
    pageSize: limit + 1,
    sort: "newest",
  });
  return result.items.filter((p) => p.id !== excludeProductId).slice(0, limit);
}

export async function getShopBySlug(slug: string): Promise<ShopDetail | null> {
  const supabase = createClient();
  const { data: shop, error } = await supabase
    .from("shops")
    .select("id, name, slug, description, logo_url, banner_url, rating_avg, rating_count")
    .eq("slug", slug)
    .eq("status", "active")
    .is("archived_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!shop) return null;

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .eq("status", "ACTIVE")
    .is("archived_at", null);

  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    description: shop.description,
    logo_url: shop.logo_url,
    banner_url: shop.banner_url,
    rating_avg: shop.rating_avg,
    rating_count: shop.rating_count,
    product_count: count ?? 0,
  };
}

export async function listActiveCategories(): Promise<NavCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order")
    .eq("status", "active")
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as NavCategory[];
}

export async function getCategorySidebarContext(
  category: Pick<CategoryRow, "id" | "name" | "slug" | "parent_id">
): Promise<CategorySidebarContext> {
  const allCategories = await listActiveCategories();
  return buildCategorySidebarContext(category, allCategories);
}

export async function listNavCategories(): Promise<NavCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order")
    .eq("status", "active")
    .eq("show_in_nav", true)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as NavCategory[];
}

export async function listHomepageCategories(): Promise<
  (NavCategory & { image_url: string | null; product_count: number })[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, image_url")
    .eq("status", "active")
    .eq("show_on_homepage", true)
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .limit(12);

  if (error) throw new Error(error.message);

  const categories = data ?? [];
  const enriched = await Promise.all(
    categories.map(async (cat) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", cat.id)
        .eq("status", "ACTIVE")
        .is("archived_at", null);

      return {
        ...(cat as NavCategory & { image_url: string | null }),
        product_count: count ?? 0,
      };
    })
  );

  return enriched;
}

export async function listFeaturedProducts(
  limit = 8
): Promise<CatalogProductListItem[]> {
  const result = await filterProducts({ page: 1, pageSize: limit, sort: "newest" });
  return result.items;
}

import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
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
    card_attributes: [],
  };
}

export const CATALOG_CATEGORIES_TAG = "catalog-categories";
export const CATALOG_PRODUCTS_TAG = "catalog-products";
const PUBLIC_CATALOG_REVALIDATE_SECONDS = 300;

function requirePublicClient(): SupabaseClient {
  const supabase = createPublicClient();
  if (!supabase) throw new Error("Supabase yapılandırması eksik.");
  return supabase;
}

async function attachCardAttributes(
  items: CatalogProductListItem[],
  supabase: SupabaseClient = requirePublicClient()
): Promise<CatalogProductListItem[]> {
  if (!items.length) return items;

  const { data, error } = await supabase.rpc("get_product_card_attributes", {
    p_product_ids: items.map((item) => item.id),
  });

  if (error || !data) {
    return items;
  }

  const byProduct = new Map<string, CatalogProductListItem["card_attributes"]>();

  for (const row of data as Record<string, unknown>[]) {
    const productId = String(row.product_id);
    const entry = {
      attribute_name: String(row.attribute_name),
      display_value: String(row.display_value ?? ""),
      sort_order: Number(row.sort_order ?? 0),
    };
    const existing = byProduct.get(productId);
    if (existing) {
      existing.push(entry);
    } else {
      byProduct.set(productId, [entry]);
    }
  }

  return items.map((item) => ({
    ...item,
    card_attributes: byProduct.get(item.id) ?? [],
  }));
}

export async function enrichCatalogProductListItems(
  items: CatalogProductListItem[]
): Promise<CatalogProductListItem[]> {
  return attachCardAttributes(items);
}

export async function getCategoryFilters(
  categoryId: string
): Promise<CategoryFilterDefinition[]> {
  const supabase = requirePublicClient();
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

type FilterProductsInput = {
  categoryId?: string;
  shopId?: string;
  filters?: ProductFilters;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
  includeSubcategories?: boolean;
};

export async function filterProducts(
  input: FilterProductsInput
): Promise<CatalogProductListResult> {
  return runFilterProducts(requirePublicClient(), input);
}

async function runFilterProducts(
  supabase: SupabaseClient,
  input: FilterProductsInput
): Promise<CatalogProductListResult> {
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
    items: await attachCardAttributes(rows.map(mapListItem), supabase),
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
  const supabase = requirePublicClient();
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
    items: await attachCardAttributes(rows.map(mapListItem)),
    total,
    page,
    pageSize,
  };
}

export async function getSearchSuggestions(
  query: string,
  limit = 8
): Promise<SearchSuggestion[]> {
  const supabase = requirePublicClient();
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
  const supabase = requirePublicClient();
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
  const supabase = requirePublicClient();
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
  const supabase = requirePublicClient();
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
  return getCategoryBySlugKey(slugParts.join("/"));
}

const getCategoryBySlugKey = cache(async function getCategoryBySlugKey(
  slugKey: string
): Promise<CategoryRow | null> {
  const slugParts = slugKey.split("/").filter(Boolean);
  if (!slugParts.length) return null;

  const supabase = requirePublicClient();
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
});

export async function getCategoryBreadcrumb(
  categoryId: string
): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = requirePublicClient();
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

export async function getCategorySlugPath(categoryId: string): Promise<string> {
  const supabase = requirePublicClient();
  const { data, error } = await supabase.rpc("category_slug_path", {
    p_category_id: categoryId,
  });
  if (error) throw new Error(error.message);

  const slugPath = String(data ?? "").trim().replace(/^\/+|\/+$/g, "");
  return slugPath;
}

/** id → full slug path for every visible category, built from a single query. */
const getCategorySlugPathMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const supabase = requirePublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, parent_id");
    if (error) throw new Error(error.message);

    const byId = new Map(
      (data ?? []).map((row) => [
        String(row.id),
        {
          slug: String(row.slug),
          parentId: (row.parent_id as string | null) ?? null,
        },
      ])
    );

    const paths: Record<string, string> = {};
    const resolve = (id: string, seen: Set<string>): string | null => {
      if (paths[id] !== undefined) return paths[id];
      const node = byId.get(id);
      if (!node || seen.has(id)) return null;
      seen.add(id);

      let path = node.slug;
      if (node.parentId) {
        const parentPath = resolve(node.parentId, seen);
        if (parentPath === null) return null;
        path = `${parentPath}/${node.slug}`;
      }
      paths[id] = path;
      return path;
    };

    for (const id of Array.from(byId.keys())) resolve(id, new Set());
    return paths;
  },
  ["category-slug-path-map"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CATEGORIES_TAG],
  }
);

export function buildCategoryHrefFromSlugPath(slugPath: string): string {
  const normalized = slugPath.trim().replace(/^\/+|\/+$/g, "");
  return normalized ? `/kategoriler/${normalized}` : "/kategoriler";
}

export async function attachCategoryHrefs<T extends { id: string }>(
  categories: T[]
): Promise<(T & { href: string })[]> {
  if (!categories.length) return [];

  const pathMap = await getCategorySlugPathMap();
  const hrefs = await Promise.all(
    categories.map(async (category) => {
      const slugPath =
        pathMap[category.id] ?? (await getCategorySlugPath(category.id));
      return buildCategoryHrefFromSlugPath(slugPath);
    })
  );

  return categories.map((category, index) => ({
    ...category,
    href: hrefs[index],
  }));
}

export function buildCategoryHref(crumbs: { slug: string }[]): string {
  return `/kategoriler/${crumbs.map((c) => c.slug).join("/")}`;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export const getProductBySlug = cache(async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const supabase = requirePublicClient();
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

  const [{ data: images }, { count: shopProductCount }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, url, alt_text, is_primary, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", product.shop_id)
      .eq("status", "ACTIVE")
      .is("archived_at", null),
  ]);

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
});

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

export const getShopBySlug = cache(async function getShopBySlug(
  slug: string
): Promise<ShopDetail | null> {
  const supabase = requirePublicClient();
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
});

const fetchActiveCategories = unstable_cache(
  async (): Promise<NavCategory[]> => {
    const supabase = requirePublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .eq("status", "active")
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return attachCategoryHrefs(
      (data ?? []) as Pick<NavCategory, "id" | "name" | "slug" | "parent_id">[]
    );
  },
  ["catalog-active-categories"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CATEGORIES_TAG],
  }
);

export const listActiveCategories = cache(fetchActiveCategories);

export async function getCategorySidebarContext(
  category: Pick<CategoryRow, "id" | "name" | "slug" | "parent_id">
): Promise<CategorySidebarContext> {
  const allCategories = await listActiveCategories();
  return buildCategorySidebarContext(category, allCategories);
}

const fetchNavCategories = unstable_cache(
  async (): Promise<NavCategory[]> => {
    const supabase = requirePublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .eq("status", "active")
      .eq("show_in_nav", true)
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return attachCategoryHrefs(
      (data ?? []) as Pick<NavCategory, "id" | "name" | "slug" | "parent_id">[]
    );
  },
  ["catalog-nav-categories"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CATEGORIES_TAG],
  }
);

export const listNavCategories = cache(fetchNavCategories);

export async function listPopularNavCategories(limit = 6): Promise<NavCategory[]> {
  const categories = await listNavCategories();
  const roots = categories.filter((category) => !category.parent_id);
  return roots.slice(0, limit);
}

export const listHomepageCategories = unstable_cache(
  async (): Promise<
    (NavCategory & { image_url: string | null; product_count: number })[]
  > => {
    const supabase = requirePublicClient();
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
    const [withHrefs, counts] = await Promise.all([
      attachCategoryHrefs(categories),
      Promise.all(
        categories.map(async (cat) => {
          const { count } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("status", "ACTIVE")
            .is("archived_at", null);
          return count ?? 0;
        })
      ),
    ]);

    return withHrefs.map((cat, index) => ({
      ...(cat as NavCategory & { image_url: string | null }),
      product_count: counts[index],
    }));
  },
  ["catalog-homepage-categories"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CATEGORIES_TAG, CATALOG_PRODUCTS_TAG],
  }
);

export const listFeaturedProducts = unstable_cache(
  async (limit = 8): Promise<CatalogProductListItem[]> => {
    const result = await runFilterProducts(requirePublicClient(), {
      page: 1,
      pageSize: limit,
      sort: "newest",
    });
    return result.items;
  },
  ["catalog-featured-products"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_PRODUCTS_TAG],
  }
);

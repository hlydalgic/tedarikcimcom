import type {
  AttributeFilterValue,
  CategoryFilterDefinition,
  CatalogSort,
  ProductFilters,
} from "@/lib/catalog/types";

const SORT_KEY = "sira";
const PAGE_KEY = "sayfa";

const SYSTEM_PARAM: Record<string, keyof ProductFilters> = {
  fiyat_min: "price_min",
  fiyat_max: "price_max",
  marka: "brand_ids",
  satici: "shop_ids",
  stok: "in_stock",
  ucretsiz_kargo: "free_shipping",
  puan: "rating_min",
};

const SYSTEM_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(SYSTEM_PARAM).map(([k, v]) => [v, k])
);

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseBool(value: string | undefined): boolean | undefined {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

function splitList(value: string | undefined): string[] | undefined {
  if (!value?.trim()) return undefined;
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

/** Parse URL search params into filter state using category filter definitions. */
export function parseFiltersFromSearchParams(
  params: URLSearchParams,
  filterDefs: CategoryFilterDefinition[]
): { filters: ProductFilters; sort: CatalogSort; page: number } {
  const filters: ProductFilters = {};
  const attributes: Record<string, AttributeFilterValue> = {};

  for (const [key, raw] of Array.from(params.entries())) {
    if (key === SORT_KEY) continue;
    if (key === PAGE_KEY) continue;

    const systemField = SYSTEM_PARAM[key];
    if (systemField === "price_min" || systemField === "price_max") {
      filters[systemField] = parseNumber(raw);
      continue;
    }
    if (systemField === "brand_ids" || systemField === "shop_ids") {
      filters[systemField] = splitList(raw);
      continue;
    }
    if (systemField === "in_stock" || systemField === "free_shipping") {
      filters[systemField] = parseBool(raw);
      continue;
    }
    if (systemField === "rating_min") {
      filters.rating_min = parseNumber(raw);
      continue;
    }

    const def = filterDefs.find(
      (f) =>
        f.attribute_id &&
        (f.attribute_slug === key || f.attribute_id === key)
    );
    if (!def?.attribute_id) continue;

    const attrId = def.attribute_id;

    if (
      def.display_type === "RANGE_SLIDER" ||
      def.display_type === "MIN_MAX"
    ) {
      const [minStr, maxStr] = raw.split(":");
      attributes[attrId] = {
        type: "range",
        min: parseNumber(minStr),
        max: parseNumber(maxStr),
      };
      continue;
    }

    if (def.display_type === "TOGGLE") {
      attributes[attrId] = { type: "boolean", value: raw === "1" };
      continue;
    }

    if (
      def.display_type === "CHECKBOX" ||
      def.display_type === "RADIO" ||
      def.display_type === "MULTI_SELECT" ||
      def.display_type === "SELECT" ||
      def.display_type === "COLOR_SWATCHES" ||
      def.display_type === "SEARCHABLE_CHECKBOX_LIST"
    ) {
      const values = splitList(raw) ?? [];
      if (def.attribute_type === "TEXT") {
        attributes[attrId] = { type: "text", values };
      } else {
        attributes[attrId] = { type: "options", values };
      }
    }
  }

  if (Object.keys(attributes).length) {
    filters.attributes = attributes;
  }

  const sortRaw = params.get(SORT_KEY);
  const sort: CatalogSort =
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "newest"
      ? sortRaw
      : "newest";

  const page = Math.max(1, parseInt(params.get(PAGE_KEY) ?? "1", 10) || 1);

  return { filters, sort, page };
}

function resolveSystemParamKey(field: keyof ProductFilters): string {
  return SYSTEM_REVERSE[field] ?? field;
}

function filterParamKey(def: CategoryFilterDefinition): string | null {
  if (def.system_filter_key) {
    switch (def.system_filter_key) {
      case "price":
        return null;
      case "brand":
        return "marka";
      case "seller":
        return "satici";
      case "in_stock":
        return "stok";
      case "free_shipping":
        return "ucretsiz_kargo";
      case "rating":
        return "puan";
      default:
        return def.system_filter_key;
    }
  }
  return def.attribute_slug ?? def.attribute_id;
}

/** Serialize filters to URLSearchParams for shareable / back-nav friendly URLs. */
export function buildSearchParamsFromFilters(input: {
  filters: ProductFilters;
  sort: CatalogSort;
  page: number;
  filterDefs: CategoryFilterDefinition[];
}): URLSearchParams {
  const params = new URLSearchParams();
  const { filters, sort, page, filterDefs } = input;

  if (filters.price_min != null) {
    params.set("fiyat_min", String(filters.price_min));
  }
  if (filters.price_max != null) {
    params.set("fiyat_max", String(filters.price_max));
  }
  if (filters.brand_ids?.length) {
    params.set("marka", filters.brand_ids.join(","));
  }
  if (filters.shop_ids?.length) {
    params.set("satici", filters.shop_ids.join(","));
  }
  if (filters.in_stock != null) {
    params.set("stok", filters.in_stock ? "1" : "0");
  }
  if (filters.free_shipping != null) {
    params.set("ucretsiz_kargo", filters.free_shipping ? "1" : "0");
  }
  if (filters.rating_min != null) {
    params.set("puan", String(filters.rating_min));
  }

  if (filters.attributes) {
    for (const def of filterDefs) {
      if (!def.attribute_id) continue;
      const val = filters.attributes[def.attribute_id];
      if (!val) continue;

      const key = filterParamKey(def);
      if (!key) continue;

      if (val.type === "range") {
        const min = val.min ?? "";
        const max = val.max ?? "";
        if (min !== "" || max !== "") {
          params.set(key, `${min}:${max}`);
        }
      } else if (val.type === "boolean") {
        params.set(key, val.value ? "1" : "0");
      } else if (val.type === "options" || val.type === "text") {
        if (val.values.length) {
          params.set(key, val.values.join(","));
        }
      }
    }
  }

  if (sort !== "newest") {
    params.set(SORT_KEY, sort);
  }
  if (page > 1) {
    params.set(PAGE_KEY, String(page));
  }

  return params;
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  if (filters.price_min != null || filters.price_max != null) return true;
  if (filters.brand_ids?.length) return true;
  if (filters.shop_ids?.length) return true;
  if (filters.in_stock != null) return true;
  if (filters.free_shipping != null) return true;
  if (filters.rating_min != null) return true;
  if (filters.attributes && Object.keys(filters.attributes).length) return true;
  return false;
}

export { SORT_KEY, PAGE_KEY, resolveSystemParamKey, filterParamKey };

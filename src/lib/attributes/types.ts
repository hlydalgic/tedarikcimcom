export type AttributeType =
  | "SELECT"
  | "MULTI_SELECT"
  | "BOOLEAN"
  | "NUMBER"
  | "NUMBER_WITH_UNIT"
  | "RANGE"
  | "TEXT"
  | "TEXTAREA"
  | "COLOR"
  | "DATE"
  | "YEAR";

export type FilterDisplayType =
  | "CHECKBOX"
  | "RADIO"
  | "SELECT"
  | "MULTI_SELECT"
  | "RANGE_SLIDER"
  | "MIN_MAX"
  | "TOGGLE"
  | "COLOR_SWATCHES"
  | "SEARCHABLE_CHECKBOX_LIST";

export type SystemFilterKey =
  | "price"
  | "seller"
  | "brand"
  | "in_stock"
  | "free_shipping"
  | "rating";

export type UnitRow = {
  id: string;
  name: string;
  symbol: string;
  category: string;
};

export type AttributeOptionRow = {
  id: string;
  attribute_id: string;
  label: string;
  value: string;
  sort_order: number;
  color_hex: string | null;
  status: string;
};

export type AttributeRow = {
  id: string;
  name: string;
  slug: string;
  type: AttributeType;
  unit_id: string | null;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  comparable: boolean;
  is_variant_attribute: boolean;
  show_on_card: boolean;
  show_on_detail: boolean;
  show_in_specs: boolean;
  show_in_seller_form: boolean;
  sort_order: number;
  placeholder: string | null;
  help_text: string | null;
  default_value: string | null;
  validation_rules: Record<string, unknown>;
  status: string;
};

export type CategoryAttributeRow = {
  id: string;
  category_id: string;
  attribute_id: string;
  inherited: boolean;
  inherited_from_category_id: string | null;
  override_required: boolean | null;
  override_sort_order: number | null;
  override_filterable: boolean | null;
  override_show_in_seller_form: boolean | null;
  is_active: boolean;
  filter_display_type: FilterDisplayType | null;
};

export type CategoryFilterRow = {
  id: string;
  category_id: string;
  attribute_id: string | null;
  system_filter_key: SystemFilterKey | null;
  display_type: FilterDisplayType;
  sort_order: number;
  is_enabled: boolean;
  default_collapsed: boolean;
  label_override: string | null;
};

export const ATTRIBUTE_TYPES: AttributeType[] = [
  "SELECT",
  "MULTI_SELECT",
  "BOOLEAN",
  "NUMBER",
  "NUMBER_WITH_UNIT",
  "RANGE",
  "TEXT",
  "TEXTAREA",
  "COLOR",
  "DATE",
  "YEAR",
];

export const FILTER_DISPLAY_TYPES: FilterDisplayType[] = [
  "CHECKBOX",
  "RADIO",
  "SELECT",
  "MULTI_SELECT",
  "RANGE_SLIDER",
  "MIN_MAX",
  "TOGGLE",
  "COLOR_SWATCHES",
  "SEARCHABLE_CHECKBOX_LIST",
];

export const SYSTEM_FILTER_KEYS: { key: SystemFilterKey; label: string }[] = [
  { key: "price", label: "Fiyat" },
  { key: "seller", label: "Satıcı" },
  { key: "brand", label: "Marka" },
  { key: "in_stock", label: "Stokta" },
  { key: "free_shipping", label: "Ücretsiz kargo" },
  { key: "rating", label: "Puan" },
];

export function defaultFilterDisplayType(
  type: AttributeType
): FilterDisplayType {
  switch (type) {
    case "BOOLEAN":
      return "TOGGLE";
    case "NUMBER":
    case "NUMBER_WITH_UNIT":
    case "RANGE":
    case "YEAR":
      return "RANGE_SLIDER";
    case "COLOR":
      return "COLOR_SWATCHES";
    case "SELECT":
    case "MULTI_SELECT":
      return "CHECKBOX";
    case "TEXT":
      return "SEARCHABLE_CHECKBOX_LIST";
    default:
      return "CHECKBOX";
  }
}

export function defaultSystemFilterDisplay(
  key: SystemFilterKey
): FilterDisplayType {
  switch (key) {
    case "price":
      return "RANGE_SLIDER";
    case "in_stock":
    case "free_shipping":
      return "TOGGLE";
    case "seller":
    case "brand":
      return "SEARCHABLE_CHECKBOX_LIST";
    case "rating":
      return "CHECKBOX";
    default:
      return "CHECKBOX";
  }
}

export function slugifyAttributeName(name: string): string {
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

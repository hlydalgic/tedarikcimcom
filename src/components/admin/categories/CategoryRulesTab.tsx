"use client";

import { useEffect, useState, useTransition } from "react";
import { updateCategoryRules } from "@/app/actions/categories";
import {
  PRODUCT_CONDITIONS,
  SHIPPING_TYPES,
  type CategoryRow,
  type ProductCondition,
  type ShippingType,
} from "@/lib/categories/types";

type Props = {
  category: CategoryRow;
  onMessage: (msg: string) => void;
  onError: (msg: string) => void;
};

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5 rounded-xl border border-border bg-background px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        {label}
      </span>
      {hint ? <span className="pl-6 text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function CategoryRulesTab({ category, onMessage, onError }: Props) {
  const [pending, startTransition] = useTransition();
  const [requiredImageCount, setRequiredImageCount] = useState(
    category.required_image_count ?? 1
  );
  const [brandRequired, setBrandRequired] = useState(
    category.brand_required ?? false
  );
  const [skuRequired, setSkuRequired] = useState(category.sku_required ?? false);
  const [barcodeRequired, setBarcodeRequired] = useState(
    category.barcode_required ?? false
  );
  const [conditions, setConditions] = useState<ProductCondition[]>(
    category.condition_allowed?.length
      ? category.condition_allowed
      : ["new", "refurbished", "used"]
  );
  const [shipping, setShipping] = useState<ShippingType[]>(
    category.allowed_shipping_types?.length
      ? category.allowed_shipping_types
      : ["STANDARD", "FREE", "SELLER_DEFINED", "QUOTE_REQUIRED", "PICKUP"]
  );
  const [approvalRequired, setApprovalRequired] = useState(
    category.product_approval_required ?? false
  );
  const [minDesc, setMinDesc] = useState(
    category.min_description_length ?? 0
  );

  useEffect(() => {
    setRequiredImageCount(category.required_image_count ?? 1);
    setBrandRequired(category.brand_required ?? false);
    setSkuRequired(category.sku_required ?? false);
    setBarcodeRequired(category.barcode_required ?? false);
    setConditions(
      category.condition_allowed?.length
        ? category.condition_allowed
        : ["new", "refurbished", "used"]
    );
    setShipping(
      category.allowed_shipping_types?.length
        ? category.allowed_shipping_types
        : ["STANDARD", "FREE", "SELLER_DEFINED", "QUOTE_REQUIRED", "PICKUP"]
    );
    setApprovalRequired(category.product_approval_required ?? false);
    setMinDesc(category.min_description_length ?? 0);
  }, [category.id, category.updated_at]);

  const toggleCondition = (value: ProductCondition) => {
    setConditions((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const toggleShipping = (value: ShippingType) => {
    setShipping((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const save = () => {
    startTransition(async () => {
      const result = await updateCategoryRules({
        categoryId: category.id,
        requiredImageCount,
        brandRequired,
        skuRequired,
        barcodeRequired,
        conditionAllowed: conditions,
        allowedShippingTypes: shipping,
        productApprovalRequired: approvalRequired,
        minDescriptionLength: minDesc,
      });
      if (result.error) onError(result.error);
      else onMessage("Ürün kuralları kaydedildi.");
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-ink">Ürün kuralları</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Bu kategoride satıcı formu ve moderasyon için zorunluluklar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Min. görsel sayısı
          </label>
          <input
            type="number"
            min={0}
            value={requiredImageCount}
            onChange={(e) => setRequiredImageCount(Number(e.target.value) || 0)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Min. açıklama uzunluğu
          </label>
          <input
            type="number"
            min={0}
            value={minDesc}
            onChange={(e) => setMinDesc(Number(e.target.value) || 0)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          label="Marka zorunlu"
          checked={brandRequired}
          onChange={setBrandRequired}
        />
        <Toggle
          label="SKU zorunlu"
          checked={skuRequired}
          onChange={setSkuRequired}
        />
        <Toggle
          label="Barkod zorunlu"
          checked={barcodeRequired}
          onChange={setBarcodeRequired}
        />
        <Toggle
          label="Admin onayı zorunlu"
          checked={approvalRequired}
          onChange={setApprovalRequired}
          hint="Bu kategorideki ürünler her zaman onay bekler."
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">İzin verilen durumlar</p>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CONDITIONS.map((c) => (
            <label
              key={c.value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                conditions.includes(c.value)
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-background text-ink-muted"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={conditions.includes(c.value)}
                onChange={() => toggleCondition(c.value)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">İzin verilen kargo tipleri</p>
        <div className="flex flex-wrap gap-2">
          {SHIPPING_TYPES.map((s) => (
            <label
              key={s.value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                shipping.includes(s.value)
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-background text-ink-muted"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={shipping.includes(s.value)}
                onChange={() => toggleShipping(s.value)}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Kuralları kaydet"}
        </button>
      </div>
    </div>
  );
}

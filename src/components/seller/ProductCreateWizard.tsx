"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, uploadProductImage } from "@/app/actions/products";
import { DynamicAttributeInput } from "@/components/seller/DynamicAttributeInput";
import type { CategoryTreeNode } from "@/lib/categories/types";
import {
  PRODUCT_CONDITIONS,
  SHIPPING_TYPES,
} from "@/lib/categories/types";
import type { SellerFormSchema } from "@/lib/seller/form-schema";

type Props = {
  categoryTree: CategoryTreeNode[];
  loadSchema: (categoryId: string) => Promise<SellerFormSchema>;
};

function collectLeaves(
  nodes: CategoryTreeNode[],
  path: string[] = []
): { id: string; label: string; depth: number }[] {
  const out: { id: string; label: string; depth: number }[] = [];
  for (const n of nodes) {
    const nextPath = [...path, n.name];
    if (n.children.length === 0) {
      out.push({
        id: n.id,
        label: nextPath.join(" › "),
        depth: n.depth,
      });
    } else {
      out.push(...collectLeaves(n.children, nextPath));
    }
  }
  return out;
}

export function ProductCreateWizard({ categoryTree, loadSchema }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categoryId, setCategoryId] = useState("");
  const [schema, setSchema] = useState<SellerFormSchema | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [stock, setStock] = useState("0");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [condition, setCondition] = useState("new");
  const [shippingType, setShippingType] = useState("STANDARD");
  const [attrValues, setAttrValues] = useState<Record<string, unknown>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const leaves = useMemo(() => collectLeaves(categoryTree), [categoryTree]);

  const groupedFields = useMemo(() => {
    if (!schema) return [];
    const groups = new Map<string, typeof schema.fields>();
    for (const f of schema.fields) {
      const key = f.groupLabel ?? "Bu kategori";
      const list = groups.get(key) ?? [];
      list.push(f);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [schema]);

  const onPickCategory = (id: string) => {
    setCategoryId(id);
    setError(null);
    startTransition(async () => {
      try {
        const s = await loadSchema(id);
        setSchema(s);
        setCondition(s.rules.conditionAllowed[0] ?? "new");
        setShippingType(s.rules.allowedShippingTypes[0] ?? "STANDARD");
        setAttrValues({});
        setStep(2);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Şema yüklenemedi.");
      }
    });
  };

  const onUploadImages = (files: FileList | null) => {
    if (!files?.length || !schema) return;
    const remaining = schema.rules.maxImages - imageUrls.length;
    const slice = Array.from(files).slice(0, remaining);
    startTransition(async () => {
      for (const file of slice) {
        const fd = new FormData();
        fd.set("file", file);
        const result = await uploadProductImage(fd);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.url) {
          setImageUrls((prev) => [...prev, result.url!]);
        }
      }
    });
  };

  const save = (submitForReview: boolean) => {
    if (!schema) return;
    setError(null);
    startTransition(async () => {
      const result = await createProduct({
        categoryId,
        title,
        description,
        brandId: brandId || null,
        price: Number(price),
        compareAtPrice: compareAt ? Number(compareAt) : null,
        stock: Number(stock) || 0,
        sku: sku || null,
        barcode: barcode || null,
        condition: condition as "new" | "refurbished" | "used",
        shippingType: shippingType as
          | "STANDARD"
          | "FREE"
          | "SELLER_DEFINED"
          | "QUOTE_REQUIRED"
          | "PICKUP",
        imageUrls,
        attributeValues: schema.fields.map((f) => ({
          attributeId: f.attributeId,
          type: f.type,
          value: attrValues[f.attributeId] ?? null,
        })),
        submitForReview,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/panel/urunler");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex gap-2 text-xs font-semibold uppercase tracking-wide">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1 ${
              step === s
                ? "bg-primary text-white"
                : step > s
                  ? "bg-primary-soft text-primary"
                  : "bg-background text-ink-muted"
            }`}
          >
            Adım {s}
          </span>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">Kategori seçin</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Yaprak (en alt) kategori seçilmelidir.
          </p>
          <div className="mt-4 max-h-96 space-y-1 overflow-y-auto">
            {leaves.map((leaf) => (
              <button
                key={leaf.id}
                type="button"
                disabled={pending}
                onClick={() => onPickCategory(leaf.id)}
                className={`flex w-full rounded-xl border px-4 py-3 text-left text-sm transition hover:border-primary ${
                  categoryId === leaf.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border"
                }`}
              >
                {leaf.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 && schema ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Ürün bilgileri
                </h2>
                <p className="text-sm text-ink-muted">{schema.categoryName}</p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-primary"
                onClick={() => setStep(1)}
              >
                Kategori değiştir
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Başlık *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Açıklama
                  {schema.rules.minDescriptionLength > 0
                    ? ` (min ${schema.rules.minDescriptionLength})`
                    : ""}{" "}
                  *
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Marka{schema.rules.brandRequired ? " *" : ""}
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">Seçin…</option>
                  {schema.brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Fiyat *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Karşılaştırma fiyatı
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={compareAt}
                    onChange={(e) => setCompareAt(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Stok *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    SKU{schema.rules.skuRequired ? " *" : ""}
                  </label>
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Barkod{schema.rules.barcodeRequired ? " *" : ""}
                  </label>
                  <input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Durum *
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  >
                    {PRODUCT_CONDITIONS.filter((c) =>
                      schema.rules.conditionAllowed.includes(c.value)
                    ).map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Kargo tipi *
                  </label>
                  <select
                    value={shippingType}
                    onChange={(e) => setShippingType(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  >
                    {SHIPPING_TYPES.filter((s) =>
                      schema.rules.allowedShippingTypes.includes(s.value)
                    ).map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Görseller (min {schema.rules.requiredImageCount}, max{" "}
                  {schema.rules.maxImages}) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={pending || imageUrls.length >= schema.rules.maxImages}
                  onChange={(e) => onUploadImages(e.target.files)}
                  className="block w-full text-xs"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {imageUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {groupedFields.map(([group, fields]) => (
            <div
              key={group}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h3 className="mb-4 font-display text-base font-semibold">
                {group}
                {group !== "Bu kategori" ? (
                  <span className="ml-2 text-xs font-normal text-ink-muted">
                    (inherited)
                  </span>
                ) : null}
              </h3>
              <div className="space-y-4">
                {fields.map((field) => (
                  <DynamicAttributeInput
                    key={field.attributeId}
                    field={field}
                    value={attrValues[field.attributeId]}
                    onChange={(v) =>
                      setAttrValues((prev) => ({
                        ...prev,
                        [field.attributeId]: v,
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={() => setStep(3)}
              className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Önizlemeye geç
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 && schema ? (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">Önizleme</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Kategori</dt>
              <dd>{schema.categoryName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Başlık</dt>
              <dd className="font-medium">{title || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Fiyat</dt>
              <dd>{price || "—"} ₺</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Stok</dt>
              <dd>{stock}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Görsel</dt>
              <dd>{imageUrls.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Özellik</dt>
              <dd>{schema.fields.length} alan</dd>
            </div>
          </dl>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="h-10 rounded-xl border border-border px-4 text-sm font-semibold"
            >
              Geri
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => save(false)}
              className="h-10 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-60"
            >
              Taslak kaydet
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => save(true)}
              className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              İncelemeye gönder
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

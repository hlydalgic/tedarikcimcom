"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createCategory,
  updateCategory,
  uploadCategoryImage,
  type CategoryActionState,
} from "@/app/actions/categories";
import { slugifyCategoryName, type CategoryRow } from "@/lib/categories/types";
import type {
  AttributeRow,
  CategoryAttributeRow,
  CategoryFilterRow,
  UnitRow,
} from "@/lib/attributes/types";
import { CategoryAttributesTab } from "@/components/admin/categories/CategoryAttributesTab";
import { CategoryFiltersTab } from "@/components/admin/categories/CategoryFiltersTab";
import { CategoryRulesTab } from "@/components/admin/categories/CategoryRulesTab";

const TABS = [
  "GENEL",
  "ALT KATEGORİLER",
  "ÖZELLİKLER",
  "FİLTRELER",
  "ÜRÜN KURALLARI",
  "SEO",
] as const;

type Tab = (typeof TABS)[number];

const ICON_OPTIONS = [
  "",
  "pipe",
  "valve",
  "wrench",
  "droplets",
  "building",
  "link",
  "box",
];

type Props = {
  mode: "create" | "edit";
  category?: CategoryRow;
  parentId?: string | null;
  flatCategories: CategoryRow[];
  attributes?: AttributeRow[];
  categoryAttributes?: CategoryAttributeRow[];
  categoryFilters?: CategoryFilterRow[];
  units?: UnitRow[];
  onCreated?: (id: string) => void;
  onMoved?: () => void;
  onError?: (message: string) => void;
  onMessage?: (message: string) => void;
  onMove?: (newParentId: string | null) => void;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "Kaydediliyor…" : label}
    </button>
  );
}

const initialState: CategoryActionState = {};

export function CategoryDetailPanel({
  mode,
  category,
  parentId = null,
  flatCategories,
  attributes = [],
  categoryAttributes = [],
  categoryFilters = [],
  units = [],
  onCreated,
  onMoved,
  onError,
  onMessage,
  onMove,
}: Props) {
  const [tab, setTab] = useState<Tab>("GENEL");
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [moveParentId, setMoveParentId] = useState<string>(
    category?.parent_id ?? ""
  );
  const [uploading, startUpload] = useTransition();

  const action = mode === "create" ? createCategory : updateCategory;
  const [state, formAction] = useFormState(action, initialState);

  useEffect(() => {
    if (mode === "edit" && category) {
      setName(category.name);
      setSlug(category.slug);
      setSlugTouched(true);
      setImageUrl(category.image_url ?? "");
      setMoveParentId(category.parent_id ?? "");
      setTab("GENEL");
    }
    if (mode === "create") {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setImageUrl("");
      setTab("GENEL");
    }
    // Reset form when switching category or create mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, category?.id]);

  useEffect(() => {
    if (state.error) onError?.(state.error);
    if (state.success && state.categoryId && mode === "create") {
      onCreated?.(state.categoryId);
    }
    if (state.success && mode === "edit") {
      onMoved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const parentLabel = parentId
    ? flatCategories.find((c) => c.id === parentId)?.name
    : null;

  const moveCandidates = flatCategories.filter((c) => {
    if (!category) return true;
    if (c.id === category.id) return false;
    // prevent picking own descendants via path prefix
    if (c.path.startsWith(category.path + ".")) return false;
    return c.status !== "archived";
  });

  const onFileChange = (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const result = await uploadCategoryImage(fd);
      if (result.error) onError?.(result.error);
      else if (result.url) setImageUrl(result.url);
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 pt-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {mode === "create"
                ? parentLabel
                  ? `Alt kategori: ${parentLabel}`
                  : "Yeni root kategori"
                : category?.name}
            </h2>
            {category ? (
              <p className="mt-1 font-mono text-[11px] text-ink-muted">
                path: {category.path}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition ${
                tab === item
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "GENEL" ? (
          <form action={formAction} className="mx-auto max-w-2xl space-y-5">
            {mode === "edit" && category ? (
              <input type="hidden" name="id" value={category.id} />
            ) : null}
            {mode === "create" ? (
              <input type="hidden" name="parent_id" value={parentId ?? ""} />
            ) : null}
            <input type="hidden" name="image_url" value={imageUrl} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Kategori adı
                </label>
                <input
                  name="name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugifyCategoryName(e.target.value));
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Slug
                </label>
                <input
                  name="slug"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={category?.description ?? ""}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Görsel
                </label>
                <div className="space-y-2">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-24 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-xs text-ink-muted">
                      Görsel yok
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    disabled={uploading}
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-ink-muted"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  İkon
                </label>
                <select
                  name="icon"
                  defaultValue={category?.icon ?? ""}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon || "none"} value={icon}>
                      {icon || "Yok"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Komisyon oranı (%)
                </label>
                <input
                  name="commission_rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="Platform default (8)"
                  defaultValue={category?.commission_rate ?? ""}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Boş bırakılırsa platform_settings default kullanılır.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Statü
                </label>
                <select
                  name="status"
                  defaultValue={
                    category?.status === "archived"
                      ? "inactive"
                      : category?.status ?? "active"
                  }
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Sıralama
                </label>
                <input
                  name="sort_order"
                  type="number"
                  min={0}
                  defaultValue={category?.sort_order ?? 0}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="show_on_homepage"
                  defaultChecked={category?.show_on_homepage ?? false}
                  className="h-4 w-4 rounded border-border"
                />
                Ana sayfada göster
              </label>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="show_in_nav"
                  defaultChecked={category?.show_in_nav ?? true}
                  className="h-4 w-4 rounded border-border"
                />
                Navigasyonda göster
              </label>
            </div>

            {mode === "edit" && category ? (
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="mb-2 text-sm font-medium text-ink">
                  Üst kategori (taşı)
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={moveParentId}
                    onChange={(e) => setMoveParentId(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm"
                  >
                    <option value="">Root (üst yok)</option>
                    {moveCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {"—".repeat(c.depth)} {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink hover:bg-surface"
                    onClick={() =>
                      onMove?.(moveParentId ? moveParentId : null)
                    }
                  >
                    Taşı
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <SubmitButton
                label={mode === "create" ? "Kategori oluştur" : "Kaydet"}
              />
            </div>
          </form>
        ) : tab === "ÖZELLİKLER" ? (
          mode === "edit" && category ? (
            <CategoryAttributesTab
              categoryId={category.id}
              categoryAttributes={categoryAttributes}
              attributes={attributes}
              units={units}
              onMessage={(msg) => onMessage?.(msg)}
              onError={(msg) => onError?.(msg)}
            />
          ) : (
            <p className="text-sm text-ink-muted">
              Önce kategoriyi oluşturun, sonra özellik ekleyin.
            </p>
          )
        ) : tab === "FİLTRELER" ? (
          mode === "edit" && category ? (
            <CategoryFiltersTab
              categoryId={category.id}
              categoryFilters={categoryFilters}
              categoryAttributes={categoryAttributes}
              attributes={attributes}
              onMessage={(msg) => onMessage?.(msg)}
              onError={(msg) => onError?.(msg)}
            />
          ) : (
            <p className="text-sm text-ink-muted">
              Önce kategoriyi oluşturun, sonra filtre ekleyin.
            </p>
          )
        ) : tab === "ÜRÜN KURALLARI" ? (
          mode === "edit" && category ? (
            <CategoryRulesTab
              category={category}
              onMessage={(msg) => onMessage?.(msg)}
              onError={(msg) => onError?.(msg)}
            />
          ) : (
            <p className="text-sm text-ink-muted">
              Önce kategoriyi oluşturun, sonra ürün kurallarını ayarlayın.
            </p>
          )
        ) : tab === "SEO" ? (
          <form action={formAction} className="mx-auto max-w-2xl space-y-4">
            {mode === "edit" && category ? (
              <>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="name" value={category.name} />
                <input type="hidden" name="slug" value={category.slug} />
                <input type="hidden" name="status" value={category.status === "archived" ? "inactive" : category.status} />
                <input type="hidden" name="sort_order" value={category.sort_order} />
                <input type="hidden" name="image_url" value={imageUrl} />
                {category.show_on_homepage ? (
                  <input type="hidden" name="show_on_homepage" value="on" />
                ) : null}
                {category.show_in_nav ? (
                  <input type="hidden" name="show_in_nav" value="on" />
                ) : null}
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                Önce kategoriyi oluşturun, sonra SEO alanlarını doldurun.
              </p>
            )}
            {mode === "edit" && category ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">SEO başlık</label>
                  <input
                    name="seo_title"
                    defaultValue={category.seo_title ?? ""}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    SEO açıklama
                  </label>
                  <textarea
                    name="seo_description"
                    rows={4}
                    defaultValue={category.seo_description ?? ""}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <SubmitButton label="SEO kaydet" />
              </>
            ) : null}
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-ink-muted">
            <p className="font-medium text-ink">{tab}</p>
            <p className="mt-2">
              Bu sekme Category Builder’ın sonraki adımında bağlanacak.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

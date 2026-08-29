"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import {
  createBrand,
  updateBrand,
  uploadBrandLogo,
} from "@/app/actions/brands";
import { slugifyBrandName, type BrandWithStats } from "@/lib/brands/types";
import type { CategoryRow } from "@/lib/categories/types";

type Props = {
  brands: BrandWithStats[];
  categories: CategoryRow[];
};

export function BrandsAdmin({ brands, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editBrand, setEditBrand] = useState<BrandWithStats | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const categoryLabel = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return map;
  }, [categories]);

  const openCreate = () => {
    setEditBrand(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setLogoUrl("");
    setStatus("active");
    setCategoryIds([]);
    setModal("create");
  };

  const openEdit = (b: BrandWithStats) => {
    setEditBrand(b);
    setName(b.name);
    setSlug(b.slug);
    setSlugTouched(true);
    setLogoUrl(b.logo_url ?? "");
    setStatus(b.status === "inactive" ? "inactive" : "active");
    setCategoryIds(b.category_ids);
    setModal("edit");
  };

  const onLogo = (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const result = await uploadBrandLogo(fd);
      if (result.error) setError(result.error);
      else if (result.url) setLogoUrl(result.url);
    });
  };

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = () => {
    startTransition(async () => {
      setError(null);
      if (modal === "edit" && editBrand) {
        const result = await updateBrand({
          id: editBrand.id,
          name,
          slug,
          logoUrl: logoUrl || null,
          status,
          categoryIds,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Marka güncellendi.");
      } else {
        const result = await createBrand({
          name,
          slug,
          logoUrl: logoUrl || null,
          status,
          categoryIds,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Marka oluşturuldu.");
      }
      setModal(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Markalar</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Marka kataloğu ve kategori ilişkileri
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni marka
        </button>
      </div>

      {error ? (
        <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          {message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Marka</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brands.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                  Henüz marka yok.
                </td>
              </tr>
            ) : (
              brands.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.logo_url}
                          alt=""
                          className="h-9 w-9 rounded-lg object-contain bg-background"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-xs text-ink-muted">
                          —
                        </div>
                      )}
                      <span className="font-medium text-ink">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {b.slug}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{b.category_count}</td>
                  <td className="px-4 py-3 text-ink-muted">{b.product_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        b.status === "active"
                          ? "bg-success/15 text-success"
                          : "bg-ink-muted/15 text-ink-muted"
                      }`}
                    >
                      {b.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded p-1.5 text-ink-muted hover:bg-background"
                      onClick={() => openEdit(b)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setModal(null)} />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-xl">
            <div className="border-b border-border px-5 py-4 font-display font-bold">
              {modal === "edit" ? "Marka düzenle" : "Yeni marka"}
            </div>
            <div className="space-y-3 overflow-y-auto px-5 py-4">
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugifyBrandName(e.target.value));
                }}
                placeholder="Ad"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="Slug"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm"
              />
              <div>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="mb-2 h-16 w-16 rounded-xl object-contain"
                  />
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onLogo(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-ink-muted"
                />
              </div>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "active" | "inactive")
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
              <div>
                <p className="mb-2 text-sm font-medium">Kategoriler</p>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                  {categories.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-background"
                    >
                      <input
                        type="checkbox"
                        checked={categoryIds.includes(c.id)}
                        onChange={() => toggleCategory(c.id)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="truncate">
                        {"—".repeat(c.depth)} {c.name}
                      </span>
                    </label>
                  ))}
                </div>
                {categoryIds.length > 0 ? (
                  <p className="mt-1 text-xs text-ink-muted">
                    {categoryIds
                      .map((id) => categoryLabel.get(id))
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-10 rounded-xl border border-border px-4 text-sm font-semibold"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { AppLink } from "@/components/ui/AppLink";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveProduct,
  archiveProduct,
  rejectProduct,
  suspendProduct,
} from "@/app/actions/products";
import type { AdminProductListItem } from "@/lib/admin/types";
import { formatMoneyTry } from "@/lib/format/money";

const STATUS_TABS = [
  { value: "PENDING_REVIEW", label: "Bekleyen" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "REJECTED", label: "Reddedildi" },
  { value: "SUSPENDED", label: "Askıda" },
  { value: "DRAFT", label: "Taslak" },
  { value: "ARCHIVED", label: "Arşiv" },
  { value: "ALL", label: "Tümü" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  ACTIVE: "Aktif",
  REJECTED: "Reddedildi",
  SUSPENDED: "Askıda",
  ARCHIVED: "Arşiv",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-ink-muted/15 text-ink-muted",
  PENDING_REVIEW: "bg-warning/15 text-warning",
  ACTIVE: "bg-success/15 text-success",
  REJECTED: "bg-error/15 text-error",
  SUSPENDED: "bg-warning/15 text-warning",
  ARCHIVED: "bg-ink-muted/15 text-ink-muted",
};

function formatProductDate(product: AdminProductListItem) {
  const date =
    product.status === "PENDING_REVIEW"
      ? product.submitted_for_review_at ?? product.created_at
      : product.updated_at;
  return new Date(date).toLocaleDateString("tr-TR");
}

export function AdminProductsAdmin({
  products,
  currentStatus,
}: {
  products: AdminProductListItem[];
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<AdminProductListItem | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string; success?: string }>) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await fn();
      if (result.error) setError(result.error);
      else {
        setMessage(result.success ?? "Tamam.");
        setSelected(null);
        setReason("");
        router.refresh();
      }
    });
  };

  const emptyLabel =
    STATUS_TABS.find((t) => t.value === currentStatus)?.label ?? "Ürün";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Ürünler</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ürün moderasyonu ve katalog yönetimi.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <AppLink
            key={tab.value}
            href={
              tab.value === "ALL"
                ? "/admin/urunler?durum=ALL"
                : `/admin/urunler?durum=${tab.value}`
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              currentStatus === tab.value
                ? "bg-primary text-white"
                : "bg-background text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </AppLink>
        ))}
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
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Satıcı / Mağaza</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Fiyat</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-ink-muted"
                >
                  {emptyLabel} ürün yok.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.title}</p>
                    {p.status === "REJECTED" && p.rejection_reason ? (
                      <p className="mt-1 text-xs text-error">
                        Red: {p.rejection_reason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    <p>{p.shop_name ?? "—"}</p>
                    <p className="text-xs">
                      {p.seller_name ?? p.seller_email ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {p.category_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{formatMoneyTry(p.price)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatProductDate(p)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        STATUS_STYLE[p.status] ?? ""
                      }`}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary"
                        onClick={() => setSelected(p)}
                      >
                        Detay
                      </button>
                      {p.status === "ACTIVE" ? (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-xs font-semibold text-warning disabled:opacity-60"
                          onClick={() => {
                            if (
                              !window.confirm(
                                "Bu ürünü askıya almak istiyor musunuz?"
                              )
                            ) {
                              return;
                            }
                            run(() => suspendProduct(p.id));
                          }}
                        >
                          Askıya al
                        </button>
                      ) : null}
                      {p.status !== "ARCHIVED" ? (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-xs font-semibold text-error disabled:opacity-60"
                          onClick={() => {
                            if (
                              !window.confirm(
                                "Bu ürünü arşivlemek istiyor musunuz?"
                              )
                            ) {
                              return;
                            }
                            run(() => archiveProduct(p.id));
                          }}
                        >
                          Arşivle
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setSelected(null)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
            {selected.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.image_url}
                alt=""
                className="mb-4 h-40 w-full rounded-xl object-cover"
              />
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold">{selected.title}</h3>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  STATUS_STYLE[selected.status] ?? ""
                }`}
              >
                {STATUS_LABEL[selected.status] ?? selected.status}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
              {selected.description || "Açıklama yok."}
            </p>
            {selected.rejection_reason ? (
              <p className="mt-2 text-sm text-error">
                Red gerekçesi: {selected.rejection_reason}
              </p>
            ) : null}
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Fiyat</dt>
                <dd>{formatMoneyTry(selected.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Stok</dt>
                <dd>{selected.stock}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Mağaza</dt>
                <dd>{selected.shop_name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Satıcı</dt>
                <dd>{selected.seller_name ?? selected.seller_email ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Kategori</dt>
                <dd>{selected.category_name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Tarih</dt>
                <dd>{formatProductDate(selected)}</dd>
              </div>
            </dl>
            {selected.status === "ACTIVE" ? (
              <AppLink
                href={`/urunler/${selected.slug}`}
                target="_blank"
                className="mt-4 inline-block text-sm font-semibold text-primary"
              >
                Mağazada görüntüle →
              </AppLink>
            ) : null}
            {selected.status === "PENDING_REVIEW" ? (
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={pending}
                  className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() => run(() => approveProduct(selected.id))}
                >
                  Onayla
                </button>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Red gerekçesi"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={pending}
                  className="h-10 w-full rounded-xl border border-error text-sm font-semibold text-error disabled:opacity-60"
                  onClick={() =>
                    run(() =>
                      rejectProduct({
                        productId: selected.id,
                        reason,
                      })
                    )
                  }
                >
                  Reddet
                </button>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
                {selected.status === "ACTIVE" ? (
                  <button
                    type="button"
                    disabled={pending}
                    className="h-10 rounded-xl border border-warning px-4 text-sm font-semibold text-warning disabled:opacity-60"
                    onClick={() => run(() => suspendProduct(selected.id))}
                  >
                    Askıya al
                  </button>
                ) : null}
                {selected.status !== "ARCHIVED" ? (
                  <button
                    type="button"
                    disabled={pending}
                    className="h-10 rounded-xl border border-error px-4 text-sm font-semibold text-error disabled:opacity-60"
                    onClick={() => run(() => archiveProduct(selected.id))}
                  >
                    Arşivle
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

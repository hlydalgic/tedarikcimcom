"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { archiveSellerProduct } from "@/app/actions/products";
import type { SellerProductListItem } from "@/lib/seller/types";
import { formatMoneyTry } from "@/lib/format/money";

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

type Props = {
  products: SellerProductListItem[];
  currentStatus: string;
};

export function SellerProductList({ products, currentStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const statuses = [
    "ALL",
    "DRAFT",
    "PENDING_REVIEW",
    "ACTIVE",
    "REJECTED",
    "SUSPENDED",
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s === "ALL" ? "/panel/urunler" : `/panel/urunler?status=${s}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              currentStatus === s
                ? "bg-primary text-white"
                : "bg-background text-ink-muted"
            }`}
          >
            {s === "ALL" ? "Tümü" : STATUS_LABEL[s] ?? s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Fiyat</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                  Ürün yok.{" "}
                  <Link href="/panel/urunler/ekle" className="text-primary">
                    Ürün ekle
                  </Link>
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
                    {p.category_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{formatMoneyTry(p.price)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        STATUS_STYLE[p.status] ?? ""
                      }`}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={pending}
                      className="text-xs font-semibold text-error"
                      onClick={() => {
                        if (!window.confirm("Ürünü arşivlemek istiyor musunuz?")) {
                          return;
                        }
                        startTransition(async () => {
                          await archiveSellerProduct(p.id);
                          router.refresh();
                        });
                      }}
                    >
                      Arşivle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

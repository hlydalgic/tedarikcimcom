"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveProduct, rejectProduct } from "@/app/actions/products";
import { formatMoneyTry } from "@/lib/format/money";

export type PendingProduct = {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: string;
  description: string | null;
  created_at: string;
  submitted_for_review_at: string | null;
  shop_name: string | null;
  seller_email: string | null;
  category_name: string | null;
  image_url: string | null;
};

export function ProductModerationAdmin({
  products,
}: {
  products: PendingProduct[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<PendingProduct | null>(null);
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Bekleyen ürünler
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          PENDING_REVIEW moderasyonu
        </p>
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
              <th className="px-4 py-3">Mağaza</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Fiyat</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                  Bekleyen ürün yok.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {p.shop_name}
                    <br />
                    <span className="text-xs">{p.seller_email}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {p.category_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{formatMoneyTry(p.price)}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {p.submitted_for_review_at
                      ? new Date(p.submitted_for_review_at).toLocaleDateString(
                          "tr-TR"
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary"
                      onClick={() => setSelected(p)}
                    >
                      İncele
                    </button>
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
            <h3 className="font-display text-lg font-bold">{selected.title}</h3>
            <p className="mt-2 text-sm text-ink-muted whitespace-pre-wrap">
              {selected.description || "Açıklama yok."}
            </p>
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
                <dd>{selected.shop_name}</dd>
              </div>
            </dl>
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

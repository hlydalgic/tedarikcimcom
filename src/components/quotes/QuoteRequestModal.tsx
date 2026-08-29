"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { createQuoteRequest } from "@/app/actions/quotes";
import type { AddressRow } from "@/lib/orders/types";

type Props = {
  productId: string;
  productTitle: string;
  maxQuantity: number;
  addresses: AddressRow[];
  isLoggedIn: boolean;
};

export function QuoteRequestModal({
  productId,
  productTitle,
  maxQuantity,
  addresses,
  isLoggedIn,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isLoggedIn) return;
          setOpen(true);
          setDone(false);
        }}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!isLoggedIn}
      >
        Nakliye Teklifi Al
      </button>
      {!isLoggedIn ? (
        <p className="text-xs text-ink-muted">
          Teklif almak için{" "}
          <Link href="/giris" className="font-semibold text-primary">
            giriş yapın
          </Link>
          .
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Nakliye teklifi talebi
                </h2>
                <p className="mt-1 text-xs text-ink-muted">{productTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-ink-muted hover:bg-background"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {done ? (
              <div className="mt-6 space-y-3 text-sm">
                <p className="text-ink">
                  Talebiniz alındı. Satıcı teklif verdiğinde e-posta ile
                  bilgilendirileceksiniz.
                </p>
                <Link
                  href="/hesabim/teklifler"
                  className="inline-flex font-semibold text-primary hover:text-primary-hover"
                >
                  Tekliflerime git →
                </Link>
              </div>
            ) : (
              <form
                className="mt-5 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  start(async () => {
                    const result = await createQuoteRequest({
                      productId,
                      quantity: Number(fd.get("quantity") || 1),
                      addressId: String(fd.get("addressId") || ""),
                      note: String(fd.get("note") || ""),
                    });
                    if (!result.ok) alert(result.error);
                    else setDone(true);
                  });
                }}
              >
                <div>
                  <label className="text-xs font-semibold text-ink">Miktar</label>
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    max={Math.max(1, maxQuantity)}
                    defaultValue={1}
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink">
                    Teslimat adresi
                  </label>
                  {addresses.length ? (
                    <select
                      name="addressId"
                      required
                      defaultValue={
                        addresses.find((a) => a.is_default_shipping)?.id ??
                        addresses[0]?.id
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title ? `${a.title} — ` : ""}
                          {a.full_name}, {a.district}/{a.city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700">
                      Kayıtlı adres yok.{" "}
                      <Link href="/odeme" className="font-semibold underline">
                        Ödeme sayfasından
                      </Link>{" "}
                      adres ekleyebilirsiniz.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink">Not</label>
                  <textarea
                    name="note"
                    rows={3}
                    placeholder="Teslimat detayı, vinç ihtiyacı vb."
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending || !addresses.length}
                  className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                >
                  {pending ? "Gönderiliyor…" : "Talebi gönder"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

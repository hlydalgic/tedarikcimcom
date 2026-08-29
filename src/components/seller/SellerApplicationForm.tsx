"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  submitSellerApplication,
  type SellerAppActionState,
} from "@/app/actions/seller-applications";
import type { CategoryRow } from "@/lib/categories/types";

const initialState: SellerAppActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "Gönderiliyor…" : "Başvuruyu gönder"}
    </button>
  );
}

export function SellerApplicationForm({
  categories,
}: {
  categories: CategoryRow[];
}) {
  const [state, action] = useFormState(submitSellerApplication, initialState);

  return (
    <form action={action} className="mx-auto max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Şirket adı</label>
          <input
            name="company_name"
            required
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Vergi no</label>
          <input
            name="tax_number"
            required
            inputMode="numeric"
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Vergi dairesi
          </label>
          <input
            name="tax_office"
            required
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">IBAN</label>
          <input
            name="iban"
            required
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Telefon</label>
          <input
            name="phone"
            type="tel"
            required
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Satış kategorileri</p>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-3">
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-background"
            >
              <input
                type="checkbox"
                name="category_ids"
                value={c.id}
                className="h-4 w-4 rounded border-border"
              />
              <span>
                {"—".repeat(c.depth)} {c.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Not (opsiyonel)</label>
        <textarea
          name="note"
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="e_invoice_declared"
          required
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span>
          e-Fatura veya e-Arşiv mükellefi olduğumu beyan ederim.
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="kvkk_accepted"
          required
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span>
          Kişisel verilerimin KVKK kapsamında işlenmesini kabul ediyorum.
        </span>
      </label>

      {state.error ? (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-success" role="status">
          {state.success}
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

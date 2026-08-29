"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "Kaydediliyor…" : "Kayıt ol"}
    </button>
  );
}

export function RegisterForm() {
  const [state, action] = useFormState(signUp, initialState);
  const [accountType, setAccountType] = useState<"individual" | "corporate">(
    "individual"
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-ink">
          Ad soyad
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Hesap tipi</legend>
        <div className="flex gap-2">
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold ${
              accountType === "individual"
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-ink-muted"
            }`}
          >
            <input
              type="radio"
              name="account_type"
              value="individual"
              checked={accountType === "individual"}
              onChange={() => setAccountType("individual")}
              className="sr-only"
            />
            Bireysel
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold ${
              accountType === "corporate"
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-ink-muted"
            }`}
          >
            <input
              type="radio"
              name="account_type"
              value="corporate"
              checked={accountType === "corporate"}
              onChange={() => setAccountType("corporate")}
              className="sr-only"
            />
            Kurumsal
          </label>
        </div>
      </fieldset>

      {accountType === "corporate" ? (
        <div className="space-y-3 rounded-xl border border-border bg-background p-4">
          <div>
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
        </div>
      ) : null}

      {state.error ? (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
      <p className="text-center text-sm text-ink-muted">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-medium text-primary">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}

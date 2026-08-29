"use client";

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

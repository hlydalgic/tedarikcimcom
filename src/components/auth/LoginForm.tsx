"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "Giriş yapılıyor…" : "Giriş yap"}
    </button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action] = useFormState(signIn, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />
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
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

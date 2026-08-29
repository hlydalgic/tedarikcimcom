"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  requestPasswordReset,
  type AuthActionState,
} from "@/app/actions/auth";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useFormState(requestPasswordReset, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
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
      <SubmitButton />
      <p className="text-center text-sm text-ink-muted">
        <Link href="/giris" className="font-medium text-primary">
          Girişe dön
        </Link>
      </p>
    </form>
  );
}

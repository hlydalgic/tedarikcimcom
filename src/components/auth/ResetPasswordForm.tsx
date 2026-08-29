"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updatePassword, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Kaydediliyor…" : "Şifreyi güncelle"}
    </button>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useFormState(updatePassword, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Yeni şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="password_confirm"
          className="mb-1.5 block text-sm font-medium"
        >
          Şifre tekrar
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
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

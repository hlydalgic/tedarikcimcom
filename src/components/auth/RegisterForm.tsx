"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/app/actions/auth";
import { RegisterSuccessCard } from "@/components/auth/RegisterSuccessCard";
import { BrandMark } from "@/components/branding/BrandMark";

const initialState: AuthActionState = {};

type Props = {
  shortName: string;
  logoUrl: string | null;
  marketplaceName: string;
};

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

export function RegisterForm({ shortName, logoUrl, marketplaceName }: Props) {
  const [state, action] = useFormState(signUp, initialState);

  if (state.success === "check_email") {
    return <RegisterSuccessCard shortName={shortName} logoUrl={logoUrl} />;
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark shortName={shortName} logoUrl={logoUrl} className="text-2xl" />
        <h1 className="mt-4 font-display text-xl font-bold text-ink">
          Hesap oluştur
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {marketplaceName} alışverişine başlayın.
        </p>
      </div>

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

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/" className="font-medium text-primary hover:text-primary-hover">
          Mağazaya dön
        </Link>
      </p>
    </>
  );
}

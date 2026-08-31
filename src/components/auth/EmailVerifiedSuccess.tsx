"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";

type Props = {
  shortName: string;
  logoUrl: string | null;
};

export function EmailVerifiedSuccess({ shortName, logoUrl }: Props) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.push("/giris");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-soft">
        <BrandMark shortName={shortName} logoUrl={logoUrl} className="text-2xl" />

        <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-border bg-background p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-7 w-7 text-accent" aria-hidden />
          </div>
          <h1 className="mt-5 font-display text-xl font-bold text-ink">
            E-postanız doğrulandı!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.
          </p>
        </div>

        <Link
          href="/giris"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Giriş Yap
        </Link>

        <p className="mt-4 text-xs text-ink-muted">
          3 saniye içinde giriş sayfasına yönlendirileceksiniz…
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandMark } from "@/components/branding/BrandMark";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

type GirisPageProps = {
  searchParams: {
    redirect?: string;
    registered?: string;
    reset?: string;
    error?: string;
  };
};

export default async function GirisPage({ searchParams }: GirisPageProps) {
  const settings = await getMarketplaceSettings();
  const redirectTo =
    searchParams.redirect && searchParams.redirect.startsWith("/")
      ? searchParams.redirect
      : "/";

  let notice: string | null = null;
  if (searchParams.registered === "1") {
    notice =
      "Kayıt başarılı. E-postanızdaki doğrulama bağlantısına tıklayın, ardından giriş yapın.";
  } else if (searchParams.reset === "1") {
    notice = "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.";
  } else if (searchParams.error === "auth") {
    notice = null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-soft">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark
            shortName={settings.short_name}
            logoUrl={settings.logo_url}
            className="text-2xl"
          />
          <h1 className="mt-4 font-display text-xl font-bold text-ink">
            Giriş yap
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {settings.marketplace_name} hesabınıza giriş yapın.
          </p>
        </div>
        {searchParams.error === "auth" ? (
          <p className="mb-4 text-sm text-error" role="alert">
            Doğrulama bağlantısı geçersiz veya süresi dolmuş.
          </p>
        ) : null}
        <LoginForm redirectTo={redirectTo} notice={notice} />
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/" className="font-medium text-primary hover:text-primary-hover">
            Mağazaya dön
          </Link>
        </p>
      </div>
    </div>
  );
}

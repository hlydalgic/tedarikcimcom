import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { BrandMark } from "@/components/branding/BrandMark";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function SifreSifirlaPage() {
  const settings = await getMarketplaceSettings();

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
            Şifremi unuttum
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            E-posta adresinize sıfırlama bağlantısı gönderilir.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/" className="font-medium text-primary">
            Mağazaya dön
          </Link>
        </p>
      </div>
    </div>
  );
}

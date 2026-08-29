import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { BrandMark } from "@/components/branding/BrandMark";
import { createClient } from "@/lib/supabase/server";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function YeniSifrePage() {
  const settings = await getMarketplaceSettings();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sifre-sifirla");
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
            Yeni şifre belirle
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Hesabınız için yeni bir şifre oluşturun.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}

import Link from "next/link";
import { Mail } from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";

type Props = {
  shortName: string;
  logoUrl: string | null;
};

export function RegisterSuccessCard({ shortName, logoUrl }: Props) {
  return (
    <div className="text-center">
      <BrandMark shortName={shortName} logoUrl={logoUrl} className="text-2xl" />

      <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-border bg-background p-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
          <Mail className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-ink">
          E-postanızı kontrol edin
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Hesabınız oluşturuldu. E-posta adresinize doğrulama bağlantısı
          gönderdik.
        </p>
      </div>

      <Link
        href="/giris"
        className="mt-8 inline-flex text-sm font-semibold text-primary hover:text-primary-hover"
      >
        Giriş sayfasına dön
      </Link>
    </div>
  );
}

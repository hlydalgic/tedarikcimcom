import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Çevrimdışı",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
        <WifiOff className="h-8 w-8 text-primary" aria-hidden />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-ink">
        İnternet bağlantısı yok
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Şu anda çevrimdışısınız. Bağlantınızı kontrol edip tekrar deneyin.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}

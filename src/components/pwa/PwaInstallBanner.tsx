"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePwaInstall } from "@/components/pwa/PwaInstallProvider";

export function PwaInstallBanner() {
  const pathname = usePathname();
  const { canShowBanner, promptInstall, dismissBanner } = usePwaInstall();

  if (pathname !== "/" || !canShowBanner) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[250] border-t border-border bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(13,27,62,0.12)] md:hidden"
      role="region"
      aria-label="Uygulamayı yükle"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <p className="min-w-0 flex-1 text-sm font-medium text-ink">
          📱 AhadaBuldum&apos;u ana ekrana ekle
        </p>
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Ekle
        </button>
        <button
          type="button"
          onClick={dismissBanner}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-background hover:text-ink"
          aria-label="Banner'ı kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

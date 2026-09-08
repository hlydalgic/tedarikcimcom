"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { IOS_PWA_INSTALL_STEPS } from "@/lib/pwa/install-utils";

export function PwaIosInstallModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-ios-install-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="pwa-ios-install-title"
              className="font-display text-lg font-bold text-ink"
            >
              Ana ekrana ekle
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              Safari&apos;de AhadaBuldum&apos;u uygulama olarak kullanın
            </p>
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-ink">
              {IOS_PWA_INSTALL_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-background hover:text-ink"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play, Smartphone, X } from "lucide-react";

type InstallPlatform = "ios" | "android";

const INSTALL_INSTRUCTIONS: Record<
  InstallPlatform,
  { title: string; steps: string }
> = {
  ios: {
    title: "iPhone / iPad",
    steps:
      "Safari'de aç → Alt menüdeki paylaş butonuna bas → Ana Ekrana Ekle",
  },
  android: {
    title: "Android",
    steps: "Chrome'da aç → Sağ üst menüye bas → Ana ekrana ekle",
  },
};

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        d="M16.365 1.43c0 1.14-.493 2.19-1.28 2.886-.806.714-2.126 1.26-3.292.996-.126-1.066.466-2.215 1.244-2.878.84-.72 2.174-1.265 3.328-1.004zM20.79 17.23c-.64 1.47-1.4 2.915-2.52 4.01-1 .98-2.09 2.04-3.58 2.06-1.37.02-1.77-.79-3.3-.79-1.53 0-2 .77-3.26.81-1.49.05-2.62-1.04-3.62-2.02-2.44-2.39-4.3-6.76-1.77-9.72 1.26-1.48 3.16-2.35 4.98-2.37 1.56-.03 3.03.84 3.97.84.94 0 2.71-1.04 4.58-.89.78.03 2.97.32 4.37 2.42-.11.07-2.61 1.52-2.58 4.53.03 3.6 3.15 4.79 3.19 4.81-.03.07-.5 1.72-1.24 3.42z"
      />
    </svg>
  );
}

function InstallModal({
  platform,
  onClose,
}: {
  platform: InstallPlatform;
  onClose: () => void;
}) {
  const info = INSTALL_INSTRUCTIONS[platform];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="install-modal-title"
              className="font-display text-lg font-bold text-ink"
            >
              {info.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {info.steps}
            </p>
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

        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background px-4 py-5">
          <div className="rounded-xl border border-border bg-white p-3">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://ahadabuldum.com"
              alt="ahadabuldum.com QR kodu"
              width={160}
              height={160}
              className="h-40 w-40"
            />
          </div>
          <p className="text-xs font-medium text-ink-muted">ahadabuldum.com</p>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[280px] md:max-w-[300px]">
      <div
        className="absolute -inset-6 rounded-[3rem] opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
      />
      <div className="relative rounded-[2.5rem] border border-white/15 bg-[#111827] p-3 shadow-2xl">
        <div className="absolute left-1/2 top-5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />
        <div className="relative overflow-hidden rounded-[2rem] bg-white">
          <div className="relative aspect-[9/19.5] w-full">
            <Image
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
              alt="AhadaBuldum mobil önizleme"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 280px, 300px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B3E]/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="font-display text-lg font-bold text-white">
                AhadaBuldum
              </p>
              <p className="mt-1 text-xs text-white/80">
                Teknik ürünler pazaryeri
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileAppSection() {
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);

  return (
    <>
      <section
        className="relative overflow-hidden py-16 md:py-20"
        style={{ backgroundColor: "#0D1B3E" }}
        aria-labelledby="mobile-app-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(10, 77, 140, 0.45), transparent 60%)",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2 md:gap-16 md:px-6 lg:px-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              <Smartphone className="h-3.5 w-3.5" />
              Mobil Uygulama
            </div>
            <h2
              id="mobile-app-heading"
              className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl"
            >
              Cebinizde Her Zaman Yanınızda
            </h2>
            <p className="mt-3 max-w-lg text-sm text-white/55 md:text-base">
              AhadaBuldum mobil uygulaması çok yakında
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPlatform("ios")}
                className="inline-flex h-12 min-w-[150px] items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
              >
                <AppleIcon className="h-5 w-5" />
                App Store
              </button>
              <button
                type="button"
                onClick={() => setPlatform("android")}
                className="inline-flex h-12 min-w-[150px] items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
              >
                <Play className="h-5 w-5 fill-current" />
                Google Play
              </button>
            </div>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {platform ? (
        <InstallModal platform={platform} onClose={() => setPlatform(null)} />
      ) : null}
    </>
  );
}

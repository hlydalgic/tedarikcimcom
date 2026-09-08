"use client";

import Image from "next/image";
import { Smartphone } from "lucide-react";
import { usePwaInstall } from "@/components/pwa/PwaInstallProvider";

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
  const { promptInstall } = usePwaInstall();

  return (
    <section
      className="relative overflow-hidden py-8 md:py-20"
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

      <div className="relative mx-auto max-w-7xl px-4 md:grid md:grid-cols-2 md:items-center md:gap-16 md:px-6 lg:px-8">
        <div className="text-center md:text-left">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 md:mb-4">
            <Smartphone className="h-3.5 w-3.5" />
            Mobil Uygulama
          </div>
          <h2
            id="mobile-app-heading"
            className="font-display text-xl font-bold tracking-tight text-white md:text-4xl"
          >
            Cebinizde Her Zaman Yanınızda
          </h2>
          <p className="mt-2 max-w-lg text-sm text-white/55 md:mt-3 md:text-base">
            AhadaBuldum mobil uygulaması çok yakında
          </p>

          <button
            type="button"
            onClick={() => void promptInstall()}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15 md:mt-8 md:h-12 md:px-6"
          >
            📱 Uygulamayı Yükle
          </button>
        </div>

        <div className="hidden md:block">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { mockNavCategories } from "@/lib/mock-data";

export function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="relative isolate min-h-[78vh] overflow-hidden md:min-h-[82vh]">
      <Image
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=2400&q=85"
        alt="Endüstriyel boru ve teknik ürün sahnesi"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      {/* Dark overlay — image remains visible */}
      <div className="absolute inset-0 bg-ink/60" />

      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-20 md:min-h-[82vh] md:grid-cols-[1.15fr_0.85fr] md:gap-12 md:px-6 md:py-24 lg:px-8">
        {/* Left: brand, headline, CTAs */}
        <div>
          <p className="animate-fade-up font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            tedarik<span className="text-accent">cim</span>
          </p>
          <h1 className="animate-fade-up animate-delay-100 mt-5 max-w-xl text-balance font-display text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            Türkiye&apos;nin Teknik Ürünler Pazaryeri
          </h1>
          <p className="animate-fade-up animate-delay-200 mt-5 max-w-lg text-base leading-relaxed text-white/85 md:text-lg">
            Boru, hırdavat, vana ve daha fazlası — güvenilir satıcılardan tek
            platformda
          </p>

          <div className="animate-fade-up animate-delay-300 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/#kategoriler"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-7 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Alışverişe Başla
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/satici-ol"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Satıcı Ol
            </Link>
          </div>
        </div>

        {/* Right: search + popular categories */}
        <div className="animate-fade-up animate-delay-200 rounded-2xl border border-white/20 bg-white/12 p-5 shadow-lift backdrop-blur-md md:p-6">
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="relative"
          >
            <label htmlFor="hero-search" className="sr-only">
              Ürün veya kategori ara
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              id="hero-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Boru, vana, hortum veya marka ara…"
              className="h-12 w-full rounded-xl border-0 bg-surface pl-10 pr-24 text-sm text-ink outline-none ring-2 ring-transparent transition focus:ring-accent/40"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Ara
            </button>
          </form>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-white/70">
            Popüler kategoriler
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {mockNavCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/kategori/${cat.slug}`}
                className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:border-white/50 hover:bg-white/20"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate min-h-[72vh] overflow-hidden md:min-h-[78vh]">
      <Image
        src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=2000&q=80"
        alt="Teknik ürün depo ve lojistik ortamı"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061528]/92 via-[#0a4d8c]/78 to-[#0a4d8c]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061528]/55 via-transparent to-transparent" />

      <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-4 pb-14 pt-28 md:min-h-[78vh] md:px-6 md:pb-20 lg:px-8">
        <p className="animate-fade-up font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          tedarik<span className="text-accent">cim</span>
        </p>
        <h1 className="animate-fade-up animate-delay-100 mt-4 max-w-2xl text-balance font-display text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl">
          Türkiye&apos;nin teknik ürünler pazaryeri
        </h1>
        <p className="animate-fade-up animate-delay-200 mt-4 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
          Boru, vana, hırdavat ve altyapı malzemelerini doğru satıcıdan, doğru
          spesifikasyonla bulun.
        </p>

        <div className="animate-fade-up animate-delay-300 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/#kategoriler"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            <Search className="h-4 w-4" />
            Ürün ara
          </Link>
          <Link
            href="/#kategoriler"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            Kategorilere göz at
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { mockCategories } from "@/lib/mock-data";

export function CategoryGrid() {
  return (
    <section id="kategoriler" className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Öne çıkan kategoriler
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-muted md:text-base">
            Teknik ürünleri kategoriye göre keşfedin. Filtreler ve özellikler
            kategori tanımına göre otomatik oluşur.
          </p>
        </div>
        <Link
          href="/kategoriler"
          className="hidden text-sm font-semibold text-primary hover:text-primary-hover sm:inline"
        >
          Tümünü gör
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {mockCategories.map((category, index) => (
          <Link
            key={category.id}
            href={`/kategori/${category.slug}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 16vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
              <h3 className="font-display text-sm font-semibold text-white md:text-base">
                {category.name}
              </h3>
              <p className="mt-0.5 text-[11px] text-white/70 md:text-xs">
                {category.productCount.toLocaleString("tr-TR")} ürün
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

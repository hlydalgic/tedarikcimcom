import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SellerCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-primary-soft/60 px-6 py-7 md:flex-row md:items-center md:px-8">
        <div>
          <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
            Teknik ürün satıyor musunuz?
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Mağazanızı açın, dinamik kategori formlarıyla ürünlerinizi hızlıca
            yayınlayın. Komisyon şeffaf, ödeme iyzico ile güvende.
          </p>
        </div>
        <Link
          href="/satici-ol"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-primary/20 bg-surface px-5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary hover:text-white"
        >
          Satıcı ol
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

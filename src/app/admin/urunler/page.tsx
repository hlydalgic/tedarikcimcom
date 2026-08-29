import Link from "next/link";

export default function AdminProductsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        Ürünler
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Ürün moderasyonu ve katalog yönetimi.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/urunler/bekleyen"
          className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/30"
        >
          <h2 className="font-display text-base font-semibold text-ink">
            Bekleyen ürünler
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            PENDING_REVIEW onay / red kuyruğu
          </p>
        </Link>
      </div>
    </div>
  );
}

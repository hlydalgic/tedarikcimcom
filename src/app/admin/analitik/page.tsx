import {
  getAnalyticsEventCounts,
  getAnalyticsFunnel,
} from "@/lib/admin/queries";

type PageProps = {
  searchParams: { days?: string };
};

const EVENT_LABELS: Record<string, string> = {
  view_home: "Ana sayfa görüntüleme",
  view_category: "Kategori görüntüleme",
  view_product: "Ürün görüntüleme",
  search: "Arama",
  apply_filter: "Filtre uygulama",
  add_to_favorite: "Favoriye ekleme",
  add_to_cart: "Sepete ekleme",
  begin_checkout: "Ödemeye başlama",
  purchase: "Satın alma",
  seller_signup_started: "Satıcı kaydı başlangıcı",
  seller_signup_completed: "Satıcı kaydı tamamlandı",
  product_published: "Ürün yayınlandı",
  quote_request_submitted: "Teklif talebi",
};

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const days = Math.min(
    90,
    Math.max(1, parseInt(searchParams.days ?? "30", 10) || 30)
  );

  const [events, funnel] = await Promise.all([
    getAnalyticsEventCounts(days),
    getAnalyticsFunnel(days),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Analitik</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Son {days} gün — marketplace KPI eventleri
      </p>

      <form className="mt-4 flex items-end gap-3 text-sm">
        <label>
          <span className="mb-1 block text-xs text-ink-muted">Gün</span>
          <select
            name="days"
            defaultValue={String(days)}
            className="h-10 rounded-lg border border-border bg-background px-3"
          >
            <option value="7">7 gün</option>
            <option value="30">30 gün</option>
            <option value="90">90 gün</option>
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-xs font-semibold text-white"
        >
          Filtrele
        </button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-ink-muted">Ürün görüntüleme</p>
          <p className="mt-1 text-2xl font-bold">{funnel.view_product}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-ink-muted">Sepete ekleme</p>
          <p className="mt-1 text-2xl font-bold">{funnel.add_to_cart}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-ink-muted">Ödemeye başlama</p>
          <p className="mt-1 text-2xl font-bold">{funnel.begin_checkout}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-ink-muted">Satın alma</p>
          <p className="mt-1 text-2xl font-bold">{funnel.purchase}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-ink-muted">Görüntüleme → Sepet</p>
          <p className="mt-1 text-xl font-bold">
            {(funnel.view_to_cart_rate * 100).toFixed(2)}%
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-ink-muted">Sepet → Satın alma</p>
          <p className="mt-1 text-xl font-bold">
            {(funnel.cart_to_purchase_rate * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">
          Event bazında sayılar
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-background text-left text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Adet</th>
              </tr>
            </thead>
            <tbody>
              {events.length ? (
                events.map((row) => (
                  <tr key={row.event_name} className="border-t border-border">
                    <td className="px-4 py-3">
                      {EVENT_LABELS[row.event_name] ?? row.event_name}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {row.event_count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-ink-muted">
                    Henüz event kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

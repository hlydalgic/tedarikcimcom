import {
  getSearchAnalytics,
  getZeroResultSearches,
} from "@/lib/admin/queries";

type PageProps = {
  searchParams: { days?: string };
};

export default async function AdminSearchAnalyticsPage({
  searchParams,
}: PageProps) {
  const days = Math.min(
    90,
    Math.max(1, parseInt(searchParams.days ?? "30", 10) || 30)
  );

  const [topQueries, zeroResults] = await Promise.all([
    getSearchAnalytics(days),
    getZeroResultSearches(days),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Arama analitiği
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Son {days} gün — arama terimleri, sıfır sonuç ve tıklama oranları
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

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            En çok aranan terimler
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-background text-left text-xs text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Terim</th>
                  <th className="px-4 py-3">Arama</th>
                  <th className="px-4 py-3">Ort. sonuç</th>
                  <th className="px-4 py-3">Tıklama</th>
                  <th className="px-4 py-3">CTR</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.length ? (
                  topQueries.map((row) => (
                    <tr key={row.query} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{row.query}</td>
                      <td className="px-4 py-3">{row.search_count}</td>
                      <td className="px-4 py-3">
                        {row.avg_result_count.toFixed(1)}
                      </td>
                      <td className="px-4 py-3">{row.click_count}</td>
                      <td className="px-4 py-3">
                        {(row.click_rate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                      Henüz arama verisi yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Sıfır sonuç dönen aramalar
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Yeni kategori / ürün talebi sinyali
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-background text-left text-xs text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Terim</th>
                  <th className="px-4 py-3">Arama sayısı</th>
                </tr>
              </thead>
              <tbody>
                {zeroResults.length ? (
                  zeroResults.map((row) => (
                    <tr key={row.query} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{row.query}</td>
                      <td className="px-4 py-3">{row.search_count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-ink-muted">
                      Sıfır sonuç kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

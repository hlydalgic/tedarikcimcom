import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { listBuyerQuoteRequests } from "@/lib/quotes/queries";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/types";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return { title: `Tekliflerim | ${settings.marketplace_name}` };
}

export default async function BuyerQuotesPage() {
  await requireUser("/hesabim/teklifler");
  const features = await getMarketplaceFeatures();
  if (!isFeatureEnabled(features, "quotes_enabled")) {
    redirect("/hesabim/profil");
  }

  const requests = await listBuyerQuoteRequests();

  return (
    <div>
      <Breadcrumb items={[{ name: "Nakliye tekliflerim" }]} />
      <h1 className="font-display text-2xl font-bold text-ink">
        Nakliye tekliflerim
      </h1>
      <div className="mt-6 space-y-3">
        {requests.length ? (
          requests.map((r) => (
            <Link
              key={r.id}
              href={`/hesabim/teklifler/${r.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4 transition hover:border-primary/30"
            >
              <div>
                <p className="font-semibold text-ink">{r.product_title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {r.quantity} adet · {r.quote_count} teklif ·{" "}
                  {new Date(r.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
              <p className="text-xs font-semibold text-ink-muted">
                {QUOTE_STATUS_LABELS[r.status] ?? r.status}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-muted">
            Henüz teklif talebiniz yok.
          </div>
        )}
      </div>
    </div>
  );
}

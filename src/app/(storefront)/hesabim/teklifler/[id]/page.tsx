import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";
import { getBuyerQuoteRequest } from "@/lib/quotes/queries";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/types";
import { formatPrice } from "@/lib/format";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { BuyerQuoteActions } from "@/components/quotes/BuyerQuoteActions";

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return {
    title: `Teklif detayı | ${settings.marketplace_name}`,
  };
}

export default async function BuyerQuoteDetailPage({ params }: PageProps) {
  await requireUser("/hesabim/teklifler");
  const features = await getMarketplaceFeatures();
  if (!isFeatureEnabled(features, "quotes_enabled")) {
    redirect("/hesabim/profil");
  }

  const request = await getBuyerQuoteRequest(params.id);
  if (!request) notFound();

  const addr = request.delivery_address;

  return (
    <div>
      <Breadcrumb
        items={[
          { name: "Tekliflerim", href: "/hesabim/teklifler" },
          { name: request.product_title },
        ]}
      />
      <h1 className="font-display text-2xl font-bold text-ink">
        {request.product_title}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {QUOTE_STATUS_LABELS[request.status] ?? request.status} ·{" "}
        {request.quantity} adet · Ürün:{" "}
        {formatPrice(request.product_price, request.product_currency)}
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold text-ink">Teslimat adresi</p>
        <p className="mt-1 text-ink-muted">
          {addr.full_name} · {addr.phone}
          <br />
          {addr.address_line}, {addr.district}/{addr.city}
        </p>
        {request.note ? (
          <p className="mt-3 text-ink-muted">
            <span className="font-semibold text-ink">Not:</span> {request.note}
          </p>
        ) : null}
        {request.expires_at ? (
          <p className="mt-2 text-xs text-ink-muted">
            Son geçerlilik:{" "}
            {new Date(request.expires_at).toLocaleString("tr-TR")}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-ink">Satıcı teklifleri</h2>
        <BuyerQuoteActions request={request} />
      </div>

      <Link
        href={`/urunler/${request.product_slug}`}
        className="mt-6 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
      >
        Ürüne dön
      </Link>
    </div>
  );
}

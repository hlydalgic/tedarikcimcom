import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getQuoteCheckoutDetail } from "@/lib/quotes/queries";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { QuoteCheckoutClient } from "@/components/quotes/QuoteCheckoutClient";

type PageProps = { params: { quote_id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return {
    title: `Teklif ödemesi | ${settings.marketplace_name}`,
  };
}

export default async function QuoteCheckoutPage({ params }: PageProps) {
  await requireUser(`/odeme/teklif/${params.quote_id}`);
  const detail = await getQuoteCheckoutDetail(params.quote_id);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">
        Teklif checkout
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Kabul ettiğiniz nakliye teklifi ile siparişinizi tamamlayın.
      </p>
      <div className="mt-8">
        <QuoteCheckoutClient detail={detail} />
      </div>
    </div>
  );
}

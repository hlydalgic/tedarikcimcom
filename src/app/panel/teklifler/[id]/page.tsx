import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSellerQuoteRequest } from "@/lib/quotes/queries";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/types";
import { SellerQuoteForm } from "@/components/quotes/SellerQuoteForm";

type PageProps = { params: { id: string } };

export const metadata: Metadata = {
  title: "Teklif talebi | Satıcı paneli",
};

export default async function PanelTeklifDetailPage({ params }: PageProps) {
  const request = await getSellerQuoteRequest(params.id);
  if (!request) notFound();

  const addr = request.delivery_address;

  return (
    <div>
      <Link
        href="/panel/teklifler"
        className="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        ← Teklif talepleri
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">
        {request.product_title}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {QUOTE_STATUS_LABELS[request.status] ?? request.status} ·{" "}
        {request.quantity} adet · {request.customer_name ?? "Alıcı"}
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold text-ink">Teslimat adresi</p>
        <p className="mt-1 text-ink-muted">
          {addr.full_name} · {addr.phone}
          <br />
          {addr.address_line}, {addr.district}/{addr.city}
        </p>
        {request.note ? (
          <p className="mt-3">
            <span className="font-semibold">Alıcı notu:</span> {request.note}
          </p>
        ) : null}
      </div>

      <SellerQuoteForm request={request} />
    </div>
  );
}

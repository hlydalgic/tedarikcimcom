import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { getOrderByNumberPublicForBuyer } from "@/lib/orders/queries";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders/types";

type PageProps = { params: { order_number: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return {
    title: `Sipariş ${params.order_number} | ${settings.marketplace_name}`,
  };
}

export default async function OrderSuccessPage({ params }: PageProps) {
  const user = await requireUser(`/siparis/${params.order_number}`);
  const order = await getOrderByNumberPublicForBuyer(params.order_number, user.id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
      <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
      <h1 className="mt-4 font-display text-2xl font-bold text-ink md:text-3xl">
        Siparişiniz alındı
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Sipariş numaranız:{" "}
        <span className="font-semibold text-ink">{order.order_number}</span>
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {ORDER_STATUS_LABELS[order.status] ?? order.status} ·{" "}
        {formatPrice(order.grand_total, order.currency)}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/hesabim/siparisler"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Siparişlerimi Görüntüle
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold text-ink"
        >
          Alışverişe devam
        </Link>
      </div>
    </div>
  );
}

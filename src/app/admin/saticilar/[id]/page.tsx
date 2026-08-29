import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSellerDetail } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";
import { SellerAdminActions } from "@/components/admin/marketplace/SellerAdminActions";

type PageProps = { params: { id: string } };

export default async function AdminSellerDetailPage({ params }: PageProps) {
  const detail = await getAdminSellerDetail(params.id);
  if (!detail) notFound();

  const shop = detail.shop as {
    id: string;
    name: string;
    slug: string;
    status: string;
    moderation_mode: string;
    company_name: string | null;
    created_at: string;
  };

  return (
    <div>
      <Link
        href="/admin/saticilar"
        className="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        ← Satıcılar
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">{shop.name}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {shop.status} · {shop.moderation_mode} · /magaza/{shop.slug}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Toplam satış</p>
          <p className="mt-1 text-xl font-bold">{formatPrice(detail.total_sales)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Komisyon</p>
          <p className="mt-1 text-xl font-bold">
            {formatPrice(detail.total_commission)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Gecikme geçmişi</p>
          <p className="mt-1 text-xl font-bold text-amber-700">
            {detail.delayed_count} gecikmiş
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold">Satıcı</p>
        <p className="mt-1 text-ink-muted">
          {detail.user?.full_name} · {detail.user?.email}
        </p>
        {shop.company_name ? (
          <p className="mt-1 text-ink-muted">Şirket: {shop.company_name}</p>
        ) : null}
      </div>

      <SellerAdminActions
        shopId={shop.id}
        status={shop.status}
        moderationMode={shop.moderation_mode}
      />

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-semibold text-ink">Son siparişler</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(detail.recent_orders as { suborder_number: string; status: string; subtotal: number; created_at: string }[]).map(
            (o) => (
              <li key={o.suborder_number} className="flex justify-between">
                <span>{o.suborder_number}</span>
                <span className="text-ink-muted">
                  {o.status} · {formatPrice(Number(o.subtotal))}
                </span>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminReturnDetail } from "@/lib/admin/queries";
import { ReturnAdminActions } from "@/components/admin/marketplace/ReturnAdminActions";

type PageProps = { params: { id: string } };

export default async function AdminReturnDetailPage({ params }: PageProps) {
  const row = await getAdminReturnDetail(params.id);
  if (!row) notFound();

  const canAct = row.status === "pending";

  return (
    <div>
      <Link
        href="/admin/iadeler"
        className="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        ← İadeler
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">
        İade talebi
      </h1>
      <p className="mt-1 text-sm text-ink-muted">{row.status}</p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="font-semibold">Gerekçe</p>
        <p className="mt-1">{row.reason}</p>
        {row.admin_note ? (
          <p className="mt-3 text-ink-muted">Admin notu: {row.admin_note}</p>
        ) : null}
      </div>

      {canAct ? <ReturnAdminActions returnId={String(row.id)} /> : null}
    </div>
  );
}

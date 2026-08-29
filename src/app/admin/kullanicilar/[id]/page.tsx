import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUserDetail } from "@/lib/admin/queries";
import { UserAdminActions } from "@/components/admin/marketplace/UserAdminActions";

type PageProps = { params: { id: string } };

export default async function AdminUserDetailPage({ params }: PageProps) {
  const user = await getAdminUserDetail(params.id);
  if (!user) notFound();

  const orders = Array.isArray(user.orders) ? user.orders : [];

  return (
    <div>
      <Link
        href="/admin/kullanicilar"
        className="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        ← Kullanıcılar
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">
        {user.full_name ?? user.email}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {user.status} · {(user.roles as string[]).join(", ")}
      </p>

      <UserAdminActions userId={String(user.id)} status={String(user.status)} />

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-semibold">Siparişler</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {orders.map((o: { id: string; order_number: string; status: string }) => (
            <li key={o.id} className="flex justify-between">
              <span>{o.order_number}</span>
              <span className="text-ink-muted">{o.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

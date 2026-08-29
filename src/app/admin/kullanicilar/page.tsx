import Link from "next/link";
import { listAdminUsers } from "@/lib/admin/queries";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Kullanıcılar</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-muted">
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Roller</th>
              <th className="px-4 py-3">Sipariş</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/kullanicilar/${u.id}`}
                    className="font-semibold text-primary"
                  >
                    {u.full_name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                <td className="px-4 py-3">{u.status}</td>
                <td className="px-4 py-3 text-xs">{u.roles.join(", ")}</td>
                <td className="px-4 py-3">{u.order_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

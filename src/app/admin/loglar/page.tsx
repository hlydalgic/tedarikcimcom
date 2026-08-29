import Link from "next/link";
import { listAdminLogs } from "@/lib/admin/queries";

type PageProps = {
  searchParams: { action?: string; entity?: string };
};

export default async function AdminLogsPage({ searchParams }: PageProps) {
  const logs = await listAdminLogs({
    action: searchParams.action,
    entityType: searchParams.entity,
    limit: 300,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">Admin logları</h1>
        <a
          href="/api/admin/export?type=logs"
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-background"
        >
          Excel export
        </a>
      </div>

      <div className="mt-6 space-y-3">
        {logs.map((log) => (
          <details
            key={log.id}
            className="rounded-2xl border border-border bg-surface p-4 text-sm"
          >
            <summary className="cursor-pointer font-semibold text-ink">
              {log.action} · {log.entity_type}
              <span className="ml-2 text-xs font-normal text-ink-muted">
                {log.admin_email} ·{" "}
                {new Date(log.created_at).toLocaleString("tr-TR")}
              </span>
            </summary>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-ink-muted">old_data</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-background p-2 text-xs">
                  {JSON.stringify(log.old_data, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted">new_data</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-background p-2 text-xs">
                  {JSON.stringify(log.new_data, null, 2)}
                </pre>
              </div>
            </div>
            <Link
              href={`/admin/loglar?action=${encodeURIComponent(log.action)}`}
              className="mt-2 inline-block text-xs text-primary"
            >
              Bu action ile filtrele
            </Link>
          </details>
        ))}
      </div>
    </div>
  );
}

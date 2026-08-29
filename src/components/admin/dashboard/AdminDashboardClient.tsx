"use client";

import type { GmvTrendRow } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

export function GmvTrendChart({ rows }: { rows: GmvTrendRow[] }) {
  const max = Math.max(...rows.map((r) => r.gmv), 1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="font-display text-base font-semibold text-ink">
        Satış trendi (son 30 gün)
      </h2>
      <div className="mt-4 flex h-40 items-end gap-1">
        {rows.map((r) => (
          <div
            key={r.day}
            className="group relative flex flex-1 flex-col items-center justify-end"
            title={`${r.day}: ${formatPrice(r.gmv)} (${r.order_count} sipariş)`}
          >
            <div
              className="w-full min-w-[4px] rounded-t bg-primary/80 transition hover:bg-primary"
              style={{ height: `${Math.max(4, (r.gmv / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink-muted">
        <span>{rows[0]?.day}</span>
        <span>{rows[rows.length - 1]?.day}</span>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        alert
          ? "border-amber-300 bg-amber-50"
          : "border-border bg-surface"
      }`}
    >
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

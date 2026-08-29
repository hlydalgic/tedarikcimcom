"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePlatformOpsSettings } from "@/app/actions/admin/marketplace";
import type { PlatformOpsSettings } from "@/lib/admin/types";

export function PlatformSettingsForm({
  initial,
}: {
  initial: PlatformOpsSettings;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        start(async () => {
          const r = await updatePlatformOpsSettings(form);
          if (!r.ok) alert(r.error);
          else {
            setMessage("Platform ayarları kaydedildi.");
            router.refresh();
          }
        });
      }}
    >
      <h2 className="font-display text-base font-semibold text-ink">
        Platform operasyon ayarları
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Kargo süresi (iş günü)
          </span>
          <input
            type="number"
            min={1}
            value={form.shipping_business_days}
            onChange={(e) =>
              setForm({ ...form, shipping_business_days: Number(e.target.value) })
            }
            className="h-10 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Gecikme uyarı eşiği (gün)
          </span>
          <input
            type="number"
            min={1}
            value={form.order_delay_warning_days}
            onChange={(e) =>
              setForm({
                ...form,
                order_delay_warning_days: Number(e.target.value),
              })
            }
            className="h-10 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Hakediş dönemi
          </span>
          <select
            value={form.settlement_period}
            onChange={(e) =>
              setForm({
                ...form,
                settlement_period: e.target.value as "weekly" | "monthly",
              })
            }
            className="h-10 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="weekly">Haftalık</option>
            <option value="monthly">Aylık</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Varsayılan komisyon (%)
          </span>
          <input
            type="number"
            min={0}
            step="0.1"
            value={form.default_commission_rate}
            onChange={(e) =>
              setForm({
                ...form,
                default_commission_rate: Number(e.target.value),
              })
            }
            className="h-10 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Hakediş gecikmesi (gün)
          </span>
          <input
            type="number"
            min={0}
            value={form.default_settlement_delay_days}
            onChange={(e) =>
              setForm({
                ...form,
                default_settlement_delay_days: Number(e.target.value),
              })
            }
            className="h-10 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Ödeme bekleme (gün)
          </span>
          <input
            type="number"
            min={0}
            value={form.payout_hold_days}
            onChange={(e) =>
              setForm({ ...form, payout_hold_days: Number(e.target.value) })
            }
            className="h-10 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
      </div>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Platform ayarlarını kaydet"}
      </button>
    </form>
  );
}

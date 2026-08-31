"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveSellerApplication,
  getSellerApplicationDocumentUrl,
  rejectSellerApplication,
} from "@/app/actions/seller-applications";
import { COMPANY_TYPE_LABELS, type CompanyType } from "@/lib/validation/seller-application";

export type SellerApplicationListItem = {
  id: string;
  user_id: string;
  company_type: string;
  company_name: string;
  shop_name: string | null;
  tax_number: string | null;
  tax_office: string | null;
  iban: string | null;
  bank_name: string | null;
  phone: string | null;
  activity_city: string | null;
  activity_district: string | null;
  activity_address: string | null;
  billing_same_as_activity: boolean;
  billing_city: string | null;
  billing_district: string | null;
  billing_address: string | null;
  return_city: string | null;
  return_district: string | null;
  return_address: string | null;
  category_ids: string[];
  e_invoice_declared: boolean;
  kvkk_accepted: boolean;
  seller_contract_accepted: boolean;
  tax_certificate_path: string | null;
  signature_circular_path: string | null;
  status: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  users: { email: string; full_name: string | null } | null;
};

type Props = {
  applications: SellerApplicationListItem[];
  categoryNames: Record<string, string>;
};

function formatAddress(
  city: string | null,
  district: string | null,
  address: string | null
) {
  if (!city && !district && !address) return "—";
  return [address, district, city].filter(Boolean).join(", ");
}

export function SellerApplicationsAdmin({
  applications,
  categoryNames,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<SellerApplicationListItem | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const list =
    filter === "pending"
      ? applications.filter((a) => a.status === "pending")
      : applications;

  const run = (fn: () => Promise<{ error?: string; success?: string }>) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await fn();
      if (result.error) setError(result.error);
      else {
        setMessage(result.success ?? "Kaydedildi.");
        setSelected(null);
        setRejectReason("");
        router.refresh();
      }
    });
  };

  const openDocument = (
    applicationId: string,
    kind: "tax_certificate" | "signature_circular"
  ) => {
    startTransition(async () => {
      const result = await getSellerApplicationDocumentUrl(applicationId, kind);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Satıcı başvuruları
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Onay / red ve mağaza oluşturma
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              filter === "pending"
                ? "bg-primary text-white"
                : "bg-background text-ink-muted"
            }`}
          >
            Bekleyen
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-background text-ink-muted"
            }`}
          >
            Tümü
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          {message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Mağaza</th>
              <th className="px-4 py-3">Başvuran</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-ink-muted"
                >
                  Kayıt yok.
                </td>
              </tr>
            ) : (
              list.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {app.shop_name ?? app.company_name}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {app.users?.full_name ?? "—"}
                    <br />
                    <span className="text-xs">{app.users?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(app.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary"
                      onClick={() => setSelected(app)}
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setSelected(null)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold">
              {selected.shop_name ?? selected.company_name}
            </h3>
            <dl className="mt-4 space-y-2 text-sm">
              <DetailRow
                label="Şirket türü"
                value={
                  COMPANY_TYPE_LABELS[selected.company_type as CompanyType] ??
                  selected.company_type
                }
              />
              <DetailRow label="Şirket unvanı" value={selected.company_name} />
              <DetailRow label="Mağaza adı" value={selected.shop_name} />
              <DetailRow label="E-posta" value={selected.users?.email} />
              <DetailRow label="Telefon" value={selected.phone} />
              <DetailRow label="Vergi no" value={selected.tax_number} />
              <DetailRow label="Vergi dairesi" value={selected.tax_office} />
              <DetailRow
                label="Faaliyet adresi"
                value={formatAddress(
                  selected.activity_city,
                  selected.activity_district,
                  selected.activity_address
                )}
              />
              <DetailRow
                label="Fatura adresi"
                value={
                  selected.billing_same_as_activity
                    ? "Faaliyet adresi ile aynı"
                    : formatAddress(
                        selected.billing_city,
                        selected.billing_district,
                        selected.billing_address
                      )
                }
              />
              <DetailRow
                label="İade/depo adresi"
                value={formatAddress(
                  selected.return_city,
                  selected.return_district,
                  selected.return_address
                )}
              />
              <DetailRow label="IBAN" value={selected.iban} mono />
              <DetailRow label="Banka" value={selected.bank_name} />
              <div>
                <dt className="text-ink-muted">Kategoriler</dt>
                <dd className="mt-1">
                  {(selected.category_ids ?? [])
                    .map((id) => categoryNames[id] ?? id)
                    .join(", ") || "—"}
                </dd>
              </div>
              <DetailRow
                label="e-Fatura"
                value={selected.e_invoice_declared ? "Evet" : "Hayır"}
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {selected.tax_certificate_path ? (
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-lg bg-background px-3 py-1.5 text-xs font-semibold text-primary"
                    onClick={() =>
                      openDocument(selected.id, "tax_certificate")
                    }
                  >
                    Vergi levhası
                  </button>
                ) : null}
                {selected.signature_circular_path ? (
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-lg bg-background px-3 py-1.5 text-xs font-semibold text-primary"
                    onClick={() =>
                      openDocument(selected.id, "signature_circular")
                    }
                  >
                    İmza sirküleri
                  </button>
                ) : null}
              </div>
            </dl>

            {selected.status === "pending" ? (
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={pending}
                  className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() =>
                    run(() => approveSellerApplication(selected.id))
                  }
                >
                  Onayla
                </button>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Red gerekçesi"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={pending}
                  className="h-10 w-full rounded-xl border border-error text-sm font-semibold text-error disabled:opacity-60"
                  onClick={() =>
                    run(() =>
                      rejectSellerApplication({
                        applicationId: selected.id,
                        reason: rejectReason,
                      })
                    )
                  }
                >
                  Reddet
                </button>
              </div>
            ) : selected.rejection_reason ? (
              <p className="mt-4 text-sm text-error">
                Gerekçe: {selected.rejection_reason}
              </p>
            ) : null}

            <button
              type="button"
              className="mt-4 text-sm text-ink-muted"
              onClick={() => setSelected(null)}
            >
              Kapat
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={`text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

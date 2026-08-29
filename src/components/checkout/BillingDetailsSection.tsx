"use client";

import { useMemo, useState } from "react";
import type { AddressSnapshot } from "@/lib/orders/types";
import { TR_CITIES } from "@/lib/orders/tr-cities";

export type BillingFormState = {
  full_name: string;
  tc_no: string;
  company_name: string;
  tax_number: string;
  tax_office: string;
  phone: string;
  city: string;
  district: string;
  address_line: string;
  postal_code: string;
};

export const emptyBillingForm = (defaults?: Partial<BillingFormState>): BillingFormState => ({
  full_name: defaults?.full_name ?? "",
  tc_no: defaults?.tc_no ?? "",
  company_name: defaults?.company_name ?? "",
  tax_number: defaults?.tax_number ?? "",
  tax_office: defaults?.tax_office ?? "",
  phone: defaults?.phone ?? "",
  city: defaults?.city ?? TR_CITIES[0]?.city ?? "",
  district: defaults?.district ?? TR_CITIES[0]?.districts[0] ?? "",
  address_line: defaults?.address_line ?? "",
  postal_code: defaults?.postal_code ?? "",
});

type Props = {
  billingSame: boolean;
  onBillingSameChange: (value: boolean) => void;
  billingType: "individual" | "corporate";
  onBillingTypeChange: (value: "individual" | "corporate") => void;
  billingForm: BillingFormState;
  onBillingFormChange: (patch: Partial<BillingFormState>) => void;
};

export function BillingDetailsSection({
  billingSame,
  onBillingSameChange,
  billingType,
  onBillingTypeChange,
  billingForm,
  onBillingFormChange,
}: Props) {
  const districts = useMemo(
    () => TR_CITIES.find((c) => c.city === billingForm.city)?.districts ?? [],
    [billingForm.city]
  );

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-ink">Fatura bilgileri</h3>
      <label className="mt-3 flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={billingSame}
          onChange={(e) => onBillingSameChange(e.target.checked)}
        />
        Fatura adresi teslimat ile aynı
      </label>

      {!billingSame ? (
        <div className="mt-4 space-y-4 rounded-xl border border-border bg-background p-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Fatura tipi</p>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={billingType === "individual"}
                  onChange={() => onBillingTypeChange("individual")}
                />
                Bireysel
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={billingType === "corporate"}
                  onChange={() => onBillingTypeChange("corporate")}
                />
                Kurumsal
              </label>
            </div>
          </div>

          {billingType === "individual" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Ad soyad</label>
                <input
                  required
                  value={billingForm.full_name}
                  onChange={(e) => onBillingFormChange({ full_name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  TC kimlik no <span className="text-ink-muted">(opsiyonel)</span>
                </label>
                <input
                  inputMode="numeric"
                  maxLength={11}
                  value={billingForm.tc_no}
                  onChange={(e) => onBillingFormChange({ tc_no: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Şirket adı</label>
                <input
                  required
                  value={billingForm.company_name}
                  onChange={(e) => onBillingFormChange({ company_name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Vergi no</label>
                <input
                  required
                  inputMode="numeric"
                  value={billingForm.tax_number}
                  onChange={(e) => onBillingFormChange({ tax_number: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Vergi dairesi</label>
                <input
                  required
                  value={billingForm.tax_office}
                  onChange={(e) => onBillingFormChange({ tax_office: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm font-medium text-ink">Fatura adresi</p>
            <input
              required
              placeholder="Telefon"
              value={billingForm.phone}
              onChange={(e) => onBillingFormChange({ phone: e.target.value })}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <input
              placeholder="Posta kodu"
              value={billingForm.postal_code}
              onChange={(e) => onBillingFormChange({ postal_code: e.target.value })}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <select
              required
              value={billingForm.city}
              onChange={(e) =>
                onBillingFormChange({
                  city: e.target.value,
                  district:
                    TR_CITIES.find((c) => c.city === e.target.value)?.districts[0] ?? "",
                })
              }
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {TR_CITIES.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city}
                </option>
              ))}
            </select>
            <select
              required
              value={billingForm.district}
              onChange={(e) => onBillingFormChange({ district: e.target.value })}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <textarea
              required
              placeholder="Açık adres"
              rows={2}
              value={billingForm.address_line}
              onChange={(e) => onBillingFormChange({ address_line: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function buildBillingSnapshot(
  billingSame: boolean,
  billingType: "individual" | "corporate",
  shipping: AddressSnapshot,
  billingForm: BillingFormState
): { billing_type: "individual" | "corporate"; billing_address: AddressSnapshot } {
  if (billingSame) {
    return {
      billing_type: "individual",
      billing_address: { ...shipping },
    };
  }

  if (billingType === "corporate") {
    return {
      billing_type: "corporate",
      billing_address: {
        full_name: billingForm.company_name.trim(),
        phone: billingForm.phone.trim(),
        city: billingForm.city,
        district: billingForm.district,
        address_line: billingForm.address_line.trim(),
        postal_code: billingForm.postal_code.trim() || undefined,
        company_name: billingForm.company_name.trim(),
        tax_number: billingForm.tax_number.replace(/\s/g, ""),
        tax_office: billingForm.tax_office.trim(),
      },
    };
  }

  return {
    billing_type: "individual",
    billing_address: {
      full_name: billingForm.full_name.trim(),
      phone: billingForm.phone.trim(),
      city: billingForm.city,
      district: billingForm.district,
      address_line: billingForm.address_line.trim(),
      postal_code: billingForm.postal_code.trim() || undefined,
      tc_no: billingForm.tc_no.trim() || undefined,
    },
  };
}

export function validateBillingInput(
  billingSame: boolean,
  billingType: "individual" | "corporate",
  billingForm: BillingFormState
): string | null {
  if (billingSame) return null;

  if (billingType === "individual") {
    if (billingForm.full_name.trim().length < 2) return "Fatura ad soyad gerekli.";
    if (billingForm.tc_no.trim() && !/^\d{11}$/.test(billingForm.tc_no.trim())) {
      return "TC kimlik no 11 haneli olmalı.";
    }
  } else {
    if (billingForm.company_name.trim().length < 2) return "Şirket adı gerekli.";
    const tax = billingForm.tax_number.replace(/\s/g, "");
    if (!/^\d{10,11}$/.test(tax)) return "Vergi no 10 veya 11 haneli olmalı.";
    if (billingForm.tax_office.trim().length < 2) return "Vergi dairesi gerekli.";
  }

  if (billingForm.phone.trim().length < 10) return "Fatura telefonu gerekli.";
  if (billingForm.address_line.trim().length < 5) return "Fatura adresi gerekli.";
  if (!billingForm.city || !billingForm.district) return "Fatura il/ilçe seçin.";

  return null;
}

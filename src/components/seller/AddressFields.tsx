"use client";

import {
  TURKEY_CITIES,
  getTurkeyDistricts,
} from "@/data/turkey-locations";

export type AddressValue = {
  city: string;
  district: string;
  address: string;
  postalCode?: string;
};

type Props = {
  idPrefix: string;
  label: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  disabled?: boolean;
  showPostalCode?: boolean;
};

export function AddressFields({
  idPrefix,
  label,
  value,
  onChange,
  disabled = false,
  showPostalCode = true,
}: Props) {
  const districts = getTurkeyDistricts(value.city);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}-city`}
            className="mb-1.5 block text-xs text-ink-muted"
          >
            İl
          </label>
          <select
            id={`${idPrefix}-city`}
            name={`${idPrefix}_city`}
            value={value.city}
            onChange={(e) =>
              onChange({
                city: e.target.value,
                district: "",
                address: value.address,
                postalCode: value.postalCode ?? "",
              })
            }
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          >
            <option value="">İl seçin</option>
            {TURKEY_CITIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-district`}
            className="mb-1.5 block text-xs text-ink-muted"
          >
            İlçe
          </label>
          <select
            id={`${idPrefix}-district`}
            name={`${idPrefix}_district`}
            key={`${idPrefix}-district-${value.city}`}
            value={value.district}
            onChange={(e) =>
              onChange({ ...value, district: e.target.value })
            }
            disabled={!value.city}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm disabled:opacity-60"
          >
            <option value="">İlçe seçin</option>
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor={`${idPrefix}-address`}
            className="mb-1.5 block text-xs text-ink-muted"
          >
            Adres
          </label>
          <textarea
            id={`${idPrefix}-address`}
            name={`${idPrefix}_address`}
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Mahalle, sokak, bina no"
          />
        </div>
        {showPostalCode ? (
          <div>
            <label
              htmlFor={`${idPrefix}-postal`}
              className="mb-1.5 block text-xs text-ink-muted"
            >
              Posta kodu
            </label>
            <input
              id={`${idPrefix}-postal`}
              name={`${idPrefix}_postal_code`}
              value={value.postalCode ?? ""}
              onChange={(e) =>
                onChange({ ...value, postalCode: e.target.value })
              }
              inputMode="numeric"
              maxLength={10}
              placeholder="Örn. 34000"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            />
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}

"use client";

import {
  TURKEY_CITIES,
  getTurkeyDistricts,
} from "@/data/turkey-locations";

type AddressValue = {
  city: string;
  district: string;
  address: string;
};

type Props = {
  idPrefix: string;
  label: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  disabled?: boolean;
};

export function AddressFields({
  idPrefix,
  label,
  value,
  onChange,
  disabled = false,
}: Props) {
  const districts = getTurkeyDistricts(value.city);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-city`} className="mb-1.5 block text-xs text-ink-muted">
            İl
          </label>
          <select
            id={`${idPrefix}-city`}
            value={value.city}
            onChange={(e) =>
              onChange({ city: e.target.value, district: "", address: value.address })
            }
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          >
            <option value="">Seçin</option>
            {TURKEY_CITIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-district`} className="mb-1.5 block text-xs text-ink-muted">
            İlçe
          </label>
          <select
            id={`${idPrefix}-district`}
            value={value.district}
            onChange={(e) =>
              onChange({ ...value, district: e.target.value })
            }
            disabled={!value.city}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm disabled:opacity-60"
          >
            <option value="">Seçin</option>
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${idPrefix}-address`} className="mb-1.5 block text-xs text-ink-muted">
            Adres
          </label>
          <textarea
            id={`${idPrefix}-address`}
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Mahalle, sokak, bina no"
          />
        </div>
      </div>
    </fieldset>
  );
}

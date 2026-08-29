"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  changePassword,
  updateProfile,
  type ProfileActionState,
} from "@/app/actions/profile";

const initial: ProfileActionState = {};

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Kaydediliyor…" : label}
    </button>
  );
}

type Profile = {
  full_name: string | null;
  phone: string | null;
  email: string;
  account_type: string;
  company_name: string | null;
  tax_number: string | null;
  tax_office: string | null;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [profileState, profileAction] = useFormState(updateProfile, initial);
  const [passwordState, passwordAction] = useFormState(changePassword, initial);
  const [accountType, setAccountType] = useState<"individual" | "corporate">(
    profile.account_type === "corporate" ? "corporate" : "individual"
  );

  return (
    <div className="space-y-8">
      <form action={profileAction} className="space-y-4 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-base font-semibold">Profil bilgileri</h2>
        <p className="text-sm text-ink-muted">{profile.email}</p>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Ad soyad</label>
          <input
            name="full_name"
            defaultValue={profile.full_name ?? ""}
            required
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Telefon</label>
          <input
            name="phone"
            defaultValue={profile.phone ?? ""}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Hesap tipi</legend>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="account_type"
                value="individual"
                checked={accountType === "individual"}
                onChange={() => setAccountType("individual")}
              />
              Bireysel
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="account_type"
                value="corporate"
                checked={accountType === "corporate"}
                onChange={() => setAccountType("corporate")}
              />
              Kurumsal
            </label>
          </div>
        </fieldset>
        {accountType === "corporate" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Şirket adı</label>
              <input
                name="company_name"
                defaultValue={profile.company_name ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Vergi no</label>
              <input
                name="tax_number"
                defaultValue={profile.tax_number ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Vergi dairesi
              </label>
              <input
                name="tax_office"
                defaultValue={profile.tax_office ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>
          </div>
        ) : null}
        {profileState.error ? (
          <p className="text-sm text-error">{profileState.error}</p>
        ) : null}
        {profileState.success ? (
          <p className="text-sm text-success">{profileState.success}</p>
        ) : null}
        <SaveButton label="Profili kaydet" />
      </form>

      <form action={passwordAction} className="space-y-4 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-base font-semibold">Şifre değiştir</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Yeni şifre</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Şifre tekrar</label>
          <input
            name="password_confirm"
            type="password"
            required
            minLength={8}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        {passwordState.error ? (
          <p className="text-sm text-error">{passwordState.error}</p>
        ) : null}
        {passwordState.success ? (
          <p className="text-sm text-success">{passwordState.success}</p>
        ) : null}
        <SaveButton label="Şifreyi güncelle" />
      </form>
    </div>
  );
}

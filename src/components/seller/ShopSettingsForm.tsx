"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  updateShopSettings,
  uploadShopAsset,
  type ShopActionState,
} from "@/app/actions/shop";
import type { SellerShop } from "@/lib/auth/require-seller";

const initial: ShopActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
  );
}

export function ShopSettingsForm({ shop }: { shop: SellerShop }) {
  const [state, action] = useFormState(updateShopSettings, initial);
  const [logoUrl, setLogoUrl] = useState(shop.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(shop.banner_url ?? "");
  const [uploading, startUpload] = useTransition();

  const upload = (kind: "logo" | "banner", file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    startUpload(async () => {
      const result = await uploadShopAsset(fd);
      if (result.url) {
        if (kind === "logo") setLogoUrl(result.url);
        else setBannerUrl(result.url);
      }
    });
  };

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      <input type="hidden" name="logo_url" value={logoUrl} />
      <input type="hidden" name="banner_url" value={bannerUrl} />

      <div>
        <label className="mb-1.5 block text-sm font-medium">Mağaza adı</label>
        <input
          name="name"
          defaultValue={shop.name}
          required
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Açıklama</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={shop.description ?? ""}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Logo</label>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="mb-2 h-16 object-contain" />
          ) : null}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => upload("logo", e.target.files?.[0] ?? null)}
            className="block w-full text-xs"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Banner</label>
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt=""
              className="mb-2 h-16 w-full rounded-lg object-cover"
            />
          ) : null}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => upload("banner", e.target.files?.[0] ?? null)}
            className="block w-full text-xs"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">IBAN</label>
        <input
          name="iban"
          defaultValue={shop.iban ?? ""}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Şirket adı</label>
          <input
            name="company_name"
            defaultValue={shop.company_name ?? ""}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Vergi no</label>
          <input
            name="tax_number"
            defaultValue={shop.tax_number ?? ""}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Vergi dairesi</label>
          <input
            name="tax_office"
            defaultValue={shop.tax_office ?? ""}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
      </div>

      {state.error ? <p className="text-sm text-error">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-success">{state.success}</p>
      ) : null}
      <SaveButton />
    </form>
  );
}

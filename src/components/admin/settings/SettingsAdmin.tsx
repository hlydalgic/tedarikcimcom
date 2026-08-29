"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateMarketplaceFeatures,
  updateMarketplaceSettings,
  uploadMarketplaceAsset,
} from "@/app/actions/settings";
import type {
  MarketplaceFeatures,
  MarketplaceSettings,
} from "@/lib/marketplace/settings";

type Props = {
  settings: MarketplaceSettings;
  features: MarketplaceFeatures;
};

const FEATURE_LABELS: { key: keyof MarketplaceFeatures; label: string }[] = [
  { key: "reviews_enabled", label: "Ürün yorumları" },
  { key: "favorites_enabled", label: "Favoriler" },
  { key: "quotes_enabled", label: "Teklif / quote" },
  { key: "special_shipping_enabled", label: "Özel kargo" },
  { key: "product_variants_enabled", label: "Ürün varyantları" },
  { key: "seller_chat_enabled", label: "Satıcı sohbeti" },
  { key: "b2b_pricing_enabled", label: "B2B fiyatlandırma" },
  { key: "compare_products_enabled", label: "Ürün karşılaştırma" },
  { key: "coupons_enabled", label: "Kuponlar" },
];

const SOCIAL_KEYS = [
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "facebook",
] as const;

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-sm uppercase"
          placeholder="#0A4D8C"
        />
        <span
          className="h-11 w-11 shrink-0 rounded-xl border border-border"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}

export function SettingsAdmin({ settings, features }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [marketplaceName, setMarketplaceName] = useState(
    settings.marketplace_name
  );
  const [shortName, setShortName] = useState(settings.short_name);
  const [tagline, setTagline] = useState(settings.tagline ?? "");
  const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? "");
  const [faviconUrl, setFaviconUrl] = useState(settings.favicon_url ?? "");
  const [primary, setPrimary] = useState(settings.primary_color);
  const [secondary, setSecondary] = useState(settings.secondary_color);
  const [accent, setAccent] = useState(settings.accent_color);
  const [supportEmail, setSupportEmail] = useState(
    settings.support_email ?? ""
  );
  const [supportPhone, setSupportPhone] = useState(
    settings.support_phone ?? ""
  );
  const [companyName, setCompanyName] = useState(settings.company_name ?? "");
  const [seoTitle, setSeoTitle] = useState(settings.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    settings.seo_description ?? ""
  );
  const [social, setSocial] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const k of SOCIAL_KEYS) {
      base[k] = settings.social_links[k] ?? "";
    }
    return base;
  });
  const [flags, setFlags] = useState(features);

  const upload = (kind: "logo" | "favicon", file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    startTransition(async () => {
      const result = await uploadMarketplaceAsset(fd);
      if (result.error) setError(result.error);
      else if (result.url) {
        if (kind === "logo") setLogoUrl(result.url);
        else setFaviconUrl(result.url);
      }
    });
  };

  const saveSettings = () => {
    startTransition(async () => {
      setError(null);
      const result = await updateMarketplaceSettings({
        marketplaceName,
        shortName,
        tagline: tagline || null,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
        supportEmail: supportEmail || null,
        supportPhone: supportPhone || null,
        companyName: companyName || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        socialLinks: social,
      });
      if (result.error) setError(result.error);
      else {
        setMessage("Ayarlar kaydedildi.");
        router.refresh();
      }
    });
  };

  const saveFeatures = () => {
    startTransition(async () => {
      setError(null);
      const result = await updateMarketplaceFeatures(flags);
      if (result.error) setError(result.error);
      else {
        setMessage("Özellik bayrakları kaydedildi.");
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Ayarlar</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Marketplace branding ve feature flag’ler
        </p>
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

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-base font-semibold">Branding</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Marka adı</label>
            <input
              value={marketplaceName}
              onChange={(e) => setMarketplaceName(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Kısa ad</label>
            <input
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Logo</label>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="mb-2 h-16 object-contain"
              />
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload("logo", e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-ink-muted"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Favicon</label>
            {faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl}
                alt=""
                className="mb-2 h-10 w-10 object-contain"
              />
            ) : null}
            <input
              type="file"
              accept="image/*,.ico"
              onChange={(e) => upload("favicon", e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-ink-muted"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ColorField label="Primary" value={primary} onChange={setPrimary} />
          <ColorField
            label="Secondary"
            value={secondary}
            onChange={setSecondary}
          />
          <ColorField label="Accent" value={accent} onChange={setAccent} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Destek email
            </label>
            <input
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Destek telefon
            </label>
            <input
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Şirket adı
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">SEO title</label>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              SEO description
            </label>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Sosyal medya</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SOCIAL_KEYS.map((key) => (
              <input
                key={key}
                value={social[key] ?? ""}
                onChange={(e) =>
                  setSocial((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={`${key} URL`}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={saveSettings}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Kaydediliyor…" : "Ayarları kaydet"}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-base font-semibold">Özellikler</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {FEATURE_LABELS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={(e) =>
                  setFlags((prev) => ({ ...prev, [key]: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={saveFeatures}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Kaydediliyor…" : "Özellikleri kaydet"}
          </button>
        </div>
      </section>
    </div>
  );
}

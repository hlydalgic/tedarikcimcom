import Link from "next/link";
import { BrandMark } from "@/components/branding/BrandMark";

const footerColumns = [
  {
    title: "Keşfet",
    links: [
      { label: "Kategoriler", href: "/kategoriler" },
      { label: "Markalar", href: "/markalar" },
      { label: "Öne çıkanlar", href: "/#one-cikanlar" },
    ],
  },
  {
    title: "Alıcı",
    links: [
      { label: "Hesabım", href: "/hesabim" },
      { label: "Siparişlerim", href: "/hesabim/siparisler" },
      { label: "Favorilerim", href: "/hesabim/favoriler" },
    ],
  },
  {
    title: "Satıcı",
    links: [
      { label: "Satıcı ol", href: "/satici-ol" },
      { label: "Satıcı paneli", href: "/panel" },
      { label: "Komisyon", href: "/satici-ol#komisyon" },
    ],
  },
  {
    title: "Destek",
    links: [
      { label: "Yardım merkezi", href: "/yardim" },
      { label: "İletişim", href: "/iletisim" },
      { label: "Gizlilik", href: "/gizlilik" },
    ],
  },
];

export type FooterBranding = {
  marketplaceName: string;
  shortName: string;
  logoUrl: string | null;
  tagline: string | null;
  seoDescription: string | null;
};

export function Footer({ branding }: { branding: FooterBranding }) {
  const blurb =
    branding.seoDescription?.trim() ||
    branding.tagline?.trim() ||
    "Doğrulanmış satıcılardan teknik ürünleri güvenle bulun.";

  return (
    <footer className="border-t border-border bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <BrandMark
              shortName={branding.shortName}
              logoUrl={branding.logoUrl}
              invert
              className="text-2xl"
            />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
              {blurb}
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {branding.marketplaceName}. Tüm hakları
            saklıdır.
          </p>
          <p>Güvenli ödeme · iyzico Pazaryeri</p>
        </div>
      </div>
    </footer>
  );
}

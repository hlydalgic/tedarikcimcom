import Link from "next/link";

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
      { label: "Siparişlerim", href: "/hesabim/siparislerim" },
      { label: "Favorilerim", href: "/hesabim/favorilerim" },
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

export function Footer() {
  return (
    <footer className="border-t border-border bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="font-display text-2xl font-bold tracking-tight">
              tedarik<span className="text-accent">cim</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
              Türkiye&apos;nin teknik ürünler pazaryeri. Boru, vana, hırdavat ve
              daha fazlasını güvenle tedarik edin.
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
          <p>© {new Date().getFullYear()} tedarikcim. Tüm hakları saklıdır.</p>
          <p>Güvenli ödeme · iyzico Pazaryeri</p>
        </div>
      </div>
    </footer>
  );
}

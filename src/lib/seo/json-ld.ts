export type BreadcrumbItem = { name: string; href?: string };

export function buildBreadcrumbListJsonLd(
  items: BreadcrumbItem[],
  siteUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href
        ? { item: `${siteUrl.replace(/\/$/, "")}${item.href}` }
        : {}),
    })),
  };
}

export function buildProductJsonLd(input: {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  currency: string;
  inStock: boolean;
  sku?: string | null;
  url: string;
  sellerName: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    sku: input.sku ?? undefined,
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: input.currency,
      price: input.price,
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: input.sellerName,
      },
    },
  };
}

export function buildOrganizationJsonLd(input: {
  name: string;
  url: string;
  logoUrl?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  socialLinks?: Record<string, string>;
}): Record<string, unknown> {
  const sameAs = Object.values(input.socialLinks ?? {}).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    logo: input.logoUrl ?? undefined,
    description: input.description ?? undefined,
    email: input.email ?? undefined,
    telephone: input.phone ?? undefined,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function buildWebSiteJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${input.url.replace(/\/$/, "")}/arama?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

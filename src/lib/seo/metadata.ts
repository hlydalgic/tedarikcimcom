import type { Metadata } from "next";

type BuildPageMetadataInput = {
  title: string;
  description?: string | null;
  siteName: string;
  canonicalPath: string;
  siteUrl: string;
  imageUrl?: string | null;
  noIndex?: boolean;
};

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const canonical = `${input.siteUrl.replace(/\/$/, "")}${input.canonicalPath}`;
  const description = input.description?.trim() || undefined;

  return {
    title: input.title,
    description,
    alternates: { canonical },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description,
      siteName: input.siteName,
      url: canonical,
      type: "website",
      locale: "tr_TR",
      images: input.imageUrl ? [{ url: input.imageUrl }] : undefined,
    },
    twitter: {
      card: input.imageUrl ? "summary_large_image" : "summary",
      title: input.title,
      description,
      images: input.imageUrl ? [input.imageUrl] : undefined,
    },
  };
}

import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getCategoryBySlugPath,
} from "@/lib/catalog/queries";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { CategoryPageContent } from "@/components/catalog/CategoryPageContent";
import { CategoryPageSkeleton } from "@/components/catalog/CategoryPageSkeleton";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 300;

type PageProps = {
  params: { slug: string[] };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getCategoryBySlugPath(params.slug);
  if (!category) return { title: "Kategori bulunamadı" };

  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);
  const title = category.seo_title ?? category.name;
  const description =
    category.seo_description ?? category.description ?? settings.seo_description;
  const canonicalPath = `/kategoriler/${params.slug.join("/")}`;

  return buildPageMetadata({
    title: `${title} | ${settings.marketplace_name}`,
    description,
    siteName: settings.marketplace_name,
    canonicalPath,
    siteUrl,
    imageUrl: category.image_url,
  });
}

export default function CategoryPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <CategoryPageContent slug={params.slug} searchParams={searchParams} />
    </Suspense>
  );
}

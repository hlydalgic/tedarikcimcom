import type { Metadata } from "next";
import { ShopPageContent } from "@/components/catalog/ShopPageContent";
import { decodeQuerySegment } from "@/lib/catalog/isr-query";
import { buildShopMetadata } from "@/lib/catalog/page-metadata";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type PageProps = {
  params: { q: string; slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildShopMetadata(params.slug);
}

export default function IsrShopPage({ params }: PageProps) {
  return (
    <ShopPageContent
      slug={params.slug}
      searchParams={decodeQuerySegment(params.q)}
    />
  );
}

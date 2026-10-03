import type { Metadata } from "next";
import { ShopPageContent } from "@/components/catalog/ShopPageContent";
import {
  buildShopMetadata,
  type PageSearchParams,
} from "@/lib/catalog/page-metadata";

export const revalidate = 300;

type PageProps = {
  params: { slug: string };
  searchParams: PageSearchParams;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildShopMetadata(params.slug);
}

export default function ShopPage({ params, searchParams }: PageProps) {
  return <ShopPageContent slug={params.slug} searchParams={searchParams} />;
}

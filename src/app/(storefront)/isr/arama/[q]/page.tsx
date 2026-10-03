import type { Metadata } from "next";
import { SearchPageContent } from "@/components/catalog/SearchPageContent";
import { decodeQuerySegment } from "@/lib/catalog/isr-query";
import { buildSearchMetadata } from "@/lib/catalog/page-metadata";

export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

type PageProps = {
  params: { q: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildSearchMetadata(decodeQuerySegment(params.q));
}

export default function IsrSearchPage({ params }: PageProps) {
  return <SearchPageContent searchParams={decodeQuerySegment(params.q)} />;
}

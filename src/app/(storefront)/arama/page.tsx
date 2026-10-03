import type { Metadata } from "next";
import { SearchPageContent } from "@/components/catalog/SearchPageContent";
import {
  buildSearchMetadata,
  type PageSearchParams,
} from "@/lib/catalog/page-metadata";

export const revalidate = 60;

type PageProps = {
  searchParams: PageSearchParams;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  return buildSearchMetadata(searchParams);
}

export default function SearchPage({ searchParams }: PageProps) {
  return <SearchPageContent searchParams={searchParams} />;
}

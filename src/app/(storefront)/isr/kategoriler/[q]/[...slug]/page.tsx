import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryPageContent } from "@/components/catalog/CategoryPageContent";
import { CategoryPageSkeleton } from "@/components/catalog/CategoryPageSkeleton";
import { decodeQuerySegment } from "@/lib/catalog/isr-query";
import { buildCategoryMetadata } from "@/lib/catalog/page-metadata";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type PageProps = {
  params: { q: string; slug: string[] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildCategoryMetadata(params.slug);
}

export default function IsrCategoryPage({ params }: PageProps) {
  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <CategoryPageContent
        slug={params.slug}
        searchParams={decodeQuerySegment(params.q)}
      />
    </Suspense>
  );
}

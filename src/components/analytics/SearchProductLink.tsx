"use client";

import Link from "next/link";
import { logClientSearch } from "@/lib/analytics/client";

type SearchProductLinkProps = {
  href: string;
  searchQuery: string;
  productId: string;
  className?: string;
  children: React.ReactNode;
};

export function SearchProductLink({
  href,
  searchQuery,
  productId,
  className,
  children,
}: SearchProductLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        void logClientSearch({
          query: searchQuery,
          resultCount: 0,
          clickedProductId: productId,
        });
      }}
    >
      {children}
    </Link>
  );
}

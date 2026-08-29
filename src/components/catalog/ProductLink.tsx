"use client";

import Link from "next/link";
import { SearchProductLink } from "@/components/analytics/SearchProductLink";

type ProductLinkProps = {
  href: string;
  className?: string;
  searchQuery?: string;
  productId?: string;
  children: React.ReactNode;
};

export function ProductLink({
  href,
  className,
  searchQuery,
  productId,
  children,
}: ProductLinkProps) {
  if (searchQuery && productId) {
    return (
      <SearchProductLink
        href={href}
        searchQuery={searchQuery}
        productId={productId}
        className={className}
      >
        {children}
      </SearchProductLink>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

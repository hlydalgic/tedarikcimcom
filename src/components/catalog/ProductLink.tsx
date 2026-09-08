"use client";

import { AppLink } from "@/components/ui/AppLink";
import { SearchProductLink } from "@/components/analytics/SearchProductLink";

type ProductLinkProps = {
  href: string;
  className?: string;
  searchQuery?: string;
  productId?: string;
  prefetch?: boolean;
  children: React.ReactNode;
};

export function ProductLink({
  href,
  className,
  searchQuery,
  productId,
  prefetch = true,
  children,
}: ProductLinkProps) {
  if (searchQuery && productId) {
    return (
      <SearchProductLink
        href={href}
        searchQuery={searchQuery}
        productId={productId}
        className={className}
        prefetch={prefetch}
      >
        {children}
      </SearchProductLink>
    );
  }

  return (
    <AppLink href={href} prefetch={prefetch} className={className}>
      {children}
    </AppLink>
  );
}

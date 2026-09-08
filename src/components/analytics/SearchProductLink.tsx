"use client";

import { AppLink } from "@/components/ui/AppLink";
import { logClientSearch } from "@/lib/analytics/client";

type SearchProductLinkProps = {
  href: string;
  searchQuery: string;
  productId: string;
  className?: string;
  prefetch?: boolean;
  children: React.ReactNode;
};

export function SearchProductLink({
  href,
  searchQuery,
  productId,
  className,
  prefetch = true,
  children,
}: SearchProductLinkProps) {
  return (
    <AppLink
      href={href}
      prefetch={prefetch}
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
    </AppLink>
  );
}

"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { name: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0"
    >
      <ol className="flex w-max min-w-full items-center gap-1 whitespace-nowrap text-sm text-ink-muted md:w-auto md:flex-wrap md:whitespace-normal">
        <li>
          <Link href="/" className="transition hover:text-primary">
            Ana sayfa
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="transition hover:text-primary">
                {item.name}
              </Link>
            ) : (
              <span className="font-medium text-ink">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

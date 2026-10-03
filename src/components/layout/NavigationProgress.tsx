"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageTransitionBar } from "@/components/layout/PageTransitionBar";

const MAX_VISIBLE_MS = 10_000;

/**
 * Instant feedback on internal link clicks without a route-level loading.tsx:
 * a root Suspense boundary would start streaming before notFound() runs and
 * turn every 404 into a 200 response.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target as Element | null;
      if (!target || target.closest("button")) return;

      const anchor = target.closest("a");
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      setActive(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), MAX_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [active]);

  return active ? <PageTransitionBar /> : null;
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getSessionId, trackClientEvent } from "@/lib/analytics/client";

function eventForPath(pathname: string): string | null {
  if (pathname === "/") return "view_home";
  if (pathname.startsWith("/kategoriler/")) return "view_category";
  if (pathname.startsWith("/urunler/")) return "view_product";
  if (pathname === "/satici-ol") return "seller_signup_started";
  if (pathname === "/odeme") return "begin_checkout";
  return null;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    const eventName = eventForPath(pathname);
    if (!eventName) return;

    // Ensure session id exists before tracking
    getSessionId();
    void trackClientEvent(eventName, { path: pathname });
  }, [pathname]);

  return null;
}

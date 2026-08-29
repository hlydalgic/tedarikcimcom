"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/client";

export function CategoryFilterTracker() {
  const params = useSearchParams();
  const logged = useRef<string | null>(null);

  useEffect(() => {
    const keys = Array.from(params.keys()).filter(
      (k) => k !== "sayfa" && k !== "sira"
    );
    if (!keys.length) return;

    const signature = params.toString();
    if (logged.current === signature) return;
    logged.current = signature;

    void trackClientEvent("apply_filter", {
      filter_keys: keys.join(","),
    });
  }, [params]);

  return null;
}

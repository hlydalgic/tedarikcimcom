"use client";

import { useEffect, useRef } from "react";
import { logClientSearch, trackClientEvent } from "@/lib/analytics/client";

type SearchPageTrackerProps = {
  query: string;
  resultCount: number;
};

export function SearchPageTracker({ query, resultCount }: SearchPageTrackerProps) {
  const logged = useRef<string | null>(null);

  useEffect(() => {
    if (query.length < 2) return;
    const key = `${query}:${resultCount}`;
    if (logged.current === key) return;
    logged.current = key;

    void logClientSearch({ query, resultCount });
    void trackClientEvent("search", { query, result_count: resultCount });
  }, [query, resultCount]);

  return null;
}

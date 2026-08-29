"use client";

const STORAGE_KEY = "tedarikcim_recently_viewed";
const MAX_ITEMS = 10;

export type RecentlyViewedItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  viewedAt: number;
};

function readStorage(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentlyViewedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: RecentlyViewedItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  return readStorage().sort((a, b) => b.viewedAt - a.viewedAt);
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">) {
  const existing = readStorage().filter((i) => i.id !== item.id);
  const next: RecentlyViewedItem[] = [
    { ...item, viewedAt: Date.now() },
    ...existing,
  ].slice(0, MAX_ITEMS);
  writeStorage(next);
}

export function clearRecentlyViewed() {
  localStorage.removeItem(STORAGE_KEY);
}

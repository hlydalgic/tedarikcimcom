/**
 * Next.js 14 renders any page that reads `searchParams` dynamically, so
 * filterable storefront pages could never be served from the ISR cache.
 * Middleware instead rewrites `/kategoriler/a/b?sira=x` to
 * `/isr/kategoriler/<encoded query>/a/b`, giving every query combination its
 * own cacheable path. Must stay edge-runtime safe (used by middleware).
 */

export const ISR_PREFIX = "/isr";
const EMPTY_QUERY_SEGMENT = "-";
const IGNORED_PARAMS = new Set(["_rsc", "fbclid", "gclid", "msclkid"]);

export type DecodedSearchParams = Record<string, string | string[]>;

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeQuerySegment(searchParams: URLSearchParams): string {
  const entries = Array.from(searchParams.entries())
    .filter(([key, value]) => {
      if (!value) return false;
      if (IGNORED_PARAMS.has(key)) return false;
      return !key.startsWith("utm_");
    })
    .sort(([ak, av], [bk, bv]) =>
      ak === bk ? av.localeCompare(bv) : ak.localeCompare(bk)
    );

  if (!entries.length) return EMPTY_QUERY_SEGMENT;
  return toBase64Url(new URLSearchParams(entries).toString());
}

export function decodeQuerySegment(segment: string): DecodedSearchParams {
  const result: DecodedSearchParams = {};
  if (!segment || segment === EMPTY_QUERY_SEGMENT) return result;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(fromBase64Url(decodeURIComponent(segment)));
  } catch {
    return result;
  }

  params.forEach((value, key) => {
    const existing = result[key];
    if (existing === undefined) result[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else result[key] = [existing, value];
  });
  return result;
}

/** Internal ISR path for a public storefront URL, or null if not applicable. */
export function storefrontIsrRewritePath(
  pathname: string,
  searchParams: URLSearchParams
): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const [root, ...rest] = segments;

  if (root === "kategoriler" && rest.length >= 1) {
    return `${ISR_PREFIX}/kategoriler/${encodeQuerySegment(searchParams)}/${rest.join("/")}`;
  }
  if (root === "magaza" && rest.length === 1) {
    return `${ISR_PREFIX}/magaza/${encodeQuerySegment(searchParams)}/${rest[0]}`;
  }
  if (root === "arama" && rest.length === 0) {
    return `${ISR_PREFIX}/arama/${encodeQuerySegment(searchParams)}`;
  }
  return null;
}

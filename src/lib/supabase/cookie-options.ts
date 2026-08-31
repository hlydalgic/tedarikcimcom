import type { CookieOptions } from "@supabase/ssr";

/** Shared auth cookie domain for storefront + admin subdomain. */
export function getSupabaseCookieOptions(): CookieOptions | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!siteUrl.includes("ahadabuldum.com")) return undefined;

  return {
    domain: ".ahadabuldum.com",
    path: "/",
    sameSite: "lax",
    secure: true,
  };
}

export function mergeSupabaseCookieOptions(
  options?: CookieOptions
): CookieOptions | undefined {
  const shared = getSupabaseCookieOptions();
  if (!shared) return options;
  return { ...options, ...shared };
}

import type { NextRequest } from "next/server";

const ADMIN_PATH_PREFIX = "/admin";

export function getAdminHost(): string | null {
  const adminUrl = process.env.ADMIN_URL?.trim();
  if (!adminUrl) return null;
  try {
    return new URL(adminUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function getAdminBaseUrl(): string | null {
  const adminUrl = process.env.ADMIN_URL?.trim();
  if (!adminUrl) return null;
  return adminUrl.replace(/\/$/, "");
}

export function getRequestHost(request: NextRequest): string | null {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;
  return host.split(":")[0]?.toLowerCase() ?? null;
}

export function isAdminSubdomainHost(host: string | null): boolean {
  const adminHost = getAdminHost();
  if (!adminHost || !host) return false;
  return host.toLowerCase() === adminHost;
}

export function isAdminSubdomainRequest(request: NextRequest): boolean {
  return isAdminSubdomainHost(getRequestHost(request));
}

/** Paths that must not be rewritten to /admin on the admin subdomain. */
export function shouldSkipAdminSubdomainRewrite(pathname: string): boolean {
  return (
    pathname.startsWith(ADMIN_PATH_PREFIX) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/giris" ||
    pathname.startsWith("/giris/") ||
    pathname === "/kayit" ||
    pathname.startsWith("/kayit/") ||
    pathname.startsWith("/sifre-sifirla")
  );
}

export function shouldRedirectToStorefront(pathname: string): boolean {
  return (
    pathname === "/giris" ||
    pathname.startsWith("/giris/") ||
    pathname === "/kayit" ||
    pathname.startsWith("/kayit/") ||
    pathname.startsWith("/sifre-sifirla")
  );
}

export function mapAdminSubdomainPath(pathname: string): string {
  if (pathname === "/") return ADMIN_PATH_PREFIX;
  return `${ADMIN_PATH_PREFIX}${pathname}`;
}

export function resolveInternalPathname(
  request: NextRequest,
  host: string | null
): string {
  const { pathname } = request.nextUrl;
  if (!isAdminSubdomainHost(host) || shouldSkipAdminSubdomainRewrite(pathname)) {
    return pathname;
  }
  return mapAdminSubdomainPath(pathname);
}

export function buildAdminSubdomainUrlFromAdminPath(
  pathname: string,
  search = ""
): string | null {
  const adminBase = getAdminBaseUrl();
  if (!adminBase || !pathname.startsWith(ADMIN_PATH_PREFIX)) return null;

  if (pathname === ADMIN_PATH_PREFIX) {
    return `${adminBase}${search}`;
  }

  const publicPath = pathname.slice(ADMIN_PATH_PREFIX.length) || "/";
  return `${adminBase}${publicPath}${search}`;
}

export function buildAdminSubdomainReturnUrl(
  request: NextRequest,
  host: string | null
): string {
  const adminBase =
    getAdminBaseUrl() ??
    (host ? `https://${host}` : request.nextUrl.origin);
  const { pathname, search } = request.nextUrl;

  if (pathname === "/" || pathname === ADMIN_PATH_PREFIX) {
    return adminBase;
  }

  if (pathname.startsWith(`${ADMIN_PATH_PREFIX}/`)) {
    const publicPath = pathname.slice(ADMIN_PATH_PREFIX.length) || "/";
    return `${adminBase}${publicPath}${search}`;
  }

  return `${adminBase}${pathname}${search}`;
}

export function getStorefrontBaseUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    request.nextUrl.origin
  );
}

export function isAdminDestinationRedirect(redirectTo: string): boolean {
  if (redirectTo.startsWith(ADMIN_PATH_PREFIX)) return true;
  const adminBase = getAdminBaseUrl();
  if (!adminBase) return false;
  return redirectTo === adminBase || redirectTo.startsWith(`${adminBase}/`);
}

export function resolvePostLoginRedirect(redirectTo: string): string {
  const trimmed = redirectTo.trim();
  if (!trimmed) return "/";

  const adminBase = getAdminBaseUrl();
  if (adminBase && (trimmed === adminBase || trimmed.startsWith(`${adminBase}/`))) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) return trimmed;
  return "/";
}

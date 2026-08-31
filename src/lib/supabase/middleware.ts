import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getUserRoles,
  isAdminRole,
  isSellerRole,
} from "@/lib/auth/get-user-roles";
import {
  buildAdminSubdomainReturnUrl,
  buildAdminSubdomainUrlFromAdminPath,
  getRequestHost,
  getStorefrontBaseUrl,
  isAdminSubdomainHost,
  mapAdminSubdomainPath,
  resolveInternalPathname,
  shouldRedirectToStorefront,
  shouldSkipAdminSubdomainRewrite,
} from "@/lib/site/admin-subdomain";
import { mergeSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

export async function updateSession(request: NextRequest) {
  const host = getRequestHost(request);
  const adminSubdomain = isAdminSubdomainHost(host);
  const { pathname: rawPathname } = request.nextUrl;

  if (!adminSubdomain && rawPathname.startsWith("/admin")) {
    const adminTarget = buildAdminSubdomainUrlFromAdminPath(
      rawPathname,
      request.nextUrl.search
    );
    if (adminTarget) {
      return NextResponse.redirect(adminTarget, 308);
    }
  }

  let rewriteUrl: URL | null = null;
  if (
    adminSubdomain &&
    !shouldSkipAdminSubdomainRewrite(rawPathname)
  ) {
    rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = mapAdminSubdomainPath(rawPathname);
  }

  let supabaseResponse = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl)
    : NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = rewriteUrl
          ? NextResponse.rewrite(rewriteUrl)
          : NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(
            name,
            value,
            mergeSupabaseCookieOptions(options)
          )
        );
      },
    },
    cookieOptions: mergeSupabaseCookieOptions(),
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = resolveInternalPathname(request, host);

  if (
    user &&
    (pathname === "/giris" || pathname === "/kayit") &&
    !adminSubdomain
  ) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/giris", getStorefrontBaseUrl(request));
      loginUrl.searchParams.set(
        "redirect",
        adminSubdomain
          ? buildAdminSubdomainReturnUrl(request, host)
          : `${pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(loginUrl);
    }

    const roles = await getUserRoles(supabase, user.id);
    if (!isAdminRole(roles)) {
      return NextResponse.redirect(new URL("/", getStorefrontBaseUrl(request)));
    }
  }

  if (adminSubdomain && !pathname.startsWith("/admin")) {
    if (shouldRedirectToStorefront(rawPathname)) {
      const target = new URL(
        `${rawPathname}${request.nextUrl.search}`,
        getStorefrontBaseUrl(request)
      );
      return NextResponse.redirect(target);
    }
    return NextResponse.redirect(new URL("/", getStorefrontBaseUrl(request)));
  }

  if (
    pathname.startsWith("/hesabim") ||
    pathname.startsWith("/satici-ol")
  ) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/giris";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/panel")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/giris";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const roles = await getUserRoles(supabase, user.id);
    const { data: shop } = await supabase
      .from("shops")
      .select("status")
      .eq("owner_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const hasActiveSellerAccess =
      isSellerRole(roles) && shop?.status === "active";

    const isPendingPage =
      pathname === "/panel/beklemede" ||
      pathname.startsWith("/panel/beklemede/");

    if (isPendingPage) {
      if (hasActiveSellerAccess) {
        const panelUrl = request.nextUrl.clone();
        panelUrl.pathname = "/panel";
        panelUrl.search = "";
        return NextResponse.redirect(panelUrl);
      }

      const { data: pendingApp } = await supabase
        .from("seller_applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      const canWait =
        pendingApp != null ||
        shop?.status === "pending" ||
        (isSellerRole(roles) && shop != null);

      if (!canWait) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/satici-ol";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }

      return supabaseResponse;
    }

    if (!hasActiveSellerAccess) {
      const { data: pendingApp } = await supabase
        .from("seller_applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.search = "";
      if (
        pendingApp != null ||
        shop?.status === "pending" ||
        (isSellerRole(roles) && shop != null)
      ) {
        redirectUrl.pathname = "/panel/beklemede";
      } else {
        redirectUrl.pathname = "/satici-ol";
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

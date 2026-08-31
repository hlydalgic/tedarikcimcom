import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/security/errors";
import {
  authCallbackRedirectUrl,
  createRouteHandlerClient,
  normalizeOtpType,
} from "@/lib/supabase/route-handler";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

function resolveSuccessPath(next: string, otpType: string | null): string {
  if (next === "/giris" || otpType === "signup" || otpType === "email") {
    return "/auth/dogrulandi";
  }
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeRaw = searchParams.get("type");
  const otpType = typeRaw ? normalizeOtpType(typeRaw) : null;

  const successPath = resolveSuccessPath(next, otpType);
  let response = NextResponse.redirect(
    authCallbackRedirectUrl(request, successPath)
  );
  const supabase = createRouteHandlerClient(request, response);

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });

    if (!error) {
      return response;
    }

    logServerError("auth/callback-verifyOtp", error);
    return NextResponse.redirect(
      authCallbackRedirectUrl(request, "/giris?error=auth")
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    logServerError("auth/callback-exchangeCode", error);
  }

  return NextResponse.redirect(
    authCallbackRedirectUrl(request, "/giris?error=auth")
  );
}

import { NextResponse } from "next/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/security/rate-limit";

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function enforceApiRateLimit(
  request: Request,
  action: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = clientIp(request);
  const key = getRateLimitKey(action, ip);
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: result.retryAfterSeconds
          ? { "Retry-After": String(result.retryAfterSeconds) }
          : undefined,
      }
    );
  }
  return null;
}

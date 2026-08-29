import { headers } from "next/headers";
import { checkRateLimit, getRateLimitKey } from "@/lib/security/rate-limit";

export function getClientIp(): string {
  const headersList = headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headersList.get("x-real-ip") || "unknown";
}

export function enforceFormRateLimit(
  action: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): { allowed: true } | { allowed: false; message: string } {
  const ip = getClientIp();
  const result = checkRateLimit(getRateLimitKey(action, ip), limit, windowMs);

  if (!result.allowed) {
    return {
      allowed: false,
      message: `Çok fazla istek gönderdiniz. Lütfen ${result.retryAfterSeconds ?? 60} saniye sonra tekrar deneyin.`,
    };
  }

  return { allowed: true };
}

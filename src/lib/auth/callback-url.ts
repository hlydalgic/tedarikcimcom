import "server-only";

import { getSiteUrl } from "@/lib/email/resend";

type GenerateLinkProperties = {
  hashed_token?: string | null;
  verification_type?: string | null;
  action_link?: string | null;
};

/**
 * Server-generated auth links must use token_hash (verifyOtp), not action_link (PKCE).
 * action_link expects a code_verifier cookie that only exists in browser-initiated flows.
 */
export function buildAuthCallbackUrl(
  properties: GenerateLinkProperties,
  next: string
): string | null {
  const siteUrl = getSiteUrl();
  const tokenHash = properties.hashed_token?.trim();
  const type = properties.verification_type?.trim();

  if (tokenHash && type) {
    const params = new URLSearchParams({
      token_hash: tokenHash,
      type,
      next,
    });
    return `${siteUrl}/auth/callback?${params.toString()}`;
  }

  return properties.action_link?.trim() || null;
}

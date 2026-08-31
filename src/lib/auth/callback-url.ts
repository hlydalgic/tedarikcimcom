import "server-only";

type GenerateLinkProperties = {
  hashed_token?: string | null;
  verification_type?: string | null;
  action_link?: string | null;
};

function siteUrlFromEnv(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function buildSignupVerifyUrl(tokenHash: string): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "signup",
    next: "/giris",
  });
  return `${siteUrlFromEnv()}/auth/callback?${params.toString()}`;
}

export function buildRecoveryVerifyUrl(tokenHash: string): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "recovery",
    next: "/sifre-sifirla/yeni",
  });
  return `${siteUrlFromEnv()}/auth/callback?${params.toString()}`;
}

/**
 * Server-generated auth links must use token_hash (verifyOtp), not action_link (PKCE).
 */
export function buildAuthCallbackUrl(
  properties: GenerateLinkProperties,
  next: string,
  typeOverride?: string
): string | null {
  const tokenHash = properties.hashed_token?.trim();
  const type = (typeOverride ?? properties.verification_type)?.trim();

  if (tokenHash && type) {
    const params = new URLSearchParams({
      token_hash: tokenHash,
      type,
      next,
    });
    return `${siteUrlFromEnv()}/auth/callback?${params.toString()}`;
  }

  return properties.action_link?.trim() || null;
}

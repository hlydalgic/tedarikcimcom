import "server-only";

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY ?? "");

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

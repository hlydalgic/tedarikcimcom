import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string;
};

export async function requireUser(redirectTo = "/giris"): Promise<AuthUser> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    const path = redirectTo.startsWith("/")
      ? `/giris?redirect=${encodeURIComponent(redirectTo)}`
      : "/giris";
    redirect(path);
  }

  return { id: user!.id, email: user!.email! };
}

export function slugifyShopName(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

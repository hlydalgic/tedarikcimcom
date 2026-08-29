import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getUserRoles, isAdminRole } from "@/lib/auth/get-user-roles";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminClientContext =
  | { ok: true; userId: string; admin: SupabaseClient }
  | { ok: false; error: string };

export async function requireAdminClient(): Promise<AdminClientContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Giriş yapmalısınız." };
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!isAdminRole(roles)) {
    return { ok: false, error: "Bu işlem için yetkiniz yok." };
  }

  try {
    return { ok: true, userId: user.id, admin: getSupabaseAdmin() };
  } catch {
    return { ok: false, error: "Admin istemcisi başlatılamadı." };
  }
}

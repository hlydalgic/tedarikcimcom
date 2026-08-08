import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/auth/get-user-roles";

export type AdminUser = {
  id: string;
  email: string | undefined;
  roles: string[];
};

/**
 * Server-side admin gate. Matches DB helper public.is_admin() semantics
 * (`'admin' = ANY(roles)` on public.users).
 */
export async function requireAdmin(redirectTo = "/admin"): Promise<AdminUser> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/giris?redirect=${encodeURIComponent(redirectTo)}`);
  }

  const roles = await getUserRoles(supabase, user.id);

  if (!isAdminRole(roles)) {
    redirect("/");
  }

  return {
    id: user.id,
    email: user.email,
    roles,
  };
}

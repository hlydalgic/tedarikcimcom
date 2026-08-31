import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUserRoles, isSellerRole } from "@/lib/auth/get-user-roles";

export type HeaderUser = {
  id: string;
  email: string;
  displayName: string;
  isSeller: boolean;
};

export async function getHeaderUser(): Promise<HeaderUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, roles")
    .eq("id", user.id)
    .maybeSingle();

  const roles = profile?.roles?.length
    ? (profile.roles as string[])
    : await getUserRoles(supabase, user.id);

  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Hesabım";

  return {
    id: user.id,
    email: user.email ?? "",
    displayName,
    isSeller: isSellerRole(roles),
  };
}

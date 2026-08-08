import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserRoles(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("users")
    .select("roles")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getUserRoles] query failed:", error.message);
    }
    return ["buyer"];
  }

  if (!data?.roles?.length) {
    return ["buyer"];
  }

  return data.roles as string[];
}

export function isAdminRole(roles: string[]): boolean {
  return roles.includes("admin");
}

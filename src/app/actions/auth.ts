"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/auth/get-user-roles";

export type AuthActionState = {
  error?: string;
};

export async function signIn(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Giriş başarısız. Bilgilerinizi kontrol edin." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum açılamadı." };
  }

  // Admin panel redirect only if admin; otherwise home
  if (redirectTo.startsWith("/admin")) {
    const roles = await getUserRoles(supabase, user.id);
    if (!isAdminRole(roles)) {
      redirect("/");
    }
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/admin");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}

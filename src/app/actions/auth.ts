"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getUserRoles, isAdminRole } from "@/lib/auth/get-user-roles";
import { buildRecoveryVerifyUrl } from "@/lib/auth/callback-url";
import { getSiteUrl } from "@/lib/email/resend";
import {
  sendPasswordResetEmail,
} from "@/lib/email/send";
import { enforceFormRateLimit } from "@/lib/security/request";
import { passwordChangeSchema } from "@/lib/validation/password";
import { getClientErrorMessage, logServerError } from "@/lib/security/errors";

export type AuthActionState = {
  error?: string;
  success?: string;
};

const registerSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta girin."),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı.")
    .max(72, "Şifre çok uzun."),
  full_name: z.string().trim().min(2, "Ad soyad gerekli.").max(120),
});

export async function signIn(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rate = enforceFormRateLimit("auth.signin", 8, 15 * 60 * 1000);
  if (!rate.allowed) return { error: rate.message };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/");

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

  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

  if (safeRedirect.startsWith("/admin")) {
    const roles = await getUserRoles(supabase, user.id);
    if (!isAdminRole(roles)) {
      redirect("/");
    }
  }

  redirect(safeRedirect);
}

export async function signUp(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rate = enforceFormRateLimit("auth.signup", 5, 15 * 60 * 1000);
  if (!rate.allowed) return { error: rate.message };

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form." };
  }

  const data = parsed.data;
  const siteUrl = getSiteUrl();

  const supabase = createClient();
  const { error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/giris`,
      data: {
        full_name: data.full_name,
      },
    },
  });

  if (signUpError) {
    const msg = signUpError.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { error: "Bu e-posta ile kayıtlı bir hesap var." };
    }
    logServerError("auth/signup", signUpError);
    return {
      error: getClientErrorMessage(
        "Kayıt oluşturulamadı.",
        signUpError.message
      ),
    };
  }

  return { success: "check_email" };
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rate = enforceFormRateLimit("auth.reset", 5, 15 * 60 * 1000);
  if (!rate.allowed) return { error: rate.message };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) {
    return { error: "Geçerli bir e-posta girin." };
  }

  const siteUrl = getSiteUrl();
  const successMessage =
    "E-posta adresinize sıfırlama bağlantısı gönderildi (hesap varsa).";

  try {
    const admin = getSupabaseAdmin();
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/sifre-sifirla/yeni")}`,
      },
    });

    const tokenHash = linkData?.properties?.hashed_token?.trim();
    const resetUrl = tokenHash ? buildRecoveryVerifyUrl(tokenHash) : null;

    if (!error && resetUrl) {
      await sendPasswordResetEmail({
        to: email,
        resetUrl,
      });
    }
  } catch (err) {
    logServerError("auth/password-reset", err);
  }

  return { success: successMessage };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rate = enforceFormRateLimit("auth.update-password", 5, 15 * 60 * 1000);
  if (!rate.allowed) return { error: rate.message };

  const parsed = passwordChangeSchema.safeParse({
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz şifre." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı. Bağlantıyı yeniden isteyin." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "Şifre güncellenemedi." };
  }

  redirect("/giris?reset=1");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}

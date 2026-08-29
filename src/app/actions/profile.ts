"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import { enforceFormRateLimit } from "@/lib/security/request";
import { passwordChangeSchema } from "@/lib/validation/password";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().nullable(),
});

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireUser("/hesabim/profil");
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: String(formData.get("phone") ?? "") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form." };
  }

  const supabase = createClient();
  const d = parsed.data;
  const { error } = await supabase
    .from("users")
    .update({
      full_name: d.full_name,
      phone: d.phone,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/hesabim/profil");
  return { success: "Profil güncellendi." };
}

export async function changePassword(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const rate = enforceFormRateLimit("profile.change-password", 5, 15 * 60 * 1000);
  if (!rate.allowed) return { error: rate.message };

  await requireUser("/hesabim/profil");

  const parsed = passwordChangeSchema.safeParse({
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz şifre." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { error: "Şifre değiştirilemedi." };

  return { success: "Şifreniz güncellendi." };
}

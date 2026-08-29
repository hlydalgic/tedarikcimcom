"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

const profileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(30).optional().nullable(),
    account_type: z.enum(["individual", "corporate"]),
    company_name: z.string().trim().optional().nullable(),
    tax_number: z.string().trim().optional().nullable(),
    tax_office: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.account_type === "corporate") {
      if (!data.company_name || data.company_name.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Şirket adı gerekli.",
          path: ["company_name"],
        });
      }
      const tax = (data.tax_number ?? "").replace(/\s/g, "");
      if (!/^\d{10,11}$/.test(tax)) {
        ctx.addIssue({
          code: "custom",
          message: "Vergi no 10 veya 11 haneli olmalı.",
          path: ["tax_number"],
        });
      }
      if (!data.tax_office || data.tax_office.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Vergi dairesi gerekli.",
          path: ["tax_office"],
        });
      }
    }
  });

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireUser("/hesabim/profil");
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: String(formData.get("phone") ?? "") || null,
    account_type: formData.get("account_type") || "individual",
    company_name: String(formData.get("company_name") ?? "") || null,
    tax_number: String(formData.get("tax_number") ?? "") || null,
    tax_office: String(formData.get("tax_office") ?? "") || null,
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
      account_type: d.account_type,
      company_name: d.account_type === "corporate" ? d.company_name : null,
      tax_number: d.account_type === "corporate" ? d.tax_number : null,
      tax_office: d.account_type === "corporate" ? d.tax_office : null,
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
  await requireUser("/hesabim/profil");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");

  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }
  if (password !== confirm) {
    return { error: "Şifreler eşleşmiyor." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Şifre değiştirilemedi." };

  return { success: "Şifreniz güncellendi." };
}

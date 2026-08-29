"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import { addressInputSchema } from "@/lib/validation/addresses";

export type AddressActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createAddress(input: {
  title?: string;
  full_name: string;
  phone: string;
  city: string;
  district: string;
  address_line: string;
  postal_code?: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}): Promise<AddressActionResult> {
  const user = await requireUser("/odeme");
  const parsed = addressInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz adres.",
    };
  }

  const data = parsed.data;
  const supabase = createClient();

  if (data.is_default_shipping) {
    await supabase
      .from("addresses")
      .update({ is_default_shipping: false })
      .eq("user_id", user.id);
  }
  if (data.is_default_billing) {
    await supabase
      .from("addresses")
      .update({ is_default_billing: false })
      .eq("user_id", user.id);
  }

  const { data: row, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      title: data.title?.trim() || null,
      full_name: data.full_name,
      phone: data.phone,
      city: data.city,
      district: data.district,
      address_line: data.address_line,
      postal_code: data.postal_code?.trim() || null,
      is_default_shipping: Boolean(data.is_default_shipping),
      is_default_billing: Boolean(data.is_default_billing),
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/odeme");
  revalidatePath("/hesabim");
  return { ok: true, id: row.id };
}

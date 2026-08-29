"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";

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
  const supabase = createClient();

  if (!input.full_name.trim() || !input.phone.trim() || !input.city || !input.district || !input.address_line.trim()) {
    return { ok: false, error: "Adres alanlarını eksiksiz doldurun." };
  }

  if (input.is_default_shipping) {
    await supabase
      .from("addresses")
      .update({ is_default_shipping: false })
      .eq("user_id", user.id);
  }
  if (input.is_default_billing) {
    await supabase
      .from("addresses")
      .update({ is_default_billing: false })
      .eq("user_id", user.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      title: input.title?.trim() || null,
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      city: input.city,
      district: input.district,
      address_line: input.address_line.trim(),
      postal_code: input.postal_code?.trim() || null,
      is_default_shipping: Boolean(input.is_default_shipping),
      is_default_billing: Boolean(input.is_default_billing),
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/odeme");
  revalidatePath("/hesabim");
  return { ok: true, id: data.id };
}

import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type SellerShop = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: string;
  moderation_mode: "MANUAL" | "AUTO";
  iban: string | null;
  tax_number: string | null;
  tax_office: string | null;
  company_name: string | null;
};

export type SellerContext = {
  userId: string;
  email: string;
  roles: string[];
  shop: SellerShop | null;
  /** seller role but no active shop yet (pending application / pending shop) */
  pendingAccess: boolean;
};

export async function getSellerContext(): Promise<SellerContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const roles = await getUserRoles(supabase, user.id);
  const isSeller = roles.includes("seller");

  const admin = getSupabaseAdmin();
  const { data: shop } = await admin
    .from("shops")
    .select(
      `id, owner_id, slug, name, description, logo_url, banner_url, status,
       moderation_mode, iban, tax_number, tax_office, company_name`
    )
    .eq("owner_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const activeShop =
    shop && shop.status === "active"
      ? (shop as SellerShop)
      : null;

  return {
    userId: user.id,
    email: user.email,
    roles,
    shop: activeShop,
    pendingAccess:
      isSeller && !activeShop
        ? true
        : !isSeller
          ? false
          : false,
  };
}

/**
 * Requires authenticated user with seller role and an active shop.
 * Redirects to login, home, or pending page as appropriate.
 */
export async function requireSeller(
  redirectTo = "/panel"
): Promise<SellerContext & { shop: SellerShop }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(`/giris?redirect=${encodeURIComponent(redirectTo)}`);
  }

  const roles = await getUserRoles(supabase, user.id);
  const admin = getSupabaseAdmin();

  const { data: shop } = await admin
    .from("shops")
    .select(
      `id, owner_id, slug, name, description, logo_url, banner_url, status,
       moderation_mode, iban, tax_number, tax_office, company_name`
    )
    .eq("owner_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: pendingApp } = await admin
    .from("seller_applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!roles.includes("seller") || !shop || shop.status !== "active") {
    if (pendingApp || (shop && shop.status === "pending")) {
      redirect("/panel/beklemede");
    }
    redirect("/satici-ol");
  }

  return {
    userId: user.id,
    email: user.email,
    roles,
    shop: shop as SellerShop,
    pendingAccess: false,
  };
}

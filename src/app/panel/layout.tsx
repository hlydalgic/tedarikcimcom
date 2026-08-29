import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export const metadata: Metadata = {
  title: "Satıcı paneli",
  robots: { index: false, follow: false },
};

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(`/giris?redirect=${encodeURIComponent("/panel")}`);
  }

  const roles = await getUserRoles(supabase, user.id);
  const admin = getSupabaseAdmin();
  const { data: shop } = await admin
    .from("shops")
    .select("id, name, status")
    .eq("owner_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasActiveShop =
    roles.includes("seller") && shop?.status === "active";

  if (!hasActiveShop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    );
  }

  const settings = await getMarketplaceSettings();

  return (
    <div className="flex min-h-screen bg-background">
      <SellerSidebar
        shortName={settings.short_name}
        shopName={shop!.name}
        email={user.email}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border bg-surface px-6">
          <p className="text-sm font-medium text-ink-muted">Satıcı paneli</p>
        </header>
        <div className="flex-1 p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

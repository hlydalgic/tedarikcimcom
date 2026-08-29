import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function SellerPendingPage() {
  const settings = await getMarketplaceSettings();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris?redirect=/panel/beklemede");

  const roles = await getUserRoles(supabase, user.id);
  const admin = getSupabaseAdmin();
  const { data: shop } = await admin
    .from("shops")
    .select("id, status")
    .eq("owner_id", user.id)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();

  if (roles.includes("seller") && shop?.status === "active") {
    redirect("/panel");
  }

  const { data: pendingApp } = await admin
    .from("seller_applications")
    .select("id, company_name, created_at")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-soft">
      <h1 className="font-display text-xl font-bold text-ink">
        Başvurunuz inceleniyor
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        {pendingApp
          ? `${pendingApp.company_name} başvurunuz ${settings.marketplace_name} ekibi tarafından inceleniyor.`
          : shop?.status === "pending"
            ? "Mağazanız henüz aktif değil. Onay sonrası panele erişebilirsiniz."
            : "Satıcı paneline erişmek için onaylı bir mağazanız olmalı."}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold"
        >
          Mağazaya dön
        </Link>
        {!pendingApp && !shop ? (
          <Link
            href="/satici-ol"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
          >
            Satıcı başvurusu
          </Link>
        ) : null}
      </div>
    </div>
  );
}

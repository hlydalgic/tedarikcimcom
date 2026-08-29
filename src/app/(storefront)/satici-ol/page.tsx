import { SellerApplicationForm } from "@/components/seller/SellerApplicationForm";
import { requireUser } from "@/lib/auth/require-user";
import { listCategories } from "@/lib/categories/queries";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { createClient } from "@/lib/supabase/server";

export default async function SaticiOlPage() {
  await requireUser("/satici-ol");
  const settings = await getMarketplaceSettings();
  const categories = await listCategories({ includeArchived: false });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pending } = user
    ? await supabase
        .from("seller_applications")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
          Satıcı ol
        </h1>
        <p className="mt-2 text-sm text-ink-muted md:text-base">
          {settings.marketplace_name} üzerinde satış yapmak için başvurun.
          Başvurunuz incelendikten sonra bilgilendirileceksiniz.
        </p>
      </div>

      {pending ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center">
          <p className="font-medium text-ink">Başvurunuz inceleniyor</p>
          <p className="mt-2 text-sm text-ink-muted">
            Bekleyen başvurunuz var. Sonuç e-posta ile iletilecektir.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          <SellerApplicationForm categories={categories} />
        </div>
      )}
    </div>
  );
}

import { ShopSettingsForm } from "@/components/seller/ShopSettingsForm";
import { requireSeller } from "@/lib/auth/require-seller";

export default async function MagazaPage() {
  const ctx = await requireSeller("/panel/magaza");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Mağaza ayarları
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Mağaza profili ve ödeme bilgileri
        </p>
      </div>
      <ShopSettingsForm shop={ctx.shop} />
    </div>
  );
}

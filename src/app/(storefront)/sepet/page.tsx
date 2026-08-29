import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { CartSyncOnMount } from "@/components/cart/CartSyncOnMount";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return { title: `Sepet | ${settings.marketplace_name}` };
}

export default async function SepetPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <Breadcrumb items={[{ name: "Sepet" }]} />
      <h1 className="mb-6 font-display text-2xl font-bold text-ink md:text-3xl">
        Sepetim
      </h1>
      <CartSyncOnMount />
      <CartPageClient isLoggedIn={Boolean(user)} />
    </div>
  );
}

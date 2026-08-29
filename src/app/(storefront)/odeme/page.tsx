import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { listUserAddresses } from "@/lib/cart/queries";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { CartSyncOnMount } from "@/components/cart/CartSyncOnMount";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMarketplaceSettings();
  return { title: `Ödeme | ${settings.marketplace_name}` };
}

export default async function OdemePage() {
  await requireUser("/odeme");
  const addresses = await listUserAddresses();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { name: "Sepet", href: "/sepet" },
          { name: "Ödeme" },
        ]}
      />
      <h1 className="mb-6 font-display text-2xl font-bold text-ink md:text-3xl">
        Siparişi tamamla
      </h1>
      <CartSyncOnMount />
      <CheckoutClient addresses={addresses} />
    </div>
  );
}

import Link from "next/link";
import { SellerProductList } from "@/components/seller/SellerProductList";
import { requireSeller } from "@/lib/auth/require-seller";
import {
  listSellerProducts,
  type ProductStatus,
} from "@/lib/seller/queries";

type Props = {
  searchParams: { status?: string };
};

export default async function UrunlerPage({ searchParams }: Props) {
  const ctx = await requireSeller("/panel/urunler");
  const status = (searchParams.status ?? "ALL") as ProductStatus | "ALL";
  const products = await listSellerProducts({
    shopId: ctx.shop.id,
    sellerId: ctx.userId,
    status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Ürünlerim</h1>
          <p className="mt-1 text-sm text-ink-muted">{products.length} ürün</p>
        </div>
        <Link
          href="/panel/urunler/ekle"
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
        >
          Ürün ekle
        </Link>
      </div>
      <SellerProductList products={products} currentStatus={status} />
    </div>
  );
}

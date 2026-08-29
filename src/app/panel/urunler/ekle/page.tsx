import { ProductCreateWizard } from "@/components/seller/ProductCreateWizard";
import { fetchSellerFormSchema } from "@/app/actions/products";
import { requireSeller } from "@/lib/auth/require-seller";
import { getCategoryTree } from "@/lib/categories/queries";

export default async function UrunEklePage() {
  await requireSeller("/panel/urunler/ekle");
  const tree = await getCategoryTree({ includeArchived: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Ürün ekle</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Kategori seçin; form alanları otomatik oluşur.
        </p>
      </div>
      <ProductCreateWizard
        categoryTree={tree}
        loadSchema={fetchSellerFormSchema}
      />
    </div>
  );
}

import { ProductModerationAdmin } from "@/components/admin/products/ProductModerationAdmin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminPendingProductsPage() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select(
      `id, title, price, stock, status, description, created_at, submitted_for_review_at,
       shops:shop_id ( name ),
       users:seller_id ( email ),
       categories:category_id ( name ),
       product_images ( url, is_primary, sort_order )`
    )
    .eq("status", "PENDING_REVIEW")
    .order("submitted_for_review_at", { ascending: true });

  if (error) throw new Error(error.message);

  const products = (data ?? []).map((row) => {
    const shop = row.shops as { name: string } | { name: string }[] | null;
    const user = row.users as { email: string } | { email: string }[] | null;
    const cat = row.categories as { name: string } | { name: string }[] | null;
    const images = (row.product_images ?? []) as Array<{
      url: string;
      is_primary: boolean;
      sort_order: number;
    }>;
    const primary =
      images.find((i) => i.is_primary) ??
      [...images].sort((a, b) => a.sort_order - b.sort_order)[0];

    return {
      id: row.id as string,
      title: row.title as string,
      price: Number(row.price),
      stock: Number(row.stock),
      status: row.status as string,
      description: (row.description as string | null) ?? null,
      created_at: row.created_at as string,
      submitted_for_review_at:
        (row.submitted_for_review_at as string | null) ?? null,
      shop_name: Array.isArray(shop) ? shop[0]?.name ?? null : shop?.name ?? null,
      seller_email: Array.isArray(user)
        ? user[0]?.email ?? null
        : user?.email ?? null,
      category_name: Array.isArray(cat)
        ? cat[0]?.name ?? null
        : cat?.name ?? null,
      image_url: primary?.url ?? null,
    };
  });

  return <ProductModerationAdmin products={products} />;
}

import { SellerApplicationsAdmin } from "@/components/admin/sellers/SellerApplicationsAdmin";
import { listCategories } from "@/lib/categories/queries";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminSellerApplicationsPage() {
  const admin = getSupabaseAdmin();
  const [{ data, error }, categories] = await Promise.all([
    admin
      .from("seller_applications")
      .select(
        `id, user_id, company_type, company_name, shop_name, tax_number, tax_office,
         iban, bank_name, phone, activity_city, activity_district, activity_address,
         billing_same_as_activity, billing_city, billing_district, billing_address,
         return_city, return_district, return_address,
         category_ids, e_invoice_declared, kvkk_accepted, seller_contract_accepted,
         tax_certificate_path, signature_circular_path,
         status, reviewed_at, rejection_reason, created_at,
         users:user_id ( email, full_name )`
      )
      .order("created_at", { ascending: false }),
    listCategories({ includeArchived: false }),
  ]);

  if (error) throw new Error(error.message);

  const categoryNames = Object.fromEntries(
    categories.map((c) => [c.id, c.name])
  );

  const applications = (data ?? []).map((row) => {
    const usersRaw = row.users as
      | { email: string; full_name: string | null }
      | { email: string; full_name: string | null }[]
      | null;
    const users = Array.isArray(usersRaw) ? usersRaw[0] ?? null : usersRaw;
    return {
      ...row,
      category_ids: (row.category_ids as string[]) ?? [],
      users,
    };
  });

  return (
    <SellerApplicationsAdmin
      applications={applications}
      categoryNames={categoryNames}
    />
  );
}

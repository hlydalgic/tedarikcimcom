import { ProfileForm } from "@/components/account/ProfileForm";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilPage() {
  const authUser = await requireUser("/hesabim/profil");
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, phone, email, account_type, company_name, tax_number, tax_office"
    )
    .eq("id", authUser.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Profilim</h1>
      <ProfileForm
        profile={{
          email: profile?.email ?? authUser.email,
          full_name: profile?.full_name ?? null,
          phone: profile?.phone ?? null,
          account_type: profile?.account_type ?? "individual",
          company_name: profile?.company_name ?? null,
          tax_number: profile?.tax_number ?? null,
          tax_office: profile?.tax_office ?? null,
        }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSubdomain } from "@/lib/auth/require-admin";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { isAdminSubdomainRequestFromHeaders } from "@/lib/site/admin-subdomain-server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminSubdomainRequestFromHeaders()) {
    notFound();
  }

  const admin = await requireAdminSubdomain();
  const settings = await getMarketplaceSettings();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar shortName={settings.short_name} email={admin.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border bg-surface px-6">
          <p className="text-sm font-medium text-ink-muted">Yönetim paneli</p>
        </header>
        <div className="flex-1 p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";

export default function AdminPendingProductsPage() {
  redirect("/admin/urunler?durum=PENDING_REVIEW");
}

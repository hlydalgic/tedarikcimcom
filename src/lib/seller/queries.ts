import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatMoneyTry } from "@/lib/format/money";
import type { ProductStatus, SellerProductListItem } from "@/lib/seller/types";

export type { ProductStatus, SellerProductListItem };
export { formatMoneyTry };

export type DashboardStats = {
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  pendingOrders: number;
  pendingSettlement: number;
  recentOrders: Array<{
    id: string;
    suborder_number: string;
    seller_net_amount: number;
    status: string;
    created_at: string;
  }>;
  performanceWarning: string | null;
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function daysAgo(n: number) {
  const x = new Date();
  x.setDate(x.getDate() - n);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export async function getSellerDashboardStats(
  shopId: string,
  sellerId: string
): Promise<DashboardStats> {
  const admin = getSupabaseAdmin();

  const [{ data: orders }, { data: settlements }, { count: pendingCount }] =
    await Promise.all([
      admin
        .from("seller_orders")
        .select("id, suborder_number, seller_net_amount, status, created_at")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("seller_settlements")
        .select("seller_net_amount, settlement_status")
        .eq("shop_id", shopId)
        .in("settlement_status", [
          "PENDING",
          "WAITING_DELIVERY",
          "ELIGIBLE",
          "RELEASE_REQUESTED",
        ]),
      admin
        .from("seller_orders")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .in("status", ["PAID", "PROCESSING"]),
    ]);

  const list = orders ?? [];
  const sumNet = (fromIso: string) =>
    list
      .filter(
        (o) =>
          o.created_at >= fromIso &&
          !["CANCELLED", "REFUNDED"].includes(o.status)
      )
      .reduce((acc, o) => acc + Number(o.seller_net_amount ?? 0), 0);

  const pendingSettlement = (settlements ?? []).reduce(
    (acc, s) => acc + Number(s.seller_net_amount ?? 0),
    0
  );

  const { count: rejectedCount } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("seller_id", sellerId)
    .eq("status", "REJECTED");

  let performanceWarning: string | null = null;
  if ((rejectedCount ?? 0) >= 3) {
    performanceWarning =
      "Birden fazla ürününüz reddedildi. Kategori kurallarını ve görselleri kontrol edin.";
  }

  return {
    salesToday: sumNet(startOfDay()),
    salesWeek: sumNet(daysAgo(7)),
    salesMonth: sumNet(daysAgo(30)),
    pendingOrders: pendingCount ?? 0,
    pendingSettlement,
    recentOrders: list.slice(0, 5).map((o) => ({
      id: o.id,
      suborder_number: o.suborder_number,
      seller_net_amount: Number(o.seller_net_amount ?? 0),
      status: o.status,
      created_at: o.created_at,
    })),
    performanceWarning,
  };
}

export async function listSellerProducts(input: {
  shopId: string;
  sellerId: string;
  status?: ProductStatus | "ALL";
}): Promise<SellerProductListItem[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from("products")
    .select(
      `id, title, price, stock, status, rejection_reason, created_at, updated_at,
       categories:category_id ( name )`
    )
    .eq("shop_id", input.shopId)
    .eq("seller_id", input.sellerId)
    .neq("status", "ARCHIVED")
    .order("updated_at", { ascending: false });

  if (input.status && input.status !== "ALL") {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const cat = row.categories as
      | { name: string }
      | { name: string }[]
      | null;
    const category_name = Array.isArray(cat)
      ? cat[0]?.name ?? null
      : cat?.name ?? null;
    return {
      id: row.id as string,
      title: row.title as string,
      price: Number(row.price),
      stock: Number(row.stock),
      status: row.status as ProductStatus,
      rejection_reason: (row.rejection_reason as string | null) ?? null,
      category_name,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  });
}

export function slugifyProductTitle(title: string): string {
  return title
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

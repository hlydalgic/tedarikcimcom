import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  AdminDashboardStats,
  AdminLogRow,
  AdminOrderListItem,
  AdminReturnRow,
  AdminSellerListItem,
  AdminSettlementRow,
  AdminUserRow,
  FinancialReportRow,
  GmvTrendRow,
  PlatformOpsSettings,
} from "@/lib/admin/types";

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function jsonNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("admin_get_dashboard_stats");
  if (error) throw new Error(error.message);
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    gmv_today: jsonNum(row.gmv_today),
    gmv_week: jsonNum(row.gmv_week),
    gmv_month: jsonNum(row.gmv_month),
    order_counts: (row.order_counts as Record<string, number>) ?? {},
    active_sellers: jsonNum(row.active_sellers),
    new_users_30d: jsonNum(row.new_users_30d),
    pending_seller_applications: jsonNum(row.pending_seller_applications),
    pending_product_approvals: jsonNum(row.pending_product_approvals),
    open_quote_requests: jsonNum(row.open_quote_requests),
    delayed_orders: jsonNum(row.delayed_orders),
    pending_returns: jsonNum(row.pending_returns),
  };
}

export async function getAdminGmvTrend(days = 30): Promise<GmvTrendRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("admin_get_gmv_trend", { p_days: days });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    day: String(r.day),
    gmv: Number(r.gmv),
    order_count: Number(r.order_count),
  }));
}

export async function getPlatformOpsSettings(): Promise<PlatformOpsSettings> {
  const admin = getSupabaseAdmin();
  const keys = [
    "shipping_business_days",
    "order_delay_warning_days",
    "settlement_period",
    "default_commission_rate",
    "default_settlement_delay_days",
    "payout_hold_days",
  ];
  const { data, error } = await admin
    .from("platform_settings")
    .select("key, value")
    .in("key", keys);
  if (error) throw new Error(error.message);

  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  const rawPeriod = map.get("settlement_period");
  const period =
    rawPeriod === "monthly" || rawPeriod === '"monthly"' ? "monthly" : "weekly";

  return {
    shipping_business_days: jsonNum(map.get("shipping_business_days") ?? 5),
    order_delay_warning_days: jsonNum(map.get("order_delay_warning_days") ?? 3),
    settlement_period: period,
    default_commission_rate: jsonNum(map.get("default_commission_rate") ?? 8),
    default_settlement_delay_days: jsonNum(
      map.get("default_settlement_delay_days") ?? 14
    ),
    payout_hold_days: jsonNum(map.get("payout_hold_days") ?? 14),
  };
}

export async function listAdminSellers(
  status?: string
): Promise<AdminSellerListItem[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from("shops")
    .select(
      `id, name, slug, status, moderation_mode, seller_id, created_at,
       users(email, full_name),
       products(count),
       seller_orders(count)`
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const user = unwrapOne(
      row.users as { email: string; full_name: string | null } | { email: string; full_name: string | null }[]
    );
    const productCount = Array.isArray(row.products)
      ? row.products[0]?.count ?? 0
      : (row.products as { count: number } | null)?.count ?? 0;
    const orderCount = Array.isArray(row.seller_orders)
      ? row.seller_orders[0]?.count ?? 0
      : (row.seller_orders as { count: number } | null)?.count ?? 0;

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      moderation_mode: row.moderation_mode,
      seller_id: row.seller_id,
      seller_name: user?.full_name ?? null,
      seller_email: user?.email ?? null,
      product_count: Number(productCount),
      order_count: Number(orderCount),
      created_at: row.created_at,
    };
  });
}

export async function getAdminSellerDetail(shopId: string) {
  const admin = getSupabaseAdmin();
  const { data: shop, error } = await admin
    .from("shops")
    .select(
      `*, users(id, email, full_name, status),
       products(count),
       seller_orders(count)`
    )
    .eq("id", shopId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!shop) return null;

  const user = unwrapOne(
    shop.users as { id: string; email: string; full_name: string | null; status: string } | { id: string; email: string; full_name: string | null; status: string }[]
  );

  const { data: delayDays } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "order_delay_warning_days")
    .maybeSingle();

  const threshold = jsonNum(delayDays?.value ?? 3);

  const { count: delayedCount } = await admin
    .from("seller_orders")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .in("status", ["PAID", "PROCESSING"])
    .lt(
      "created_at",
      new Date(Date.now() - threshold * 86400000).toISOString()
    );

  const { data: recentOrders } = await admin
    .from("seller_orders")
    .select("id, suborder_number, status, subtotal, created_at, delivered_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: stats } = await admin
    .from("seller_orders")
    .select("subtotal, commission_amount, seller_net_amount, status")
    .eq("shop_id", shopId)
    .not("status", "in", "(CANCELLED,PENDING_PAYMENT)");

  let totalSales = 0;
  let totalCommission = 0;
  for (const o of stats ?? []) {
    totalSales += Number(o.subtotal);
    totalCommission += Number(o.commission_amount);
  }

  return {
    shop,
    user,
    product_count: Array.isArray(shop.products)
      ? shop.products[0]?.count ?? 0
      : 0,
    order_count: Array.isArray(shop.seller_orders)
      ? shop.seller_orders[0]?.count ?? 0
      : 0,
    delayed_count: delayedCount ?? 0,
    total_sales: totalSales,
    total_commission: totalCommission,
    recent_orders: recentOrders ?? [],
  };
}

export async function listAdminOrders(
  status?: string,
  limit = 100
): Promise<AdminOrderListItem[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from("orders")
    .select(
      `id, order_number, status, grand_total, currency, created_at, paid_at,
       users(full_name),
       seller_orders(id)`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const buyer = unwrapOne(
      row.users as { full_name: string | null } | { full_name: string | null }[]
    );
    return {
      id: row.id,
      order_number: row.order_number,
      buyer_name: buyer?.full_name ?? null,
      status: row.status,
      grand_total: Number(row.grand_total),
      currency: row.currency,
      seller_order_count: Array.isArray(row.seller_orders)
        ? row.seller_orders.length
        : 0,
      created_at: row.created_at,
      paid_at: row.paid_at,
    };
  });
}

export async function getAdminOrderDetail(orderId: string) {
  const admin = getSupabaseAdmin();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      `*, users(email, full_name),
       seller_orders(*, shops(name)),
       order_items(*),
       payments(*)`
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return order;
}

export async function listAdminSettlements(
  status?: string
): Promise<AdminSettlementRow[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from("seller_settlements")
    .select(
      `id, order_id, seller_order_id, gross_amount, platform_commission,
       seller_net_amount, currency, settlement_status,
       expected_settlement_at, released_at, created_at,
       seller_orders(suborder_number, orders(order_number)),
       shops(name),
       users(full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    query = query.eq("settlement_status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const so = unwrapOne(
      row.seller_orders as
        | { suborder_number: string; orders: { order_number: string } | { order_number: string }[] }
        | { suborder_number: string; orders: { order_number: string } | { order_number: string }[] }[]
    );
    const order = so ? unwrapOne(so.orders) : null;
    const shop = unwrapOne(row.shops as { name: string } | { name: string }[]);
    const seller = unwrapOne(
      row.users as { full_name: string | null } | { full_name: string | null }[]
    );
    return {
      id: row.id,
      order_id: row.order_id,
      seller_order_id: row.seller_order_id,
      order_number: order?.order_number ?? null,
      suborder_number: so?.suborder_number ?? null,
      shop_name: shop?.name ?? null,
      seller_name: seller?.full_name ?? null,
      gross_amount: Number(row.gross_amount),
      platform_commission: Number(row.platform_commission),
      seller_net_amount: Number(row.seller_net_amount),
      currency: row.currency,
      settlement_status: row.settlement_status,
      expected_settlement_at: row.expected_settlement_at,
      released_at: row.released_at,
      created_at: row.created_at,
    };
  });
}

export async function listAdminReturns(
  status?: string
): Promise<AdminReturnRow[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from("return_requests")
    .select(
      `id, reason, status, refund_amount, currency, created_at,
       orders(order_number),
       seller_orders(suborder_number),
       users(full_name),
       shops(name)`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const order = unwrapOne(
      row.orders as { order_number: string } | { order_number: string }[]
    );
    const so = unwrapOne(
      row.seller_orders as { suborder_number: string } | { suborder_number: string }[]
    );
    const buyer = unwrapOne(
      row.users as { full_name: string | null } | { full_name: string | null }[]
    );
    const shop = unwrapOne(row.shops as { name: string } | { name: string }[]);
    return {
      id: row.id,
      order_number: order?.order_number ?? null,
      suborder_number: so?.suborder_number ?? null,
      buyer_name: buyer?.full_name ?? null,
      shop_name: shop?.name ?? null,
      reason: row.reason,
      status: row.status,
      refund_amount: row.refund_amount != null ? Number(row.refund_amount) : null,
      currency: row.currency,
      created_at: row.created_at,
    };
  });
}

export async function getAdminReturnDetail(returnId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("return_requests")
    .select(
      `*, orders(*), seller_orders(*), users(full_name, email), shops(name)`
    )
    .eq("id", returnId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listAdminUsers(limit = 200): Promise<AdminUserRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name, status, roles, created_at, orders(count)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    status: row.status,
    roles: row.roles ?? [],
    created_at: row.created_at,
    order_count: Array.isArray(row.orders)
      ? row.orders[0]?.count ?? 0
      : (row.orders as { count: number } | null)?.count ?? 0,
  }));
}

export async function getAdminUserDetail(userId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("users")
    .select("*, orders(id, order_number, status, grand_total, created_at)")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listAdminLogs(filters?: {
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<AdminLogRow[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from("admin_logs")
    .select("*, users(email)")
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 200);

  if (filters?.action) query = query.eq("action", filters.action);
  if (filters?.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const adminUser = unwrapOne(
      row.users as { email: string } | { email: string }[]
    );
    return {
      id: row.id,
      admin_user_id: row.admin_user_id,
      admin_email: adminUser?.email ?? null,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      old_data: row.old_data as Record<string, unknown> | null,
      new_data: row.new_data as Record<string, unknown> | null,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      created_at: row.created_at,
    };
  });
}

export async function getFinancialReport(
  from: string,
  to: string
): Promise<FinancialReportRow[]> {
  const admin = getSupabaseAdmin();
  const { data: orders, error } = await admin
    .from("orders")
    .select("grand_total, paid_at, seller_orders(commission_amount, seller_net_amount)")
    .gte("paid_at", from)
    .lte("paid_at", to)
    .not("status", "in", "(CANCELLED,PENDING_PAYMENT,REFUNDED)");

  if (error) throw new Error(error.message);

  const byDay = new Map<string, FinancialReportRow>();

  for (const o of orders ?? []) {
    if (!o.paid_at) continue;
    const day = o.paid_at.slice(0, 10);
    const row = byDay.get(day) ?? {
      label: day,
      gmv: 0,
      commission: 0,
      seller_payout: 0,
      order_count: 0,
    };
    row.gmv += Number(o.grand_total);
    row.order_count += 1;
    const sos = Array.isArray(o.seller_orders) ? o.seller_orders : [o.seller_orders];
    for (const so of sos) {
      if (!so) continue;
      row.commission += Number(so.commission_amount);
      row.seller_payout += Number(so.seller_net_amount);
    }
    byDay.set(day, row);
  }

  return Array.from(byDay.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export async function getSellerSettlementReport(
  from: string,
  to: string
): Promise<
  { shop_name: string; seller_name: string | null; total_net: number; total_commission: number }[]
> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("seller_settlements")
    .select(
      `seller_net_amount, platform_commission, created_at,
       shops(name), users(full_name)`
    )
    .gte("created_at", from)
    .lte("created_at", to);

  if (error) throw new Error(error.message);

  const map = new Map<
    string,
    { shop_name: string; seller_name: string | null; total_net: number; total_commission: number }
  >();

  for (const row of data ?? []) {
    const shop = unwrapOne(row.shops as { name: string } | { name: string }[]);
    const seller = unwrapOne(
      row.users as { full_name: string | null } | { full_name: string | null }[]
    );
    const key = shop?.name ?? "unknown";
    const existing = map.get(key) ?? {
      shop_name: key,
      seller_name: seller?.full_name ?? null,
      total_net: 0,
      total_commission: 0,
    };
    existing.total_net += Number(row.seller_net_amount);
    existing.total_commission += Number(row.platform_commission);
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.total_net - a.total_net);
}

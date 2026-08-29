export type AdminDashboardStats = {
  gmv_today: number;
  gmv_week: number;
  gmv_month: number;
  order_counts: Record<string, number>;
  active_sellers: number;
  new_users_30d: number;
  pending_seller_applications: number;
  pending_product_approvals: number;
  open_quote_requests: number;
  delayed_orders: number;
  pending_returns: number;
};

export type GmvTrendRow = {
  day: string;
  gmv: number;
  order_count: number;
};

export type PlatformOpsSettings = {
  shipping_business_days: number;
  order_delay_warning_days: number;
  settlement_period: "weekly" | "monthly";
  default_commission_rate: number;
  default_settlement_delay_days: number;
  payout_hold_days: number;
};

export type AdminSellerListItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  moderation_mode: string;
  seller_id: string;
  seller_name: string | null;
  seller_email: string | null;
  product_count: number;
  order_count: number;
  created_at: string;
};

export type AdminOrderListItem = {
  id: string;
  order_number: string;
  buyer_name: string | null;
  status: string;
  grand_total: number;
  currency: string;
  seller_order_count: number;
  created_at: string;
  paid_at: string | null;
};

export type AdminSettlementRow = {
  id: string;
  order_id: string;
  seller_order_id: string;
  order_number: string | null;
  suborder_number: string | null;
  shop_name: string | null;
  seller_name: string | null;
  gross_amount: number;
  platform_commission: number;
  seller_net_amount: number;
  currency: string;
  settlement_status: string;
  expected_settlement_at: string | null;
  released_at: string | null;
  created_at: string;
};

export type AdminReturnRow = {
  id: string;
  order_number: string | null;
  suborder_number: string | null;
  buyer_name: string | null;
  shop_name: string | null;
  reason: string;
  status: string;
  refund_amount: number | null;
  currency: string;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  roles: string[];
  created_at: string;
  order_count: number;
};

export type AdminLogRow = {
  id: string;
  admin_user_id: string;
  admin_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type FinancialReportRow = {
  label: string;
  gmv: number;
  commission: number;
  seller_payout: number;
  order_count: number;
};

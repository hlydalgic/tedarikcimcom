import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { requireAdminSubdomain } from "@/lib/auth/require-admin";
import { isAdminSubdomainRequestFromHeaders } from "@/lib/site/admin-subdomain-server";
import {
  getFinancialReport,
  getSellerSettlementReport,
  listAdminLogs,
  listAdminOrders,
  listAdminSettlements,
} from "@/lib/admin/queries";
import { rowsToXlsxBuffer } from "@/lib/admin/export-xlsx";

export async function GET(request: Request) {
  if (!isAdminSubdomainRequestFromHeaders()) {
    notFound();
  }
  await requireAdminSubdomain();
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "gmv";
  const from =
    url.searchParams.get("from") ??
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to =
    url.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  let rows: Record<string, unknown>[] = [];
  let filename = "rapor.xlsx";

  if (type === "gmv") {
    const report = await getFinancialReport(`${from}T00:00:00Z`, `${to}T23:59:59Z`);
    rows = report.map((r) => ({ ...r }));
    filename = `gmv-${from}-${to}.xlsx`;
  } else if (type === "settlements") {
    const report = await getSellerSettlementReport(
      `${from}T00:00:00Z`,
      `${to}T23:59:59Z`
    );
    rows = report.map((r) => ({ ...r }));
    filename = `hakedis-${from}-${to}.xlsx`;
  } else if (type === "orders") {
    const orders = await listAdminOrders("all", 5000);
    rows = orders.map((o) => ({ ...o }));
    filename = "siparisler.xlsx";
  } else if (type === "ledger") {
    const items = await listAdminSettlements("all");
    rows = items.map((s) => ({ ...s }));
    filename = "hakedis-defteri.xlsx";
  } else if (type === "logs") {
    const logs = await listAdminLogs({ limit: 5000 });
    rows = logs.map((l) => ({
      id: l.id,
      action: l.action,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      admin_email: l.admin_email,
      created_at: l.created_at,
    }));
    filename = "admin-loglar.xlsx";
  }

  const buffer = rowsToXlsxBuffer("Rapor", rows);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

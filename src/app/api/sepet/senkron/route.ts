import { NextResponse } from "next/server";
import { syncCartItemsFromDb } from "@/lib/cart/queries";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { productIds?: string[] };
    const ids = Array.isArray(body.productIds)
      ? body.productIds.filter((id) => typeof id === "string").slice(0, 100)
      : [];
    const items = await syncCartItemsFromDb(ids);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "sync failed", items: [] },
      { status: 500 }
    );
  }
}

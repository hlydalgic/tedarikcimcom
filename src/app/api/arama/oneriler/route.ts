import { getSearchSuggestions } from "@/lib/catalog/queries";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const suggestions = await getSearchSuggestions(q, 8);
    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { logSearchEvent } from "@/lib/analytics/events";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  query: z.string().trim().min(2).max(200),
  resultCount: z.number().int().min(0),
  clickedProductId: z.string().uuid().nullable().optional(),
  sessionId: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* ignore */
  }

  await logSearchEvent({
    query: parsed.data.query,
    resultCount: parsed.data.resultCount,
    sessionId: parsed.data.sessionId,
    clickedProductId: parsed.data.clickedProductId,
    userId,
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEventForCurrentUser } from "@/lib/analytics/events";
import { ANALYTICS_EVENTS } from "@/lib/analytics/types";
import { enforceApiRateLimit } from "@/lib/security/api-rate-limit";

const bodySchema = z.object({
  eventName: z.enum(ANALYTICS_EVENTS),
  sessionId: z.string().min(8).max(128),
  properties: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export async function POST(request: Request) {
  const limited = enforceApiRateLimit(request, "analytics.track", 120, 60_000);
  if (limited) return limited;

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

  await trackEventForCurrentUser({
    eventName: parsed.data.eventName,
    sessionId: parsed.data.sessionId,
    properties: parsed.data.properties,
  });

  return NextResponse.json({ ok: true });
}

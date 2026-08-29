import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AnalyticsEventName, AnalyticsProperties } from "@/lib/analytics/types";

export async function trackEvent(input: {
  eventName: AnalyticsEventName;
  sessionId: string;
  properties?: AnalyticsProperties;
  userId?: string | null;
}): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("analytics_events").insert({
      event_name: input.eventName,
      properties: input.properties ?? {},
      session_id: input.sessionId,
      user_id: input.userId ?? null,
    });
  } catch {
    /* analytics must not break UX */
  }
}

export async function trackEventForCurrentUser(input: {
  eventName: AnalyticsEventName;
  sessionId: string;
  properties?: AnalyticsProperties;
}): Promise<void> {
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

  await trackEvent({
    eventName: input.eventName,
    sessionId: input.sessionId,
    properties: input.properties,
    userId,
  });
}

export async function logSearchEvent(input: {
  query: string;
  resultCount: number;
  sessionId: string;
  clickedProductId?: string | null;
  userId?: string | null;
}): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("search_events").insert({
      query: input.query.trim(),
      result_count: input.resultCount,
      clicked_product_id: input.clickedProductId ?? null,
      session_id: input.sessionId,
      user_id: input.userId ?? null,
    });
  } catch {
    /* analytics must not break UX */
  }
}

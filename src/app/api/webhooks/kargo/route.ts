import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@geliver/sdk";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { syncShipmentByGeliverId } from "@/lib/shipping/sync";
import { isGeliverEnabled } from "@/lib/shipping/geliver";

type GeliverWebhookPayload = {
  event?: string;
  metadata?: string;
  data?: {
    id?: string;
    trackingNumber?: string;
    trackingStatus?: {
      id?: string;
      trackingStatusCode?: string;
      statusDate?: string;
    };
  };
};

export async function POST(request: Request) {
  if (!isGeliverEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 503 });
  }

  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const verifyEnabled =
    process.env.GELIVER_WEBHOOK_VERIFY === "true" ||
    process.env.NODE_ENV === "production";
  const valid = verifyWebhookSignature(rawBody, headers, {
    enableVerification: verifyEnabled,
    secret: process.env.GELIVER_WEBHOOK_SECRET?.trim(),
  });

  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let payload: GeliverWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GeliverWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType = payload.event ?? "unknown";
  const shipmentId = payload.data?.id;
  const ts = payload.data?.trackingStatus;

  const eventId =
    ts?.id ??
    `${shipmentId ?? "na"}:${ts?.trackingStatusCode ?? eventType}:${ts?.statusDate ?? ""}`;

  const admin = getSupabaseAdmin();
  const { data: claimed, error: claimErr } = await admin.rpc("claim_webhook_event", {
    p_provider: "geliver",
    p_event_id: eventId,
    p_event_type: eventType,
    p_payload: payload as unknown as Record<string, unknown>,
  });

  if (claimErr) {
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }
  if (!claimed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (eventType === "TRACK_UPDATED" && shipmentId) {
    try {
      await syncShipmentByGeliverId(String(shipmentId), {
        deliveredAt: ts?.statusDate,
      });
    } catch {
      /* sync errors logged server-side; still ack webhook */
    }
  }

  return NextResponse.json({ ok: true });
}

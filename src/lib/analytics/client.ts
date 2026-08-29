const SESSION_KEY = "tc_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";

  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export async function trackClientEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): Promise<void> {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        sessionId: getSessionId(),
        properties: properties ?? {},
      }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

export async function logClientSearch(input: {
  query: string;
  resultCount: number;
  clickedProductId?: string | null;
}): Promise<void> {
  try {
    await fetch("/api/analytics/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        sessionId: getSessionId(),
      }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
